from pydantic import BaseModel
from typing import Literal


class StravaRefreshTokenResponse(BaseModel):
    token_type: Literal["Bearer"]
    access_token: str
    expires_at: int
    expires_in: int
    refresh_token: str
