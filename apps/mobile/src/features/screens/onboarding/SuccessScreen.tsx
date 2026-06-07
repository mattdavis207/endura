import { Ionicons } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useOnboardingStore } from "@/state/onboarding";

import { goalTypeLabels } from "./types";
import type { OnboardingScreenProps } from "./screenTypes";
import { OnboardingShell } from "./ui";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <VStack className="gap-1 border-b border-slate-800 py-3">
      <Text className="text-xs font-bold uppercase text-slate-500">
        {label}
      </Text>
      <Text className="text-base font-semibold text-white">{value}</Text>
    </VStack>
  );
}

export function SuccessScreen({
  onBack,
  onNext,
  progress,
}: OnboardingScreenProps) {
  const draft = useOnboardingStore((state) => state.draft);
  const goal =
    draft.primaryGoalType === "time"
      ? draft.targetFinishTime
      : draft.primaryGoalType === "custom"
        ? draft.customGoalText
        : draft.primaryGoalType
          ? goalTypeLabels[draft.primaryGoalType]
          : "Build toward race day";

  return (
    <OnboardingShell
      continueLabel="Enter Training HQ"
      eyebrow="Setup complete"
      onBack={onBack}
      onContinue={onNext}
      progress={progress}
      subtitle={`Your starting profile is ready, ${draft.firstName || "athlete"}.`}
      title="Your Training HQ is ready"
    >
      <Box className="items-center rounded-lg bg-blue-500 p-6">
        <Box className="h-16 w-16 items-center justify-center rounded-full bg-white">
          <Ionicons name="checkmark" size={34} color="#2563eb" />
        </Box>
        <Text className="mt-4 text-center text-lg font-bold text-white">
          Race command center configured
        </Text>
      </Box>

      <VStack className="rounded-lg border border-slate-700 bg-slate-900 px-4">
        <SummaryRow label="Race" value={draft.raceTitle} />
        <SummaryRow
          label="Race day"
          value={`${draft.raceDate} at ${draft.raceTime}`}
        />
        <SummaryRow label="Distance" value={draft.raceDistanceType} />
        <SummaryRow label="Goal" value={goal} />
        <SummaryRow
          label="Connected"
          value={draft.stravaConnected ? "Strava" : "Nothing yet"}
        />
      </VStack>
    </OnboardingShell>
  );
}
