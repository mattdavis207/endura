import secrets
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse, RedirectResponse, Response

from app.integrations.strava.strava_client import StravaClient

router = APIRouter(prefix="/integrations/strava", tags=["strava"])

REQUIRED_SCOPES = {"read", "activity:read_all"}

# Local-development state storage. Replace this with persistent, user-linked
# state before running multiple API workers or deploying the OAuth flow.
pending_oauth_states: set[str] = set()
strava_client = StravaClient()


@router.get("/callback")
async def strava_callback(
    code: str | None = None,
    scope: str | None = None,
    state: str | None = None,
    error: str | None = None,
) -> Response:
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

    return JSONResponse(
        {
            "code": code,
            "scope": scope,
            "state": state,
            "error": error,
        }
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
