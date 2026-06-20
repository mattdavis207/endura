from collections.abc import Callable
from typing import Any, cast
from uuid import UUID

from supabase import Client

from app.db.supabase import create_supabase_admin_client


class TrainingPlanService:
    def __init__(
        self,
        client_factory: Callable[[], Client] = create_supabase_admin_client,
    ) -> None:
        self._client_factory = client_factory

    def get_current_week_plan(self, user_id):
        return None
    # def ensure_current_week_plan(self, user_id):

    # def ensure_planned_workouts(self, user_id, training_plan_id):

    # def get_training_hq_cards(self, user_id):

    # def match_completed_workouts_to_planned_workouts(self, user_id):
