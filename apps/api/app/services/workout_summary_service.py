from collections.abc import Callable
from typing import Any, cast
from uuid import UUID

from supabase import Client

from app.db.supabase import create_supabase_admin_client


class WorkoutSummaryService:
    # Stores the database client factory used for summary reads and writes.
    def __init__(
        self,
        client_factory: Callable[[], Client] = create_supabase_admin_client,
    ) -> None:
        self._client_factory = client_factory

    # Creates deterministic summaries for synced workouts that do not have one yet.
    def create_missing_summaries(self, user_id: UUID) -> None:
        client = self._client_factory()
        workout_response = (
            client.table("workouts")
            .select("id,name,sport_type,duration_seconds,distance_meters")
            .eq("user_id", str(user_id))
            .execute()
        )
        workouts = cast(list[dict[str, Any]], workout_response.data)
        if not workouts:
            return

        summary_response = (
            client.table("workout_summaries")
            .select("workout_id")
            .in_("workout_id", [workout["id"] for workout in workouts])
            .execute()
        )
        summarized_ids = {
            str(row["workout_id"]) for row in cast(list[dict[str, Any]], summary_response.data)
        }
        rows = [
            {
                "workout_id": workout["id"],
                "summary": build_workout_summary(workout),
                "fatigue_indicators": {},
            }
            for workout in workouts
            if str(workout["id"]) not in summarized_ids
        ]
        if rows:
            client.table("workout_summaries").insert(rows).execute()


# Produces a concise non-AI summary until model-backed summaries are introduced.
def build_workout_summary(workout: dict[str, Any]) -> str:
    sport_type = str(workout.get("sport_type") or "workout").replace("_", " ")
    name = workout.get("name") or sport_type.title()
    duration_minutes = round(int(workout.get("duration_seconds") or 0) / 60)
    distance_meters = workout.get("distance_meters")
    distance_text = f", covering {float(distance_meters):.0f} meters" if distance_meters else ""
    return f"{name}: {duration_minutes} minute {sport_type}{distance_text}."
