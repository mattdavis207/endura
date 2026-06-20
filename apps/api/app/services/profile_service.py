from collections.abc import Callable
from typing import Any, cast
from uuid import UUID

from supabase import Client

from app.db.supabase import create_supabase_admin_client


class ProfileService:
    def __init__(
        self,
        client_factory: Callable[[], Client] = create_supabase_admin_client,
    ) -> None:
        self._client_factory = client_factory

    def get_display_name(self, user_id: UUID) -> dict[str, Any] | None:
        response = (
            self._client_factory()
            .table("profiles")
            .select("display_name")
            .eq("id", str(user_id))
            .limit(1)
            .execute()
        )
        rows = cast(list[dict[str, Any]], response.data)

        return rows[0] if rows else None