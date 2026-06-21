from datetime import datetime, timezone
from unittest.mock import Mock
from uuid import UUID

from app.services.workout_service import WorkoutService

USER_ID = UUID("00000000-0000-0000-0000-000000000001")


# Verifies previous-workout reads enforce ownership, strict pagination, order, and page size.
def test_get_workouts_before_builds_scoped_paginated_query() -> None:
    rows = [{"id": "workout-id", "started_at": "2026-06-20T12:00:00+00:00"}]
    response = Mock(data=rows)
    query = Mock()
    query.select.return_value = query
    query.eq.return_value = query
    query.lt.return_value = query
    query.order.return_value = query
    query.limit.return_value = query
    query.execute.return_value = response
    client = Mock()
    client.table.return_value = query
    service = WorkoutService(client_factory=Mock(return_value=client))
    before = datetime(2026, 6, 21, 12, tzinfo=timezone.utc)

    result = service.get_workouts_before(USER_ID, before)

    assert result == rows
    client.table.assert_called_once_with("workouts")
    query.select.assert_called_once_with("*")
    query.eq.assert_called_once_with("user_id", str(USER_ID))
    query.lt.assert_called_once_with("started_at", before.isoformat())
    query.order.assert_called_once_with("started_at", desc=True)
    query.limit.assert_called_once_with(10)
    query.execute.assert_called_once_with()
