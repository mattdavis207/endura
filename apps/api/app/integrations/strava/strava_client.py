from urllib.parse import urlencode

from app.core.config import get_settings

settings = get_settings()

STRAVA_APP_AUTHORIZATION_URL = "strava://oauth/mobile/authorize"
STRAVA_WEB_AUTHORIZATION_URL = "https://www.strava.com/oauth/mobile/authorize"


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
