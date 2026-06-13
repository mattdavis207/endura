from uuid import UUID
from typing import Annotated, Literal


from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from supabase_auth import User
from app.schemas.schemas import OnboardingSubmission
from app.services.onboarding_service import OnboardingService

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

onboarding_service = OnboardingService()

@router.post("/complete")
def complete_onboarding(
    payload: OnboardingSubmission,
    current_user: Annotated[User, Depends(get_current_user)],
):
    user_id = UUID(current_user.id)


    # Save profile fields
    onboarding_service.save_profile(user_id, payload)
    # Save active goal
    onboarding_service.save_active_goal(user_id, payload)
    # Save training preferences
    onboarding_service.save_training_preferences(user_id, payload)
    # Set onboarding_completed_at only after all writes succeed
    onboarding_service.complete_onboarding(user_id)

    return {"status": "completed"}