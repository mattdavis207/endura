from datetime import date, timedelta
from typing import Any
from uuid import UUID, uuid4

import pytest

from app.services.training_hq_service import (
    TrainingHQService,
    build_training_hq_response,
    format_training_hq_cards,
)
from app.services.training_plan_service import normalize_sport, workout_matches_plan

USER_ID = UUID("00000000-0000-0000-0000-000000000001")


# Builds a representative persisted workout row with optional test overrides.
def workout_row(**overrides: Any) -> dict[str, Any]:
    row = {
        "id": str(uuid4()),
        "source": "strava",
        "source_workout_id": "123",
        "sport_type": "running",
        "name": "Morning Run",
        "started_at": "2026-06-21T12:00:00+00:00",
        "duration_seconds": 2400,
        "distance_meters": 5000,
        "average_heart_rate": 140,
        "raw_data": {"start_date_local": "2026-06-21T08:00:00"},
    }
    row.update(overrides)
    return row


# Builds a representative planned workout row with optional test overrides.
def planned_row(**overrides: Any) -> dict[str, Any]:
    row = {
        "id": str(uuid4()),
        "training_plan_id": str(uuid4()),
        "actual_workout_id": None,
        "actual_workout": None,
        "planned_date": date.today().isoformat(),
        "sport_type": "run",
        "title": "Easy Run",
        "planned_duration_seconds": 2700,
        "target_distance_meters": None,
        "target_intensity": "easy z2",
        "purpose": "Aerobic base",
        "status": "planned",
    }
    row.update(overrides)
    return row


# Verifies planned cards follow the existing flattened mobile contract and transient statuses.
def test_format_training_hq_cards_flattens_planned_and_actual_workouts() -> None:
    actual = workout_row()
    completed = planned_row(
        actual_workout_id=actual["id"],
        actual_workout=actual,
        planned_date="2026-06-21",
    )
    upcoming = planned_row(planned_date=(date.today() + timedelta(days=1)).isoformat())

    cards = format_training_hq_cards([completed, upcoming], [actual])

    assert len(cards) == 2
    completed_card = next(card for card in cards if card["id"] == completed["id"])
    upcoming_card = next(card for card in cards if card["id"] == upcoming["id"])
    assert completed_card["cardType"] == "planned_workout"
    assert completed_card["displayStatus"] == "completed"
    assert completed_card["actualWorkout"]["sourceWorkoutId"] == "123"
    assert completed_card["plannedWorkout"]["plannedWorkoutId"] == completed["id"]
    assert upcoming_card["displayStatus"] == "next_workout"
    assert upcoming_card["source"] == "planned"
    assert upcoming_card["heartRate"]["average"] is None


# Verifies the response keeps legacy workouts while providing required cards and refresh metadata.
def test_build_training_hq_response_matches_mobile_response_contract() -> None:
    workout = workout_row()
    response = build_training_hq_response(
        {
            "display_name": "Taylor",
            "training_hq_refreshed_at": "2026-06-21T13:00:00+00:00",
        },
        None,
        [],
        [workout],
    )

    assert response["displayName"] == "Taylor"
    assert response["lastRefreshedAt"] == "2026-06-21T13:00:00+00:00"
    assert response["cards"][0]["cardType"] == "actual_workout"
    assert response["recentWorkouts"][0]["id"] == workout["id"]
    assert response["stats"] == {
        "recentWorkoutCount": 1,
        "totalDistanceMeters": 5000.0,
        "totalDurationSeconds": 2400,
        "averageHeartRate": 140.0,
    }


# Verifies matching normalizes provider sports and enforces local date and duration bounds.
def test_workout_matching_uses_approved_minimum_rules() -> None:
    plan = planned_row(planned_date="2026-06-21")

    assert normalize_sport("TrailRun") == "run"
    assert workout_matches_plan(plan, workout_row(duration_seconds=1400))
    assert not workout_matches_plan(plan, workout_row(duration_seconds=1000))
    assert not workout_matches_plan(plan, workout_row(sport_type="Ride"))


class FakeProfileService:
    # Initializes observable refresh state for orchestration assertions.
    def __init__(self) -> None:
        self.refreshed = False

    # Returns the profile fields consumed when the refreshed dashboard is rebuilt.
    def get_training_hq_profile(self, user_id: UUID) -> dict[str, Any]:
        return {"display_name": "Taylor", "training_hq_refreshed_at": None}

    # Records that the refresh timestamp stage was reached.
    def set_training_hq_refreshed_at(self, user_id: UUID, refreshed_at: Any) -> None:
        self.refreshed = True


class FakeRaceService:
    # Returns no race so refresh tests remain focused on orchestration.
    def get_race_info(self, user_id: UUID) -> None:
        return None


class FakeWorkoutService:
    # Initializes observable workout persistence state.
    def __init__(self) -> None:
        self.saved = False

    # Records that synced workouts were passed to persistence.
    def save_workouts(self, user_id: UUID, workouts: list[Any]) -> None:
        self.saved = True

    # Returns no history when the refreshed dashboard is rebuilt.
    def get_recent_workouts(self, user_id: UUID) -> list[dict[str, Any]]:
        return []


class FakeSummaryService:
    # Initializes observable summary creation state.
    def __init__(self) -> None:
        self.created = False

    # Records that missing workout summaries were requested.
    def create_missing_summaries(self, user_id: UUID) -> None:
        self.created = True


class FakeTrainingPlanService:
    # Initializes observable plan and matching state.
    def __init__(self) -> None:
        self.ensured = False
        self.matched = False

    # Returns a mock current plan for the refresh flow.
    def ensure_current_week_plan(self, user_id: UUID) -> dict[str, Any]:
        return {"id": "plan-id"}

    # Records that planned workouts were ensured for the current plan.
    def ensure_planned_workouts(self, user_id: UUID, training_plan_id: str) -> None:
        self.ensured = True

    # Records that actual and planned workout reconciliation ran.
    def match_completed_workouts_to_planned_workouts(self, user_id: UUID) -> None:
        self.matched = True

    # Returns no cards when the refreshed dashboard is rebuilt.
    def get_training_hq_cards(self, user_id: UUID) -> list[dict[str, Any]]:
        return []


class FakeStravaClient:
    # Returns a test token without external OAuth access.
    async def get_valid_access_token(self, user_id: UUID) -> str:
        return "token"

    # Returns one valid activity without making a Strava request.
    async def get_activities(self, access_token: str, *, per_page: int) -> list[dict[str, Any]]:
        return [{"id": 123, "sport_type": "Run", "moving_time": 1200}]

    # Returns no streams because the test activity has no heart-rate flag.
    async def get_activity_streams(
        self, access_token: str, *, activity_id: int, keys: list[str]
    ) -> dict[str, dict[str, Any]]:
        return {}


# Verifies refresh executes each mutation stage before rebuilding the dashboard.
@pytest.mark.asyncio
async def test_refresh_dashboard_completes_predefined_flow() -> None:
    profile = FakeProfileService()
    workouts = FakeWorkoutService()
    summaries = FakeSummaryService()
    plans = FakeTrainingPlanService()
    service = TrainingHQService(
        profile,  # type: ignore[arg-type]
        FakeRaceService(),  # type: ignore[arg-type]
        workouts,  # type: ignore[arg-type]
        plans,  # type: ignore[arg-type]
        summaries,  # type: ignore[arg-type]
        FakeStravaClient(),  # type: ignore[arg-type]
    )

    response = await service.refresh_dashboard(USER_ID)

    assert workouts.saved
    assert summaries.created
    assert plans.ensured
    assert plans.matched
    assert profile.refreshed
    assert response["cards"] == []
