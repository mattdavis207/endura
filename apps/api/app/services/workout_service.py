from collections.abc import Callable
from app.schemas.schemas import Workout

from supabase import Client

from app.db.supabase import create_supabase_admin_client



class WorkoutService:
    def __init__( 
        self,
        client_factory: Callable[[], Client] = create_supabase_admin_client):
        self._client_factory = client_factory


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