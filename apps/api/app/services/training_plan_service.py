from collections.abc import Callable
from datetime import date, datetime, time, timedelta, timezone
from typing import Any, cast
from uuid import UUID

from supabase import Client

from app.db.supabase import create_supabase_admin_client

MOCK_WEEKLY_WORKOUTS = (
    (0, "run", 2700, "easy z2", "Aerobic base run with relaxed pacing"),
    (2, "bike", 3600, "steady z2", "Aerobic endurance ride with smooth cadence"),
    (5, "strength", 1800, "moderate", "Full-body strength and mobility session"),
)

SPORT_GROUPS = {
    "run": {"run", "running", "trailrun"},
    "bike": {
        "bike",
        "ride",
        "cycling",
        "virtualride",
        "gravelride",
        "mountainbikeride",
    },
    "swim": {"swim", "swimming"},
    "strength": {"strength", "weighttraining", "workout", "crossfit"},
    "mobility": {"yoga", "pilates", "mobility"},
}


class TrainingPlanService:
    # Stores the database client factory used for plan reads and writes.
    def __init__(
        self,
        client_factory: Callable[[], Client] = create_supabase_admin_client,
    ) -> None:
        self._client_factory = client_factory

    # Loads the authenticated user's plan for the current ISO week.
    def get_current_week_plan(self, user_id: UUID) -> dict[str, Any] | None:
        week_start = current_week_start()
        response = (
            self._client_factory()
            .table("training_plans")
            .select("*")
            .eq("user_id", str(user_id))
            .eq("week_start", week_start.isoformat())
            .limit(1)
            .execute()
        )
        rows = cast(list[dict[str, Any]], response.data)
        return rows[0] if rows else None

    # Creates the current weekly plan header when the user has an active goal but no plan.
    def ensure_current_week_plan(self, user_id: UUID) -> dict[str, Any] | None:
        existing_plan = self.get_current_week_plan(user_id)
        if existing_plan is not None:
            return existing_plan

        client = self._client_factory()
        goal_response = (
            client.table("goals")
            .select("id")
            .eq("user_id", str(user_id))
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        goals = cast(list[dict[str, Any]], goal_response.data)
        if not goals:
            return None

        response = (
            client.table("training_plans")
            .upsert(
                {
                    "user_id": str(user_id),
                    "goal_id": goals[0]["id"],
                    "week_start": current_week_start().isoformat(),
                    "generated_by_ai": False,
                    "plan_summary": "Mock weekly plan pending AI planning integration.",
                },
                on_conflict="user_id,week_start",
            )
            .execute()
        )
        plans = cast(list[dict[str, Any]], response.data)
        return plans[0] if plans else self.get_current_week_plan(user_id)

    # Seeds deterministic mock workouts when the current plan has no prescribed sessions.
    def ensure_planned_workouts(
        self, user_id: UUID, training_plan_id: UUID | str
    ) -> list[dict[str, Any]]:
        client = self._client_factory()
        existing_response = (
            client.table("planned_workouts")
            .select("*")
            .eq("training_plan_id", str(training_plan_id))
            .limit(1)
            .execute()
        )
        existing_rows = cast(list[dict[str, Any]], existing_response.data)
        if existing_rows:
            return existing_rows

        plan = self.get_current_week_plan(user_id)
        if plan is None or str(plan["id"]) != str(training_plan_id):
            return []

        week_start = date.fromisoformat(cast(str, plan["week_start"]))
        rows = [
            {
                "training_plan_id": str(training_plan_id),
                "planned_date": (week_start + timedelta(days=day_offset)).isoformat(),
                "sport_type": sport_type,
                "title": purpose.split(" with ")[0],
                "planned_duration_seconds": duration_seconds,
                "target_intensity": intensity,
                "purpose": purpose,
                "raw_ai_plan": {"mocked": True},
            }
            for day_offset, sport_type, duration_seconds, intensity, purpose in MOCK_WEEKLY_WORKOUTS
        ]
        response = client.table("planned_workouts").insert(cast(Any, rows)).execute()
        return cast(list[dict[str, Any]], response.data)

    # Loads planned workout card data and attached actual workouts owned by the user.
    def get_training_hq_cards(self, user_id: UUID) -> list[dict[str, Any]]:
        response = (
            self._client_factory()
            .table("planned_workouts")
            .select("*,training_plans!inner(user_id),actual_workout:workouts(*)")
            .eq("training_plans.user_id", str(user_id))
            .order("planned_date")
            .execute()
        )
        return cast(list[dict[str, Any]], response.data)

    # Links each eligible planned workout to the best same-day compatible actual workout.
    def match_completed_workouts_to_planned_workouts(self, user_id: UUID) -> None:
        planned_workouts = self.get_training_hq_cards(user_id)
        unmatched_plans = [row for row in planned_workouts if not row.get("actual_workout_id")]
        if not unmatched_plans:
            return

        planned_dates = [
            date.fromisoformat(cast(str, row["planned_date"])) for row in unmatched_plans
        ]
        # Query a widened UTC window before applying the authoritative Strava local date.
        start_at = datetime.combine(
            min(planned_dates) - timedelta(days=1), time.min, tzinfo=timezone.utc
        )
        end_at = datetime.combine(
            max(planned_dates) + timedelta(days=2), time.min, tzinfo=timezone.utc
        )
        response = (
            self._client_factory()
            .table("workouts")
            .select("*")
            .eq("user_id", str(user_id))
            .gte("started_at", start_at.isoformat())
            .lt("started_at", end_at.isoformat())
            .execute()
        )
        actual_workouts = cast(list[dict[str, Any]], response.data)
        linked_ids = {
            str(row["actual_workout_id"])
            for row in planned_workouts
            if row.get("actual_workout_id")
        }

        for planned_workout in unmatched_plans:
            candidates = [
                workout
                for workout in actual_workouts
                if str(workout.get("id")) not in linked_ids
                and workout_matches_plan(planned_workout, workout)
            ]
            if not candidates:
                continue

            planned_duration = int(planned_workout["planned_duration_seconds"])
            best_match = min(
                candidates,
                key=lambda workout: abs(
                    int(workout.get("duration_seconds") or 0) - planned_duration
                ),
            )
            (
                self._client_factory()
                .table("planned_workouts")
                .update(
                    {
                        "actual_workout_id": best_match["id"],
                        "status": "completed",
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }
                )
                .eq("id", planned_workout["id"])
                .execute()
            )
            linked_ids.add(str(best_match["id"]))


# Returns the Monday that starts the current ISO week.
def current_week_start(today: date | None = None) -> date:
    current_date = today or date.today()
    return current_date - timedelta(days=current_date.weekday())


# Maps provider-specific sport values into the matching groups used by plans.
def normalize_sport(value: Any) -> str:
    normalized = str(value or "").lower().replace("_", "").replace(" ", "")
    for group, values in SPORT_GROUPS.items():
        if normalized in values:
            return group
    return normalized


# Checks the approved date, sport, and duration thresholds for workout reconciliation.
def workout_matches_plan(planned_workout: dict[str, Any], workout: dict[str, Any]) -> bool:
    planned_date = date.fromisoformat(cast(str, planned_workout["planned_date"]))
    actual_date = workout_local_date(workout)
    if actual_date != planned_date:
        return False

    if normalize_sport(workout.get("sport_type")) != normalize_sport(
        planned_workout.get("sport_type")
    ):
        return False

    planned_duration = int(planned_workout["planned_duration_seconds"])
    actual_duration = workout.get("duration_seconds")
    if not isinstance(actual_duration, int):
        return False
    return planned_duration * 0.5 <= actual_duration <= planned_duration * 1.5


# Reads Strava's local start date when available and otherwise falls back to UTC start time.
def workout_local_date(workout: dict[str, Any]) -> date | None:
    raw_data = workout.get("raw_data")
    if isinstance(raw_data, dict) and isinstance(raw_data.get("start_date_local"), str):
        return datetime.fromisoformat(raw_data["start_date_local"].replace("Z", "+00:00")).date()

    started_at = workout.get("started_at")
    if not isinstance(started_at, str):
        return None
    return datetime.fromisoformat(started_at.replace("Z", "+00:00")).date()
