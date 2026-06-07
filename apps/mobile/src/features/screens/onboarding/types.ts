export type RaceType =
  | "triathlon"
  | "running"
  | "cycling"
  | "swimming"
  | "custom";

export type DistanceUnit = "km" | "mi";

export type GoalType =
  | "finish"
  | "comfortable"
  | "time"
  | "competitive"
  | "custom";

export type TrainingExperience =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "competitive";

export type OnboardingStep =
  | "welcome"
  | "raceIdentity"
  | "raceSchedule"
  | "raceDistance"
  | "goalsTransition"
  | "raceGoal"
  | "swimTargets"
  | "bikeTargets"
  | "runTargets"
  | "athleteBasics"
  | "athleteMetrics"
  | "trainingAvailability"
  | "trainingDays"
  | "trainingNotes"
  | "dataConnection"
  | "success";

export type OnboardingDraft = {
  firstName: string;
  email: string;
  raceTitle: string;
  raceType: RaceType | "";
  raceDate: string;
  raceTime: string;
  raceTimezone: string;
  raceDistanceType: string;
  distanceUnit: DistanceUnit;
  customSwimDistance: string;
  customBikeDistance: string;
  customRunDistance: string;
  primaryGoalType: GoalType | "";
  targetFinishTime: string;
  customGoalText: string;
  targetSwimTime: string;
  targetSwimPace: string;
  targetBikeTime: string;
  targetBikePower: string;
  targetBikeSpeed: string;
  targetRunTime: string;
  targetRunPace: string;
  age: string;
  gender: string;
  phoneNumber: string;
  heightCm: number;
  weightKg: number;
  trainingExperience: TrainingExperience | "";
  currentWeeklyTrainingHours: number;
  preferredTrainingDays: string[];
  restDayPreference: string;
  availableHoursWeekday: number;
  availableHoursWeekend: number;
  injuryNotes: string;
  limitations: string;
  stravaConnected: boolean;
};

export const raceTypeLabels: Record<RaceType, string> = {
  triathlon: "Triathlon",
  running: "Running",
  cycling: "Cycling",
  swimming: "Swimming",
  custom: "Custom",
};

export const goalTypeLabels: Record<GoalType, string> = {
  finish: "Finish",
  comfortable: "Complete comfortably",
  time: "Set a time goal",
  competitive: "Qualify, podium, or compete",
  custom: "Custom goal",
};

export const distanceOptions: Record<RaceType, string[]> = {
  triathlon: [
    "Sprint",
    "Olympic",
    "Half Distance / 70.3",
    "Full Distance / 140.6",
    "Custom",
  ],
  running: ["5K", "10K", "Half Marathon", "Marathon", "Ultra", "Custom"],
  cycling: ["20K TT", "40K TT", "Century", "Gran Fondo", "Custom"],
  swimming: ["50m", "100m", "200m", "400m", "750m", "800m", "1500m", "1.2mi", "2.4mi", "5K Open Water", "Custom"],
  custom: ["Custom"],
};

export function getOnboardingSteps(raceType: RaceType | ""): OnboardingStep[] {
  const targetSteps: OnboardingStep[] =
    raceType === "triathlon"
      ? ["swimTargets", "bikeTargets", "runTargets"]
      : raceType === "swimming"
        ? ["swimTargets"]
        : raceType === "cycling"
          ? ["bikeTargets"]
          : raceType === "running"
            ? ["runTargets"]
            : [];

  return [
    "welcome",
    "raceIdentity",
    "raceSchedule",
    "raceDistance",
    "goalsTransition",
    "raceGoal",
    ...targetSteps,
    "athleteBasics",
    "athleteMetrics",
    "trainingAvailability",
    "trainingDays",
    "trainingNotes",
    "dataConnection",
    "success",
  ];
}
