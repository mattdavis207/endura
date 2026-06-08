import { useOnboardingStore } from "@/state/onboarding";

import type { GoalType } from "./types";
import { goalTypeLabels } from "./types";
import type { OnboardingScreenProps } from "./screenTypes";
import { DurationPickerField } from "./pickerFields";
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
        onChange={(primaryGoalType) =>
          updateDraft({
            primaryGoalType,
            targetFinishTime:
              primaryGoalType === "time" && !draft.targetFinishTime
                ? "12:00:00"
                : draft.targetFinishTime,
          })
        }
        options={goalOptions}
        value={draft.primaryGoalType}
      />
      {draft.primaryGoalType === "time" ? (
        <DurationPickerField
          fallback="12:00:00"
          label="Target finish time"
          maxHours={30}
          onChange={(targetFinishTime) => updateDraft({ targetFinishTime })}
          value={draft.targetFinishTime}
        />
      ) : null}
      {draft.primaryGoalType === "custom" ? (
        <Field
          label="Custom goal"
          maxLength={240}
          multiline
          onChangeText={(customGoalText) => updateDraft({ customGoalText })}
          placeholder="Bike 5:30 and run under 4:15"
          showCharacterCount
          value={draft.customGoalText}
        />
      ) : null}
    </OnboardingShell>
  );
}
