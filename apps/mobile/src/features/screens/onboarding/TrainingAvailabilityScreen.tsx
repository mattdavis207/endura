import { useOnboardingStore } from "@/state/onboarding";

import type { OnboardingScreenProps } from "./screenTypes";
import { NumberWheel, OnboardingShell } from "./ui";

const weeklyHours = Array.from({ length: 30 }, (_, index) => index + 1);
const weekdayHours = Array.from({ length: 6 }, (_, index) => index);
const weekendHours = Array.from({ length: 11 }, (_, index) => index);

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
      <NumberWheel
        label="Current weekly training"
        onChange={(currentWeeklyTrainingHours) =>
          updateDraft({ currentWeeklyTrainingHours })
        }
        suffix="hours"
        value={draft.currentWeeklyTrainingHours}
        values={weeklyHours}
      />
      <NumberWheel
        label="Available on a weekday"
        onChange={(availableHoursWeekday) =>
          updateDraft({ availableHoursWeekday })
        }
        suffix="hours"
        value={draft.availableHoursWeekday}
        values={weekdayHours}
      />
      <NumberWheel
        label="Available on a weekend day"
        onChange={(availableHoursWeekend) =>
          updateDraft({ availableHoursWeekend })
        }
        suffix="hours"
        value={draft.availableHoursWeekend}
        values={weekendHours}
      />
    </OnboardingShell>
  );
}
