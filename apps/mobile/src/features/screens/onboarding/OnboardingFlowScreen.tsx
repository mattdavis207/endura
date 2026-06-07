import { useRouter } from "expo-router";

import { useOnboardingStore } from "@/state/onboarding";

import { AthleteBasicsScreen } from "./AthleteBasicsScreen";
import { AthleteMetricsScreen } from "./AthleteMetricsScreen";
import {
  BikeTargetsScreen,
  RunTargetsScreen,
  SwimTargetsScreen,
} from "./DisciplineTargetScreens";
import { DataConnectionScreen } from "./DataConnectionScreen";
import { GoalsTransitionScreen } from "./GoalsTransitionScreen";
import { RaceDistanceScreen } from "./RaceDistanceScreen";
import { RaceGoalScreen } from "./RaceGoalScreen";
import { RaceIdentityScreen } from "./RaceIdentityScreen";
import { RaceScheduleScreen } from "./RaceScheduleScreen";
import type { OnboardingScreenProps } from "./screenTypes";
import { SuccessScreen } from "./SuccessScreen";
import { TrainingAvailabilityScreen } from "./TrainingAvailabilityScreen";
import { TrainingDaysScreen } from "./TrainingDaysScreen";
import { TrainingNotesScreen } from "./TrainingNotesScreen";
import { getOnboardingSteps } from "./types";
import { WelcomeNameScreen } from "./WelcomeNameScreen";

export function OnboardingFlowScreen() {
  const router = useRouter();
  const raceType = useOnboardingStore((state) => state.draft.raceType);
  const step = useOnboardingStore((state) => state.step);
  const setStep = useOnboardingStore((state) => state.setStep);
  const steps = getOnboardingSteps(raceType);
  const stepIndex = Math.max(steps.indexOf(step), 0);
  const progress = (stepIndex + 1) / steps.length;

  const goBack = () => {
    const previousStep = steps[stepIndex - 1];

    if (previousStep) {
      setStep(previousStep);
      return;
    }

    router.back();
  };

  const goNext = () => {
    const nextStep = steps[stepIndex + 1];

    if (nextStep) {
      setStep(nextStep);
      return;
    }

    // Replace this navigation with the final profile/goal API submission.
    router.replace("/training");
  };

  const screenProps: OnboardingScreenProps = {
    onBack: stepIndex > 0 ? goBack : undefined,
    onNext: goNext,
    progress,
  };

  switch (step) {
    case "raceIdentity":
      return <RaceIdentityScreen {...screenProps} />;
    case "raceSchedule":
      return <RaceScheduleScreen {...screenProps} />;
    case "raceDistance":
      return <RaceDistanceScreen {...screenProps} />;
    case "goalsTransition":
      return <GoalsTransitionScreen {...screenProps} />;
    case "raceGoal":
      return <RaceGoalScreen {...screenProps} />;
    case "swimTargets":
      return <SwimTargetsScreen {...screenProps} />;
    case "bikeTargets":
      return <BikeTargetsScreen {...screenProps} />;
    case "runTargets":
      return <RunTargetsScreen {...screenProps} />;
    case "athleteBasics":
      return <AthleteBasicsScreen {...screenProps} />;
    case "athleteMetrics":
      return <AthleteMetricsScreen {...screenProps} />;
    case "trainingAvailability":
      return <TrainingAvailabilityScreen {...screenProps} />;
    case "trainingDays":
      return <TrainingDaysScreen {...screenProps} />;
    case "trainingNotes":
      return <TrainingNotesScreen {...screenProps} />;
    case "dataConnection":
      return <DataConnectionScreen {...screenProps} />;
    case "success":
      return <SuccessScreen {...screenProps} />;
    case "welcome":
    default:
      return <WelcomeNameScreen {...screenProps} />;
  }
}
