from decimal import Decimal
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends
from supabase_auth import User

from app.core.auth import get_current_user
from app.services.training_hq_service import TrainingHQService
from app.services.profile_service import ProfileService
from app.services.race_service import RaceService
from app.services.training_plan_service import TrainingPlanService
from app.services.workout_service import WorkoutService


router = APIRouter(prefix="/training-hq", tags=["training-hq"])

training_hq_service = TrainingHQService(ProfileService(), RaceService(), WorkoutService(), TrainingPlanService())

@router.get("")
def get_training_hq(
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, Any]:
    user_id = UUID(current_user.id)

    training_hq_response = training_hq_service.get_dashboard(user_id)
    
    return training_hq_response

    

# refresh training hq dashboard with planned and completed workouts sync
# @router.post("/refresh")
# def post_training_hq(
#     current_user: Annotated[User, Depends(get_current_user)]
# ):
    