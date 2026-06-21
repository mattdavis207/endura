from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any
from uuid import UUID

from app.integrations.strava.strava_client import StravaClient
from app.schemas.schemas import Workout
from app.services.profile_service import ProfileService
from app.services.race_service import RaceService
from app.services.training_plan_service import TrainingPlanService
from app.services.workout_service import WorkoutService
from app.services.workout_summary_service import WorkoutSummaryService


class TrainingHQService:
    # Stores the collaborators used by read-only and refresh dashboard flows.
    def __init__(
        self,
        profile_service: ProfileService,
        race_service: RaceService,
        workout_service: WorkoutService,
        training_plan_service: TrainingPlanService,
        workout_summary_service: WorkoutSummaryService,
        strava_client: StravaClient,
    ) -> None:
        self.profile_service = profile_service
        self.race_service = race_service
        self.workout_service = workout_service
        self.training_plan_service = training_plan_service
        self.workout_summary_service = workout_summary_service
        self.strava_client = strava_client

    # Builds Training HQ exclusively from the dashboard state already stored in the database.
    def get_dashboard(self, user_id: UUID) -> dict[str, Any]:
        profile = self.profile_service.get_training_hq_profile(user_id)
        race_info = self.race_service.get_race_info(user_id)
        planned_workouts = self.training_plan_service.get_training_hq_cards(user_id)
        workouts = self.workout_service.get_recent_workouts(user_id)
        return build_training_hq_response(profile, race_info, planned_workouts, workouts)

    # Runs the explicit Strava, summary, plan, and reconciliation refresh sequence.
    async def refresh_dashboard(self, user_id: UUID) -> dict[str, Any]:
        access_token = await self.strava_client.get_valid_access_token(user_id)
        activity_payloads = await self.strava_client.get_activities(access_token, per_page=10)
        workouts = [Workout.model_validate(activity) for activity in activity_payloads]

        # Attach available heart-rate streams before persisting the newly synced activities.
        for workout in workouts:
            if workout.has_heartrate and workout.id is not None:
                streams = await self.strava_client.get_activity_streams(
                    access_token,
                    activity_id=workout.id,
                    keys=["time", "heartrate"],
                )
                add_heart_rate_streams_to_workout(workout, streams)

        self.workout_service.save_workouts(user_id, workouts)
        self.workout_summary_service.create_missing_summaries(user_id)
        plan = self.training_plan_service.ensure_current_week_plan(user_id)
        if plan is not None:
            self.training_plan_service.ensure_planned_workouts(user_id, plan["id"])
        self.training_plan_service.match_completed_workouts_to_planned_workouts(user_id)
        refreshed_at = datetime.now(timezone.utc)
        self.profile_service.set_training_hq_refreshed_at(user_id, refreshed_at)
        return self.get_dashboard(user_id)


# Copies validated Strava heart-rate stream arrays and metadata onto a workout.
def add_heart_rate_streams_to_workout(
    workout: Workout, streams: dict[str, dict[str, Any]]
) -> Workout:
    time_stream = streams.get("time")
    heart_rate_stream = streams.get("heartrate")
    if not time_stream or not heart_rate_stream:
        return workout

    time_data = time_stream.get("data")
    heart_rate_data = heart_rate_stream.get("data")
    if not isinstance(time_data, list) or not all(isinstance(value, int) for value in time_data):
        return workout
    if not isinstance(heart_rate_data, list) or not all(
        isinstance(value, int) for value in heart_rate_data
    ):
        return workout

    workout.heart_rate_time_seconds = time_data
    workout.heart_rate_bpm = heart_rate_data
    workout.heart_rate_stream_original_size = integer_or_none(
        heart_rate_stream.get("original_size")
    )
    workout.heart_rate_stream_resolution = string_or_none(heart_rate_stream.get("resolution"))
    workout.heart_rate_stream_series_type = string_or_none(heart_rate_stream.get("series_type"))
    return workout


# Converts supported database numeric values to JSON-compatible floats.
def number_or_none(value: Any) -> float | None:
    if isinstance(value, Decimal | int | float):
        return float(value)
    return None


# Returns integer metadata only when the provider supplied the expected type.
def integer_or_none(value: Any) -> int | None:
    return value if isinstance(value, int) else None


# Returns string metadata only when the provider supplied the expected type.
def string_or_none(value: Any) -> str | None:
    return value if isinstance(value, str) else None


# Formats stored race columns for the mobile Training HQ contract.
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


# Formats a persisted actual workout for the mobile Training HQ contract.
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
        "cadence": {"average": number_or_none(workout.get("average_cadence"))},
        "rawData": workout.get("raw_data"),
    }


# Formats a prescribed session as a flattened card with optional actual workout metrics.
def format_planned_workout_card(
    planned_workout: dict[str, Any], next_planned_date: date | None
) -> dict[str, Any]:
    actual_row = planned_workout.get("actual_workout")
    actual_workout = format_workout(actual_row) if isinstance(actual_row, dict) else None
    planned_date = date.fromisoformat(str(planned_workout["planned_date"]))
    flattened_workout = actual_workout or empty_workout()
    flattened_workout.update(
        {
            "id": planned_workout.get("id"),
            "source": actual_workout.get("source") if actual_workout else "planned",
            "sportType": planned_workout.get("sport_type"),
            "name": planned_workout.get("title") or planned_workout.get("purpose"),
            "startedAt": str(planned_workout.get("planned_date")),
            "durationSeconds": (
                actual_workout.get("durationSeconds")
                if actual_workout
                else planned_workout.get("planned_duration_seconds")
            ),
            "distanceMeters": (
                actual_workout.get("distanceMeters")
                if actual_workout
                else number_or_none(planned_workout.get("target_distance_meters"))
            ),
            "cardType": "planned_workout",
            "displayStatus": planned_display_status(
                planned_workout, planned_date, next_planned_date
            ),
            "plannedWorkout": {
                "trainingPlanId": planned_workout.get("training_plan_id"),
                "plannedWorkoutId": planned_workout.get("id"),
                "plannedDate": planned_workout.get("planned_date"),
                "plannedDurationSeconds": planned_workout.get("planned_duration_seconds"),
                "targetDistanceMeters": number_or_none(
                    planned_workout.get("target_distance_meters")
                ),
                "targetIntensity": planned_workout.get("target_intensity"),
                "purpose": planned_workout.get("purpose"),
                "status": planned_workout.get("status"),
            },
            "actualWorkout": actual_workout,
        }
    )
    return flattened_workout


# Formats an unmatched completed workout as a supporting history card.
def format_actual_workout_card(workout: dict[str, Any]) -> dict[str, Any]:
    formatted_workout = format_workout(workout)
    return {
        **formatted_workout,
        "cardType": "actual_workout",
        "displayStatus": "completed",
        "plannedWorkout": None,
        "actualWorkout": formatted_workout,
    }


# Returns null-filled workout fields required by the flattened card contract.
def empty_workout() -> dict[str, Any]:
    return format_workout({})


# Computes the transient UI status without expanding durable database statuses.
def planned_display_status(
    planned_workout: dict[str, Any], planned_date: date, next_planned_date: date | None
) -> str:
    if planned_workout.get("actual_workout_id") or planned_workout.get("actual_workout"):
        return "completed"
    if planned_date == date.today():
        return "in_progress"
    if planned_date < date.today():
        return "missed"
    if planned_date == next_planned_date:
        return "next_workout"
    return "planned"


# Combines planned and unmatched actual workouts into the ordered mobile card collection.
def format_training_hq_cards(
    planned_workouts: list[dict[str, Any]], workouts: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    future_dates = [
        date.fromisoformat(str(row["planned_date"]))
        for row in planned_workouts
        if not row.get("actual_workout_id")
        and date.fromisoformat(str(row["planned_date"])) > date.today()
    ]
    next_planned_date = min(future_dates) if future_dates else None
    linked_actual_ids = {
        str(row["actual_workout_id"]) for row in planned_workouts if row.get("actual_workout_id")
    }
    cards = [
        format_planned_workout_card(planned_workout, next_planned_date)
        for planned_workout in planned_workouts
    ]
    cards.extend(
        format_actual_workout_card(workout)
        for workout in workouts
        if str(workout.get("id")) not in linked_actual_ids
    )
    return sorted(cards, key=lambda card: str(card.get("startedAt") or ""))


# Builds the complete response shared by cached GET reads and explicit refreshes.
def build_training_hq_response(
    profile: dict[str, Any] | None,
    race_info: dict[str, Any] | None,
    planned_workouts: list[dict[str, Any]],
    workouts: list[dict[str, Any]],
) -> dict[str, Any]:
    formatted_workouts = [format_workout(workout) for workout in workouts]
    distances = [number_or_none(workout.get("distance_meters")) for workout in workouts]
    durations = [
        workout["duration_seconds"]
        for workout in workouts
        if isinstance(workout.get("duration_seconds"), int)
    ]
    heart_rates = [number_or_none(workout.get("average_heart_rate")) for workout in workouts]
    non_null_distances = [distance for distance in distances if distance is not None]
    non_null_heart_rates = [heart_rate for heart_rate in heart_rates if heart_rate is not None]
    return {
        "displayName": profile.get("display_name") if profile else None,
        "race": format_race_info(race_info),
        "cards": format_training_hq_cards(planned_workouts, workouts),
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
        "lastRefreshedAt": profile.get("training_hq_refreshed_at") if profile else None,
        "recentWorkouts": formatted_workouts,
    }
