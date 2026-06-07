import { Ionicons } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { useOnboardingStore } from "@/state/onboarding";

import type { OnboardingScreenProps } from "./screenTypes";
import { OnboardingShell } from "./ui";

export function GoalsTransitionScreen({
  onBack,
  onNext,
  progress,
}: OnboardingScreenProps) {
  const raceTitle = useOnboardingStore((state) => state.draft.raceTitle);

  return (
    <OnboardingShell
      continueLabel="Set My Goals"
      eyebrow="Race captured"
      onBack={onBack}
      onContinue={onNext}
      progress={progress}
      subtitle="Next, we’ll turn the result you want into targets the coach can compare against your training."
      title={`Now let’s set your goals for ${raceTitle || "race day"}.`}
    >
      <Box className="h-56 items-center justify-center rounded-lg border border-slate-700 bg-slate-900">
        <Box className="h-20 w-20 items-center justify-center rounded-full bg-blue-500">
          <Ionicons name="flag-outline" size={36} color="#ffffff" />
        </Box>
        <Text className="mt-5 text-center text-sm font-semibold text-slate-300">
          Outcome first. Discipline targets next.
        </Text>
      </Box>
    </OnboardingShell>
  );
}
