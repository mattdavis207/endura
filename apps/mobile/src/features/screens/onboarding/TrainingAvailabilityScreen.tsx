import { useOnboardingStore } from "@/state/onboarding";

import type { OnboardingScreenProps } from "./screenTypes";
import { numberOptions, WheelPickerField } from "./pickerFields";
import { OnboardingShell } from "./ui";

const weeklyHours = numberOptions(0, 80, 0.5, 1).map((option) => ({
  label: `${option.label} hours`,
  value: option.value,
}));
const dailyHours = numberOptions(0, 24, 0.5, 1).map((option) => ({
  label: `${option.label} hours`,
  value: option.value,
}));

const formatHours = (hours: number) => hours.toFixed(1);

export function TrainingAvailabilityScreen({
  onBack,
  onNext,
  progress,
}: OnboardingScreenProps) {
  const draft = useOnboardingStore((state) => state.draft);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);

  return (
    <OnboardingShell
      eyebrow="Your schedule"
      onBack={onBack}
      onContinue={onNext}
      progress={progress}
      subtitle="Give the planner realistic boundaries for a normal week."
      title="How much time can you train?"
    >
      <WheelPickerField
        label="Current weekly training"
        onChange={(value) =>
          updateDraft({ currentWeeklyTrainingHours: Number(value) })
        }
        options={weeklyHours}
        value={formatHours(draft.currentWeeklyTrainingHours)}
      />
      <WheelPickerField
        label="Available on a weekday"
        onChange={(value) =>
          updateDraft({ availableHoursWeekday: Number(value) })
        }
        options={dailyHours}
        value={formatHours(draft.availableHoursWeekday)}
      />
      <WheelPickerField
        label="Available on a weekend day"
        onChange={(value) =>
          updateDraft({ availableHoursWeekend: Number(value) })
        }
        options={dailyHours}
        value={formatHours(draft.availableHoursWeekend)}
      />
    </OnboardingShell>
  );
}
