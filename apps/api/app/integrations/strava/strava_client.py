from datetime import datetime, timezone
from typing import Any, cast
from urllib.parse import urlencode
from uuid import UUID

import httpx

from app.core.config import get_settings
from app.schemas.schemas import StravaRefreshTokenResponse
from app.services.strava_oauth import StravaOAuthStore

settings = get_settings()

STRAVA_APP_AUTHORIZATION_URL = "strava://oauth/mobile/authorize"
STRAVA_WEB_AUTHORIZATION_URL = "https://www.strava.com/oauth/mobile/authorize"
STRAVA_WEB_OAUTH_TOKEN_URL = "https://www.strava.com/oauth/token"
STRAVA_APP_ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities"
STRAVA_APP_ACTIVITY_URL = "https://www.strava.com/api/v3/activities"

strava_oauth_store = StravaOAuthStore()

class StravaClient:
    def __init__(self) -> None:
        self.client_id = settings.strava_client_id
        self.client_secret = settings.strava_client_secret
        self.redirect_uri = settings.strava_redirect_uri

    def build_authorization_url(
        self,
        state: str,
        approval_prompt: str = "auto",
        authorization_url: str = STRAVA_WEB_AUTHORIZATION_URL,
    ) -> str:
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "approval_prompt": approval_prompt,
            "scope": "read,activity:read_all",
            "state": state,
        }

        query = urlencode(params)
        return f"{authorization_url}?{query}"

    def build_app_authorization_url(
        self,
        state: str,
        approval_prompt: str = "auto",
    ) -> str:
        return self.build_authorization_url(
            state=state,
            approval_prompt=approval_prompt,
            authorization_url=STRAVA_APP_AUTHORIZATION_URL,
        )

    async def exchange_authorization_code(
        self,
        authorization_code: str,
    ) -> dict[str, Any]:
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": authorization_code,
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(STRAVA_WEB_OAUTH_TOKEN_URL, json=payload)

        response.raise_for_status()
        return cast(dict[str, Any], response.json())

    async def refresh_access_token(self, refresh_token: str) -> StravaRefreshTokenResponse:
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        }

        response = httpx.post(STRAVA_WEB_OAUTH_TOKEN_URL, json=payload)

        response.raise_for_status()

        return StravaRefreshTokenResponse.model_validate(response.json())

    async def get_valid_access_token(self, user_id: UUID) -> str:
        now = datetime.now(timezone.utc)

        connection = strava_oauth_store.load_strava_connection(user_id)

        if connection is None:
            raise ValueError("User has no active Strava connection")

        if connection.expires_at <= now:
            refreshed = await self.refresh_access_token(
                connection.refresh_token
            )
            # save new access token
            strava_oauth_store.save_refreshed_tokens(user_id, refreshed)

            return refreshed.access_token

        return cast(str, connection.access_token)

    async def get_activities(
        self,
        access_token: str,
        *,
        per_page: int = 10,
    ) -> list[dict[str, Any]]:

        params = {
            "page": 1,
            "per_page": per_page,
        }

        headers = {"Authorization": f"Bearer {access_token}"}

        response = httpx.get(STRAVA_APP_ACTIVITIES_URL, headers=headers, params=params)
        response.raise_for_status()

        return cast(list[dict[str, Any]], response.json())

    async def get_activity_streams(
        self,
        access_token: str,
        *,
        activity_id: int,
        keys: list[str],
    ) -> dict[str, dict[str, Any]]:
        params = {
            "keys": ",".join(keys),
            "key_by_type": "true",
        }

        headers = {"Authorization": f"Bearer {access_token}"}

        stream_url = f"{STRAVA_APP_ACTIVITY_URL}/{activity_id}/streams"

        response = httpx.get(stream_url, headers=headers, params=params)
        response.raise_for_status()

        return cast(dict[str, dict[str, Any]], response.json())
