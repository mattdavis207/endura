from typing import Any, cast
from urllib.parse import urlencode

import httpx

from app.core.config import get_settings

settings = get_settings()

STRAVA_APP_AUTHORIZATION_URL = "strava://oauth/mobile/authorize"
STRAVA_WEB_AUTHORIZATION_URL = "https://www.strava.com/oauth/mobile/authorize"
STRAVA_WEB_OAUTH_TOKEN_URL = "https://www.strava.com/oauth/token"



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
    

    
    async def refresh_access_token(self, refresh_token):
        payload = {
            "client_id" : self.client_id,
            "client_secret" : self.client_secret,
            "grant_type" : "authorization_code",
            "access_token" : "refresh_token",
        }

        response = httpx.post(STRAVA_WEB_OAUTH_TOKEN_URL, json=payload)

        return response.json()
