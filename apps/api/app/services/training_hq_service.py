from collections.abc import Callable
from typing import Any, cast
from uuid import UUID

from supabase import Client

from app.db.supabase import create_supabase_admin_client


class TrainingHQService:
    def __init__(
        self,
        client_factory: Callable[[], Client] = create_supabase_admin_client,
    ) -> None:
        self._client_factory = client_factory

    def get_race_info(self, user_id: UUID) -> dict[str, Any] | None:
        response = (
            self._client_factory()
            .table("goals")
            .select(
                "race_name,"
                "race_date,"
                "race_start_time,"
                "race_timezone,"
                "race_type,"
                "race_distance_type,"
                "distance_unit,"
                "swim_distance_meters,"
                "bike_distance_meters,"
                "run_distance_meters",
            )
            .eq("user_id", str(user_id))
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        rows = cast(list[dict[str, Any]], response.data)

        return rows[0] if rows else None

    def get_profile(self, user_id: UUID) -> dict[str, Any] | None:
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

    def get_recent_workouts(self, user_id: UUID) -> list[dict[str, Any]]:
        response = (
            self._client_factory()
            .table("workouts")
            .select("*")
            .eq("user_id", str(user_id))
            .order("started_at", desc=True)
            .limit(10)
            .execute()
        )

        rows = cast(list[dict[str, Any]], response.data)

        return rows
