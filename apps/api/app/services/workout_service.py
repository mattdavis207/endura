from collections.abc import Callable
from datetime import datetime
from typing import Any, cast
from uuid import UUID

from supabase import Client

from app.db.supabase import create_supabase_admin_client
from app.schemas.schemas import Workout


class WorkoutService:
    # Stores the database client factory used for workout reads and writes.
    def __init__(
        self,
        client_factory: Callable[[], Client] = create_supabase_admin_client,
    ) -> None:
        self._client_factory = client_factory

    # Upserts provider workouts by their stable source identifier.
    def save_workouts(self, user_id: UUID, workouts: list[Workout]) -> None:
        rows = [
            self._strava_workout_to_row(user_id, workout)
            for workout in workouts
            if workout.id is not None
        ]

        if not rows:
            return

        self._client_factory().table("workouts").upsert(
            rows,
            on_conflict="source,source_workout_id",
        ).execute()

    # Loads the ten most recent persisted workouts for dashboard history and stats.
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

    # Loads the next page of workouts strictly before the supplied timestamp.
    def get_workouts_before(self, user_id: UUID, before: datetime) -> list[dict[str, Any]]:
        response = (
            self._client_factory()
            .table("workouts")
            .select("*")
            .eq("user_id", str(user_id))
            .lt("started_at", before.isoformat())
            .order("started_at", desc=True)
            .limit(10)
            .execute()
        )

        rows = cast(list[dict[str, Any]], response.data)

        return rows

    # Loads workouts inside a caller-provided timestamp range.
    def get_workouts_for_date_range(
        self, user_id: UUID, start_date: str, end_date: str
    ) -> list[dict[str, Any]]:
        response = (
            self._client_factory()
            .table("workouts")
            .select("*")
            .eq("user_id", str(user_id))
            .gte("started_at", start_date)
            .lte("started_at", end_date)
            .order("started_at", desc=True)
            .execute()
        )

        rows = cast(list[dict[str, Any]], response.data)

        return rows

    # Converts a validated Strava activity into the workouts table representation.
    def _strava_workout_to_row(self, user_id: UUID, workout: Workout) -> dict[str, Any]:
        return {
            "user_id": str(user_id),
            "source": "strava",
            "source_workout_id": str(workout.id),
            "sport_type": workout.sport_type.lower() if workout.sport_type else "running",
            "name": workout.name,
            "started_at": workout.start_date.isoformat() if workout.start_date else None,
            "duration_seconds": workout.moving_time or workout.elapsed_time or 0,
            "distance_meters": workout.distance,
            "average_heart_rate": workout.average_heartrate,
            "max_heart_rate": workout.max_heartrate,
            "average_power_watts": workout.average_watts,
            "normalized_power_watts": workout.weighted_average_watts,
            "average_cadence": workout.average_cadence,
            "heart_rate_time_seconds": workout.heart_rate_time_seconds,
            "heart_rate_bpm": workout.heart_rate_bpm,
            "heart_rate_stream_original_size": workout.heart_rate_stream_original_size,
            "heart_rate_stream_resolution": workout.heart_rate_stream_resolution,
            "heart_rate_stream_series_type": workout.heart_rate_stream_series_type,
            "raw_data": workout.model_dump(mode="json", exclude_none=True),
        }
