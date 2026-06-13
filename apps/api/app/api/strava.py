import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated, Literal
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse, Response
from postgrest.exceptions import APIError
from pydantic import BaseModel, ValidationError
from starlette.concurrency import run_in_threadpool
from supabase_auth import User

from app.core.auth import get_current_user
from app.db.supabase import SupabaseConfigurationError
from app.integrations.strava.strava_client import StravaClient
from app.services.strava_oauth import StravaOAuthStore

router = APIRouter(prefix="/integrations/strava", tags=["strava"])

REQUIRED_SCOPES = {"read", "activity:read_all"}

strava_client = StravaClient()
strava_oauth_store = StravaOAuthStore()


class StravaTokenResponseRefresh(BaseModel):
    access_token: str
    expires_at: int
    expires_in: int
    refresh_token: str


class StravaAthlete(BaseModel):
    id: int


class StravaTokenResponseAuth(BaseModel):
    token_type: str
    expires_at: int
    expires_in: int
    refresh_token: str
    access_token: str
    athlete: StravaAthlete


@router.get("/callback")
async def strava_callback(
    code: str | None = None,
    scope: str | None = None,
    state: str | None = None,
    error: str | None = None,
) -> Response:
    if not state:
        raise HTTPException(status_code=400, detail="Missing OAuth state")

    
    try:
        # consume the state in the callback from the authorization url
        user_id = await run_in_threadpool(strava_oauth_store.consume_state, state)
    except SupabaseConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except APIError as exc:
        raise HTTPException(status_code=502, detail="Could not validate OAuth state") from exc

    if user_id is None:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

    if error == "access_denied":
        return RedirectResponse(
            "endura://strava-connected?status=cancelled",
            status_code=302,
        )

    if not code or not scope:
        raise HTTPException(status_code=400, detail="Missing callback parameters")

    if not has_required_scopes(scope):
        return RedirectResponse(
            "endura://strava-connected?status=missing_permissions",
            status_code=302,
        )

    try:
        token_payload = await strava_client.exchange_authorization_code(code)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Strava token exchange failed") from exc

    try:
        token_response = StravaTokenResponseAuth.model_validate(token_payload)
    except ValidationError as exc:
        raise HTTPException(status_code=502, detail="Invalid Strava token response") from exc

    try:
        # offloads the db inserts to background thread awaiting the result in the async endpoint
        await run_in_threadpool(
            strava_oauth_store.save_connection,
            user_id=user_id,
            strava_athlete_id=token_response.athlete.id,
            access_token=token_response.access_token,
            refresh_token=token_response.refresh_token,
            token_type=token_response.token_type,
            expires_at=datetime.fromtimestamp(token_response.expires_at, timezone.utc),
            granted_scopes=parse_scopes(scope),
        )
    except SupabaseConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except APIError as exc:
        raise HTTPException(status_code=502, detail="Could not save Strava connection") from exc

    return RedirectResponse(
        "endura://strava-connected?status=success",
        status_code=302,
    )

# helper function
def parse_scopes(scope: str) -> set[str]:
    return set(scope.replace(",", " ").split())


# helper function to check required scopes in response
def has_required_scopes(scope: str) -> bool:
    granted_scopes = parse_scopes(scope)
    return REQUIRED_SCOPES.issubset(granted_scopes)


# authorize endpoint (opens strava OAuth)
@router.get("/authorize")
async def authorize_with_strava(
    current_user: Annotated[User, Depends(get_current_user)],
    approval_prompt: Annotated[
        Literal["auto", "force"],
        Query(),
    ] = "auto",
) -> dict[str, str]:
    state = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)


    # create the state before opening the authorization url
    try:
        await run_in_threadpool(
            strava_oauth_store.create_state,
            state=state,
            user_id=UUID(current_user.id),
            expires_at=expires_at,
        )
    except SupabaseConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except APIError as exc:
        raise HTTPException(status_code=502, detail="Could not create OAuth state") from exc

    return {
        "authorization_url": strava_client.build_authorization_url(
            state=state,
            approval_prompt=approval_prompt,
        ),
        "app_authorization_url": strava_client.build_app_authorization_url(
            state=state,
            approval_prompt=approval_prompt,
        ),
    }