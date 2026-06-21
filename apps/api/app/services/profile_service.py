from collections.abc import Callable
from datetime import datetime
from typing import Any, cast
from uuid import UUID

from supabase import Client

from app.db.supabase import create_supabase_admin_client


class ProfileService:
    # Stores the database client factory used for profile reads and writes.
    def __init__(
        self,
        client_factory: Callable[[], Client] = create_supabase_admin_client,
    ) -> None:
        self._client_factory = client_factory

    # Loads profile fields displayed by Training HQ, including the persisted refresh time.
    def get_training_hq_profile(self, user_id: UUID) -> dict[str, Any] | None:
        response = (
            self._client_factory()
            .table("profiles")
            .select("display_name,training_hq_refreshed_at")
            .eq("id", str(user_id))
            .limit(1)
            .execute()
        )
        rows = cast(list[dict[str, Any]], response.data)

        return rows[0] if rows else None

    # Records when the complete Training HQ refresh flow last succeeded.
    def set_training_hq_refreshed_at(self, user_id: UUID, refreshed_at: datetime) -> None:
        (
            self._client_factory()
            .table("profiles")
            .update({"training_hq_refreshed_at": refreshed_at.isoformat()})
            .eq("id", str(user_id))
            .execute()
        )
