import re
from collections.abc import Callable
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, cast
from uuid import UUID

from supabase import Client

from app.db.supabase import create_supabase_admin_client
from app.schemas.schemas import OnboardingSubmission


def duration_to_seconds(value: str | None) -> int | None:
    if value is None:
        return None

    hours, minutes, seconds = (int(part) for part in value.split(":"))
    return hours * 3600 + minutes * 60 + seconds


def distance_to_meters(
    value: Decimal | None,
    unit: str,
) -> float | None:
    if value is None:
        return None

    multiplier = Decimal("1000") if unit == "km" else Decimal("1609.344")
    return float(value * multiplier)


def parse_pace(value: str | None) -> tuple[int | None, str | None]:
    if value is None:
        return None, None

    match = re.fullmatch(r"(\d{1,2}):(\d{2}) /(km|mi|100m|100yd)", value)
    if match is None:
        raise ValueError(f"Invalid pace value: {value}")

    minutes, seconds, unit = match.groups()
    return int(minutes) * 60 + int(seconds), unit


def parse_bike_speed(value: str | None) -> tuple[float | None, str | None]:
    if value is None:
        return None, None

    match = re.fullmatch(r"(\d+(?:\.\d+)?) (km/h|mph)", value)
    if match is None:
        raise ValueError(f"Invalid bike speed value: {value}")

    speed, unit = match.groups()
    speed_value = float(speed)
    speed_kph = speed_value if unit == "km/h" else speed_value * 1.609344
    return speed_kph, unit


class OnboardingService:
    def __init__(
        self,
        client_factory: Callable[[], Client] = create_supabase_admin_client,
    ) -> None:
        self._client_factory = client_factory

    def save_profile(self, user_id: UUID, payload: OnboardingSubmission) -> None:
        now = datetime.now(timezone.utc)
        (
            self._client_factory()
            .table("profiles")
            .update(
                {
                    "display_name": payload.first_name,
                    "updated_at": now.isoformat(),
                    "age": payload.age,
                    "gender": payload.gender,
                    "phone_number": payload.phone_number,
                    "height_cm": float(payload.height_cm),
                    "height_unit": payload.height_unit,
                    "weight_kg": float(payload.weight_kg),
                    "weight_unit": payload.weight_unit,
                    "training_experience": payload.training_experience,
                }
            )
            .eq("id", str(user_id))
            .execute()
        )

    def save_active_goal(self,user_id: UUID, payload: OnboardingSubmission,
    ) -> None:
        now = datetime.now(timezone.utc)
        swim_pace_seconds, swim_pace_unit = parse_pace(payload.target_swim_pace)
        run_pace_seconds, run_pace_unit = parse_pace(payload.target_run_pace)
        bike_speed_kph, bike_speed_unit = parse_bike_speed(payload.target_bike_speed)

        if swim_pace_seconds is not None and swim_pace_unit == "100yd":
            swim_pace_seconds = round(swim_pace_seconds * 100 / 91.44)

        if run_pace_seconds is not None and run_pace_unit == "mi":
            run_pace_seconds = round(run_pace_seconds / 1.609344)

        goal_values = {
            "user_id": str(user_id),
            "race_name": payload.race_title,
            "race_date": payload.race_date.isoformat(),
            "race_type": payload.race_type,
            "race_start_time": payload.race_time.isoformat(),
            "race_timezone": payload.race_timezone,
            "race_distance_type": payload.race_distance_type,
            "distance_unit": payload.distance_unit,
            "swim_distance_meters": distance_to_meters(
                payload.custom_swim_distance,
                payload.distance_unit,
            ),
            "bike_distance_meters": distance_to_meters(
                payload.custom_bike_distance,
                payload.distance_unit,
            ),
            "run_distance_meters": distance_to_meters(
                payload.custom_run_distance,
                payload.distance_unit,
            ),
            "primary_goal_type": payload.primary_goal_type,
            "target_finish_time_seconds": duration_to_seconds(
                payload.target_finish_time
            ),
            "custom_goal_text": payload.custom_goal_text,
            "target_swim_time_seconds": duration_to_seconds(
                payload.target_swim_time
            ),
            "target_swim_pace_seconds_per_100m": swim_pace_seconds,
            "target_swim_pace_unit": swim_pace_unit,
            "target_bike_time_seconds": duration_to_seconds(
                payload.target_bike_time
            ),
            "target_bike_watts": payload.target_bike_power,
            "target_bike_speed_kph": bike_speed_kph,
            "target_bike_speed_unit": bike_speed_unit,
            "target_run_time_seconds": duration_to_seconds(payload.target_run_time),
            "target_run_pace_seconds_per_km": run_pace_seconds,
            "target_run_pace_unit": run_pace_unit,
            "weekly_volume_target_minutes": round(
                float(payload.current_weekly_training_hours) * 60
            ),
            "is_active": True,
            "updated_at": now.isoformat(),
        }

        client = self._client_factory()
        existing_response = (
            client.table("goals")
            .select("id")
            .eq("user_id", str(user_id))
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        existing_rows = cast(list[dict[str, Any]], existing_response.data)

        # if goal already exists, update with new goal values
        if existing_rows:
            (
                client.table("goals")
                .update(goal_values)
                .eq("id", cast(str, existing_rows[0]["id"]))
                .execute()
            )
            return

        # insert new goal values 
        goal_values["created_at"] = now.isoformat()
        client.table("goals").insert(goal_values).execute()

    def save_training_preferences(self, user_id: UUID, payload: OnboardingSubmission,
    ) -> None:
        now = datetime.now(timezone.utc)
        (
            self._client_factory()
            .table("training_preferences")
            .upsert(
                {
                    "user_id": str(user_id),
                    "current_weekly_training_minutes": round(
                        float(payload.current_weekly_training_hours) * 60
                    ),
                    "preferred_training_days": payload.preferred_training_days,
                    "preferred_rest_days": payload.rest_day_preferences,
                    "available_weekday_minutes": round(
                        float(payload.available_hours_weekday) * 60
                    ),
                    "available_weekend_minutes": round(
                        float(payload.available_hours_weekend) * 60
                    ),
                    "injury_notes": payload.injury_notes,
                    "limitations": payload.limitations,
                    "updated_at": now.isoformat(),
                },
                on_conflict="user_id",
                default_to_null=False,
            )
            .execute()
        )

    def complete_onboarding(self, user_id: UUID):
        now = datetime.now(timezone.utc)
        self._client_factory().table("profiles").update(
            {
                "onboarding_completed_at": now.isoformat()
            }).eq("id", str(user_id)).execute()
        