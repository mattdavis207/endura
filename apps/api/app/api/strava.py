import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any, Literal, cast
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
from app.schemas.schemas import Workout
from app.services.strava_oauth import StravaOAuthStore
from app.services.workout_service import WorkoutService

router = APIRouter(prefix="/integrations/strava", tags=["strava"])

REQUIRED_SCOPES = {"read", "activity:read_all"}

strava_client = StravaClient()
strava_oauth_store = StravaOAuthStore()
workout_service = WorkoutService()


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


def add_heart_rate_streams_to_workout(
    workout: Workout,
    streams: dict[str, dict[str, Any]],
) -> Workout:
    time_stream = streams.get("time")
    heart_rate_stream = streams.get("heartrate")

    if not time_stream or not heart_rate_stream:
        return workout

    time_data = time_stream.get("data")
    heart_rate_data = heart_rate_stream.get("data")

    if not isinstance(time_data, list) or not isinstance(heart_rate_data, list):
        return workout

    if not all(isinstance(value, int) for value in time_data):
        return workout

    if not all(isinstance(value, int) for value in heart_rate_data):
        return workout

    original_size = heart_rate_stream.get("original_size")
    resolution = heart_rate_stream.get("resolution")
    series_type = heart_rate_stream.get("series_type")

    workout.heart_rate_time_seconds = cast(list[int], time_data)
    workout.heart_rate_bpm = cast(list[int], heart_rate_data)
    workout.heart_rate_stream_original_size = (
        original_size if isinstance(original_size, int) else None
    )
    workout.heart_rate_stream_resolution = resolution if isinstance(resolution, str) else None
    workout.heart_rate_stream_series_type = series_type if isinstance(series_type, str) else None

    return workout


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

# get 10 most recent strava workout for a user
@router.post("/sync")
async def sync_strava_workouts(
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[dict[str, Any]]:
    # get access token
    access_token = await strava_client.get_valid_access_token(UUID(current_user.id))

    activity_payloads = await strava_client.get_activities(access_token, per_page=10)
    # type validation
    workouts = [Workout.model_validate(activity) for activity in activity_payloads]

    # add in heart rate streams
    for workout in workouts:
        if workout.has_heartrate and workout.id is not None:
            streams = await strava_client.get_activity_streams(
                access_token,
                activity_id=workout.id,
                keys=["time", "heartrate"],
            )
            add_heart_rate_streams_to_workout(workout, streams)

   
    # save workouts to the db
    workout_service.save_workouts(UUID(current_user.id), workouts=workouts)

    return [workout.model_dump(mode="json") for workout in workouts]
