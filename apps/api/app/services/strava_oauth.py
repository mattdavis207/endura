"""
StravaOAuthStore class for creating oauth state + consuming state, adding strava_connections, and accessing 
the connection.
"""


import hashlib
from collections.abc import Callable
from datetime import datetime, timezone
from typing import Any, cast
from uuid import UUID

from supabase import Client

from app.db.supabase import create_supabase_admin_client
from app.schemas.schemas import StravaRefreshTokenResponse


def hash_oauth_state(state: str) -> str:
    return hashlib.sha256(state.encode("utf-8")).hexdigest()


class StravaOAuthStore:
    def __init__(
        self,
        client_factory: Callable[[], Client] = create_supabase_admin_client,
    ) -> None:
        self._client_factory = client_factory

    # add state to the oauth_states table in the db
    def create_state(self,
        *,
        state: str,
        user_id: UUID,
        expires_at: datetime,
    ) -> None:
        self._client_factory().table("oauth_states").insert(
            {
                "state": hash_oauth_state(state),
                "user_id": str(user_id),
                "provider": "strava",
                "expires_at": expires_at.isoformat(),
            }
        ).execute()

    # consume the state by updating the state field 
    def consume_state(self, state: str) -> UUID | None:
        now = datetime.now(timezone.utc)
        response = (
            self._client_factory()
            .table("oauth_states")
            .update({"consumed_at": now.isoformat()})
            .eq("state", hash_oauth_state(state))
            .eq("provider", "strava")
            .is_("consumed_at", "null")
            .gt("expires_at", now.isoformat())
            .execute()
        )
        rows = cast(list[dict[str, Any]], response.data)

        if len(rows) != 1:
            return None

        return UUID(cast(str, rows[0]["user_id"]))

    # add to strava_connections table 
    def save_connection(
        self,
        *,
        user_id: UUID,
        strava_athlete_id: int,
        access_token: str,
        refresh_token: str,
        token_type: str,
        expires_at: datetime,
        granted_scopes: set[str],
    ) -> None:
        now = datetime.now(timezone.utc)
        self._client_factory().table("strava_connections").upsert(
            {
                "user_id": str(user_id),
                "strava_athlete_id": strava_athlete_id,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": token_type,
                "expires_at": expires_at.isoformat(),
                "granted_scopes": sorted(granted_scopes),
                "connected_at": now.isoformat(),
                "updated_at": now.isoformat(),
                "revoked_at": None,
            },
            on_conflict="user_id",
        ).execute()

    def load_strava_connection(self, user_id: UUID):
        response = (
            self._client_factory()
            .table("strava_connections")
            .select("*")
            .eq("user_id", str(user_id))
            .execute()
            .single()
        )
        
        if not response:
            return None

        return response
    
    def save_refreshed_tokens(self, user_id: UUID, refreshed: StravaRefreshTokenResponse):
        now = datetime.now(timezone.utc)

        expires_at = datetime.fromtimestamp(
            refreshed.expires_at,
            timezone.utc
        )

        response = (
            self._client_factory()
            .table("strava_connections")
            .update({
                "access_token": refreshed.access_token,
                "refresh_token": refreshed.refresh_token,
                "token_type": refreshed.token_type,
                "expires_at": expires_at,
                "updated_at": now.isoformat(),
            })
            .eq("user_id", str(user_id))
            .is_("revoked_at", "null")
            .execute()
        )

        return response 