from datetime import datetime
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends
from supabase_auth import User

from app.core.auth import get_current_user
from app.integrations.strava.strava_client import StravaClient
from app.services.profile_service import ProfileService
from app.services.race_service import RaceService
from app.services.training_hq_service import TrainingHQService
from app.services.training_plan_service import TrainingPlanService
from app.services.workout_service import WorkoutService
from app.services.workout_summary_service import WorkoutSummaryService

router = APIRouter(prefix="/training-hq", tags=["training-hq"])

training_hq_service = TrainingHQService(
    ProfileService(),
    RaceService(),
    WorkoutService(),
    TrainingPlanService(),
    WorkoutSummaryService(),
    StravaClient(),
)


# Returns the authenticated user's currently persisted Training HQ dashboard.
@router.get("")
def get_training_hq(
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, Any]:
    user_id = UUID(current_user.id)

    return training_hq_service.get_dashboard(user_id)


# Returns the authenticated user's workouts strictly before the pagination cursor.
@router.get("/workouts")
def get_previous_workouts(
    before: datetime,
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[dict[str, Any]]:
    return training_hq_service.get_workouts_before(UUID(current_user.id), before)


# Refreshes Strava and planning data before returning the updated Training HQ dashboard.
@router.post("/refresh")
async def refresh_training_hq(
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, Any]:
    return await training_hq_service.refresh_dashboard(UUID(current_user.id))
