import { Pressable } from "react-native";

import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useOnboardingStore } from "@/state/onboarding";

import type { OnboardingScreenProps } from "./screenTypes";
import { MultiChoiceList, OnboardingShell } from "./ui";

const days = [
  ["Mon", "Monday"],
  ["Tue", "Tuesday"],
  ["Wed", "Wednesday"],
  ["Thu", "Thursday"],
  ["Fri", "Friday"],
  ["Sat", "Saturday"],
  ["Sun", "Sunday"],
] as const;

const restOptions = [
  { label: "Flexible", value: "flexible" },
  { label: "Monday", value: "monday" },
  { label: "Tuesday", value: "tuesday" },
  { label: "Wednesday", value: "wednesday" },
  { label: "Thursday", value: "thursday" },
  { label: "Friday", value: "friday" },
  { label: "Saturday", value: "saturday" },
  { label: "Sunday", value: "sunday" },
];

export function TrainingDaysScreen({
  onBack,
  onNext,
  progress,
}: OnboardingScreenProps) {
  const draft = useOnboardingStore((state) => state.draft);
  const toggleTrainingDay = useOnboardingStore(
    (state) => state.toggleTrainingDay,
  );
  const toggleRestDay = useOnboardingStore((state) => state.toggleRestDay);

  return (
    <OnboardingShell
      canContinue={draft.preferredTrainingDays.length > 0}
      eyebrow="Weekly rhythm"
      onBack={onBack}
      onContinue={onNext}
      progress={progress}
      subtitle="Choose every day that normally works. The weekly plan can still adapt."
      title="When do you prefer to train?"
    >
      <VStack className="gap-3">
        <Text className="text-sm font-bold text-slate-200">
          Preferred training days
        </Text>
        <HStack className="flex-wrap gap-2">
          {days.map(([shortLabel, value]) => {
            const selected = draft.preferredTrainingDays.includes(value);

            return (
              <Pressable
                className={`h-12 min-w-16 flex-1 items-center justify-center rounded-md border ${
                  selected
                    ? "border-blue-400 bg-blue-500"
                    : "border-slate-700 bg-slate-900"
                }`}
                key={value}
                onPress={() => toggleTrainingDay(value)}
              >
                <Text
                  className={`text-sm font-bold ${
                    selected ? "text-white" : "text-slate-300"
                  }`}
                >
                  {shortLabel}
                </Text>
              </Pressable>
            );
          })}
        </HStack>
      </VStack>

      <MultiChoiceList
        label="Preferred rest days (select all that apply)"
        onChange={toggleRestDay}
        options={restOptions}
        values={draft.restDayPreferences}
      />
    </OnboardingShell>
  );
}
