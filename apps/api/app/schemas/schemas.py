from datetime import date, time
from decimal import Decimal
from typing import Annotated, Any, Literal

from pydantic import (
    AliasGenerator,
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)
from pydantic.alias_generators import to_camel

RaceType = Literal["triathlon", "running", "cycling", "swimming", "custom"]
PrimaryGoalType = Literal["finish", "comfortable", "time", "competitive", "custom"]
Gender = Literal["woman", "man", "non_binary", "not_specified"]
TrainingExperience = Literal["beginner", "intermediate", "advanced", "competitive"]
DistanceUnit = Literal["km", "mi"]
HeightUnit = Literal["cm", "in"]
WeightUnit = Literal["kg", "lb"]
DayOfWeek = Literal[
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
]
RestDay = Literal[
    "flexible",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
]

PositiveDecimal = Annotated[Decimal, Field(gt=0)]
OptionalDuration = Annotated[
    str | None,
    Field(pattern=r"^\d{2}:\d{2}:\d{2}$"),
]


class StravaRefreshTokenResponse(BaseModel):
    token_type: Literal["Bearer"]
    access_token: str
    expires_at: int
    expires_in: int
    refresh_token: str


class OnboardingSubmission(BaseModel):
    model_config = ConfigDict(
        alias_generator=AliasGenerator(
            validation_alias=to_camel,
            serialization_alias=to_camel,
        ),
        populate_by_name=True,
        extra="forbid",
        str_strip_whitespace=True,
    )

    #display name
    first_name: Annotated[str, Field(min_length=1, max_length=100)]

    # race day information
    race_title: Annotated[str, Field(min_length=1, max_length=200)]
    race_type: RaceType
    race_date: date
    race_time: time
    race_timezone: Annotated[str, Field(min_length=1, max_length=100)]
    race_distance_type: Annotated[str, Field(min_length=1, max_length=100)]
    distance_unit: DistanceUnit
    custom_swim_distance: PositiveDecimal | None = None
    custom_bike_distance: PositiveDecimal | None = None
    custom_run_distance: PositiveDecimal | None = None

    # goal metrics
    primary_goal_type: PrimaryGoalType
    target_finish_time: OptionalDuration = None
    custom_goal_text: Annotated[str | None, Field(max_length=240)] = None
    target_swim_time: OptionalDuration = None
    target_swim_pace: Annotated[str | None, Field(max_length=40)] = None
    target_bike_time: OptionalDuration = None
    target_bike_power: Annotated[int | None, Field(gt=0)] = None
    target_bike_speed: Annotated[str | None, Field(max_length=40)] = None
    target_run_time: OptionalDuration = None
    target_run_pace: Annotated[str | None, Field(max_length=40)] = None

    # all profile information
    age: Annotated[int, Field(ge=13, le=120)]
    gender: Gender
    phone_number: Annotated[str | None, Field(min_length=7, max_length=30)] = None
    height_cm: Annotated[Decimal, Field(ge=100, le=250)]
    height_unit: HeightUnit
    weight_kg: Annotated[Decimal, Field(ge=25, le=350)]
    weight_unit: WeightUnit
    training_experience: TrainingExperience

    # training preferences
    current_weekly_training_hours: Annotated[Decimal, Field(ge=0, le=168)]
    preferred_training_days: Annotated[list[DayOfWeek], Field(min_length=1, max_length=7)]
    rest_day_preferences: Annotated[list[RestDay], Field(max_length=7)]
    available_hours_weekday: Annotated[Decimal, Field(ge=0, le=24)]
    available_hours_weekend: Annotated[Decimal, Field(ge=0, le=24)]
    injury_notes: Annotated[str | None, Field(max_length=500)] = None
    limitations: Annotated[str | None, Field(max_length=500)] = None

    @field_validator(
        "custom_swim_distance",
        "custom_bike_distance",
        "custom_run_distance",
        "target_finish_time",
        "custom_goal_text",
        "target_swim_time",
        "target_swim_pace",
        "target_bike_time",
        "target_bike_power",
        "target_bike_speed",
        "target_run_time",
        "target_run_pace",
        "phone_number",
        "injury_notes",
        "limitations",
        mode="before",
    )
    @classmethod
    def blank_values_are_none(cls, value: Any) -> Any:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @model_validator(mode="after")
    def validate_goal_details(self) -> "OnboardingSubmission":
        if self.primary_goal_type == "time" and self.target_finish_time is None:
            raise ValueError("targetFinishTime is required for a time goal")

        if self.primary_goal_type == "custom" and self.custom_goal_text is None:
            raise ValueError("customGoalText is required for a custom goal")

        if len(set(self.preferred_training_days)) != len(self.preferred_training_days):
            raise ValueError("preferredTrainingDays must not contain duplicates")

        if len(set(self.rest_day_preferences)) != len(self.rest_day_preferences):
            raise ValueError("restDayPreferences must not contain duplicates")

        if "flexible" in self.rest_day_preferences and len(self.rest_day_preferences) != 1:
            raise ValueError("flexible must be the only rest day preference")

        return self
