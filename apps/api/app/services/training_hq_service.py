from collections.abc import Callable
from typing import Any, cast
from decimal import Decimal
from uuid import UUID

from supabase import Client

from app.db.supabase import create_supabase_admin_client
from app.services.profile_service import ProfileService
from app.services.race_service import RaceService
from app.services.training_plan_service import TrainingPlanService
from app.services.workout_service import WorkoutService


class TrainingHQService:
    def __init__(
        self,
        profile_service: ProfileService,
        race_service: RaceService,
        workout_service: WorkoutService,
        training_plan_service: TrainingPlanService,
    ):
        self.profile_service = profile_service
        self.race_service = race_service
        self.workout_service = workout_service
        self.training_plan_service = training_plan_service

    def get_dashboard(self, user_id: UUID):
        profile = self.profile_service.get_display_name(user_id)
        race_info = self.race_service.get_race_info(user_id)
        # cards = self.training_plan_service.get_training_hq_cards(user_id)
        workouts = self.workout_service.get_recent_workouts(user_id)
        
        return build_training_hq_response(profile, race_info, workouts)
    






# Helper Functions for building training hq response
def number_or_none(value: Any) -> float | None:
    if value is None:
        return None

    if isinstance(value, Decimal):
        return float(value)

    if isinstance(value, int | float):
        return float(value)

    return None


def format_race_info(race_info: dict[str, Any] | None) -> dict[str, Any] | None:
    if race_info is None:
        return None

    return {
        "title": race_info.get("race_name"),
        "date": race_info.get("race_date"),
        "startTime": race_info.get("race_start_time"),
        "timezone": race_info.get("race_timezone"),
        "type": race_info.get("race_type"),
        "distanceType": race_info.get("race_distance_type"),
        "distanceUnit": race_info.get("distance_unit"),
        "distancesMeters": {
            "swim": number_or_none(race_info.get("swim_distance_meters")),
            "bike": number_or_none(race_info.get("bike_distance_meters")),
            "run": number_or_none(race_info.get("run_distance_meters")),
        },
    }


def format_workout(workout: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": workout.get("id"),
        "source": workout.get("source"),
        "sourceWorkoutId": workout.get("source_workout_id"),
        "sportType": workout.get("sport_type"),
        "name": workout.get("name"),
        "startedAt": workout.get("started_at"),
        "durationSeconds": workout.get("duration_seconds"),
        "distanceMeters": number_or_none(workout.get("distance_meters")),
        "calories": workout.get("calories"),
        "power": {
            "averageWatts": number_or_none(workout.get("average_power_watts")),
            "normalizedWatts": number_or_none(workout.get("normalized_power_watts")),
        },
        "heartRate": {
            "average": number_or_none(workout.get("average_heart_rate")),
            "max": number_or_none(workout.get("max_heart_rate")),
            "timeSeconds": workout.get("heart_rate_time_seconds"),
            "bpm": workout.get("heart_rate_bpm"),
            "stream": {
                "originalSize": workout.get("heart_rate_stream_original_size"),
                "resolution": workout.get("heart_rate_stream_resolution"),
                "seriesType": workout.get("heart_rate_stream_series_type"),
            },
        },
        "cadence": {
            "average": number_or_none(workout.get("average_cadence")),
        },
        "rawData": workout.get("raw_data"),
    }


def build_training_hq_response(
    profile: dict[str, Any] | None,
    race_info: dict[str, Any] | None,
    workouts: list[dict[str, Any]],
) -> dict[str, Any]:
    formatted_workouts = [format_workout(workout) for workout in workouts]
    distances = [
        number_or_none(workout.get("distance_meters"))
        for workout in workouts
    ]
    durations = [
        workout.get("duration_seconds")
        for workout in workouts
        if isinstance(workout.get("duration_seconds"), int)
    ]
    heart_rates = [
        number_or_none(workout.get("average_heart_rate"))
        for workout in workouts
    ]
    non_null_distances = [distance for distance in distances if distance is not None]
    non_null_heart_rates = [heart_rate for heart_rate in heart_rates if heart_rate is not None]

    return {
        "displayName": profile.get("display_name") if profile else None,
        "race": format_race_info(race_info),
        "recentWorkouts": formatted_workouts,
        "stats": {
            "recentWorkoutCount": len(formatted_workouts),
            "totalDistanceMeters": sum(non_null_distances),
            "totalDurationSeconds": sum(durations),
            "averageHeartRate": (
                sum(non_null_heart_rates) / len(non_null_heart_rates)
                if non_null_heart_rates
                else None
            ),
        },
    }