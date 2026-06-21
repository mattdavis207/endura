from datetime import datetime, timezone
from typing import Any
from unittest.mock import AsyncMock, Mock
from uuid import UUID

from fastapi.testclient import TestClient

from app.api import training_hq
from app.core.auth import get_current_user
from app.main import app


class FakeUser:
    id = "00000000-0000-0000-0000-000000000001"


# Supplies an authenticated user without calling Supabase Auth in route tests.
def override_current_user() -> FakeUser:
    return FakeUser()


# Verifies GET delegates to the database-only dashboard read for the authenticated owner.
def test_get_training_hq_uses_authenticated_user() -> None:
    expected: dict[str, Any] = {"cards": [], "lastRefreshedAt": None}
    original_service = training_hq.training_hq_service
    mocked_service = Mock()
    mocked_service.get_dashboard.return_value = expected
    training_hq.training_hq_service = mocked_service
    app.dependency_overrides[get_current_user] = override_current_user
    try:
        response = TestClient(app).get("/training-hq")
    finally:
        training_hq.training_hq_service = original_service
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == expected
    mocked_service.get_dashboard.assert_called_once_with(UUID(FakeUser.id))


# Verifies workout pagination delegates with the authenticated owner and parsed cursor.
def test_get_previous_workouts_uses_authenticated_user_and_before_cursor() -> None:
    expected = [{"id": "workout-id", "startedAt": "2026-06-20T12:00:00+00:00"}]
    original_service = training_hq.training_hq_service
    mocked_service = Mock()
    mocked_service.get_workouts_before.return_value = expected
    training_hq.training_hq_service = mocked_service
    app.dependency_overrides[get_current_user] = override_current_user
    try:
        response = TestClient(app).get(
            "/training-hq/workouts",
            params={"before": "2026-06-21T12:00:00+00:00"},
        )
    finally:
        training_hq.training_hq_service = original_service
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == expected
    mocked_service.get_workouts_before.assert_called_once_with(
        UUID(FakeUser.id), datetime(2026, 6, 21, 12, tzinfo=timezone.utc)
    )


# Verifies FastAPI rejects an invalid workout pagination timestamp.
def test_get_previous_workouts_rejects_invalid_before_cursor() -> None:
    app.dependency_overrides[get_current_user] = override_current_user
    try:
        response = TestClient(app).get(
            "/training-hq/workouts", params={"before": "not-a-timestamp"}
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422


# Verifies POST delegates to the explicit refresh flow for the authenticated owner.
def test_refresh_training_hq_uses_authenticated_user() -> None:
    expected: dict[str, Any] = {"cards": [], "lastRefreshedAt": "now"}
    original_service = training_hq.training_hq_service
    mocked_service = Mock()
    mocked_service.refresh_dashboard = AsyncMock(return_value=expected)
    training_hq.training_hq_service = mocked_service
    app.dependency_overrides[get_current_user] = override_current_user
    try:
        response = TestClient(app).post("/training-hq/refresh", json={})
    finally:
        training_hq.training_hq_service = original_service
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == expected
    mocked_service.refresh_dashboard.assert_awaited_once_with(UUID(FakeUser.id))
