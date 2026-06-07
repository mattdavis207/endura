import { useOnboardingStore } from "@/state/onboarding";

import type { GoalType } from "./types";
import { goalTypeLabels } from "./types";
import type { OnboardingScreenProps } from "./screenTypes";
import { ChoiceList, Field, OnboardingShell } from "./ui";

const goalOptions = (
  Object.entries(goalTypeLabels) as [GoalType, string][]
).map(([value, label]) => ({ label, value }));

export function RaceGoalScreen({
  onBack,
  onNext,
  progress,
}: OnboardingScreenProps) {
  const draft = useOnboardingStore((state) => state.draft);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);
  const detailComplete =
    draft.primaryGoalType === "time"
      ? Boolean(draft.targetFinishTime)
      : draft.primaryGoalType === "custom"
        ? Boolean(draft.customGoalText.trim())
        : true;

  return (
    <OnboardingShell
      canContinue={Boolean(draft.primaryGoalType && detailComplete)}
      eyebrow="Primary outcome"
      onBack={onBack}
      onContinue={onNext}
      progress={progress}
      subtitle="Pick the result that matters most. You can refine it later."
      title="What does success look like?"
    >
      <ChoiceList
        onChange={(primaryGoalType) => updateDraft({ primaryGoalType })}
        options={goalOptions}
        value={draft.primaryGoalType}
      />
      {draft.primaryGoalType === "time" ? (
        <Field
          keyboardType="numbers-and-punctuation"
          label="Target finish time"
          onChangeText={(targetFinishTime) => updateDraft({ targetFinishTime })}
          placeholder="11:59:00"
          value={draft.targetFinishTime}
        />
      ) : null}
      {draft.primaryGoalType === "custom" ? (
        <Field
          label="Custom goal"
          multiline
          onChangeText={(customGoalText) => updateDraft({ customGoalText })}
          placeholder="Bike 5:30 and run under 4:15"
          value={draft.customGoalText}
        />
      ) : null}
    </OnboardingShell>
  );
}
