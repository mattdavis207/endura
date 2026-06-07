import secrets
from typing import Literal, Any
from fastapi.responses import RedirectResponse, Response
from pydantic import Json, ValidationError, BaseModel
from pprint import pprint

from fastapi import APIRouter, HTTPException, Query
from app.integrations.strava.strava_client import StravaClient

router = APIRouter(prefix="/integrations/strava", tags=["strava"])

REQUIRED_SCOPES = {"read", "activity:read_all"}

# Local-development state storage. Replace this with persistent, user-linked
# state before running multiple API workers or deploying the OAuth flow.
pending_oauth_states: set[str] = set()
strava_client = StravaClient()

class StravaTokenResponseRefresh(BaseModel):
    access_token: str
    expires_at: int
    expires_in: int
    refresh_token: str

class StravaTokenResponseAuth(BaseModel):
    token_type: str
    expires_at: int
    expires_in: int
    refresh_token: str
    access_token: str
    athlete: Json[Any]


@router.get("/callback")
async def strava_callback(
    code: str | None = None,
    scope: str | None = None,
    state: str | None = None,
    error: str | None = None,
) -> Response:
    
    # validate state
    if not state:
        raise HTTPException(status_code=400, detail="Missing OAuth state")

    if state not in pending_oauth_states:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

    pending_oauth_states.remove(state)

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
    
    # token exchange using authorization code
    token_response = await strava_client.exchange_authorization_code(code)

    pprint(token_response)
    # validate token response
    # try:
    #     StravaTokenResponseAuth.model_validate_json(token_response.json())
        
    # except ValidationError as err:
    #     return RedirectResponse(
    #         "endura://strava-connected?status="
    #     )





    # # redirect to success page
    # return RedirectResponse(
    #     "endura://strava-connected?status=success",
    #     status_code=302,
    # )


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
    approval_prompt: Literal["auto", "force"] = Query(default="auto"),
) -> dict[str, str]:
    state = secrets.token_urlsafe(32)
    pending_oauth_states.add(state)

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
