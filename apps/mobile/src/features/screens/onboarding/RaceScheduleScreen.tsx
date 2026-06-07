import { useOnboardingStore } from "@/state/onboarding";

import type { OnboardingScreenProps } from "./screenTypes";
import { Field, OnboardingShell } from "./ui";

export function RaceScheduleScreen({
  onBack,
  onNext,
  progress,
}: OnboardingScreenProps) {
  const draft = useOnboardingStore((state) => state.draft);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);

  return (
    <OnboardingShell
      canContinue={Boolean(draft.raceDate && draft.raceTime)}
      eyebrow={draft.raceTitle || "Race schedule"}
      onBack={onBack}
      onContinue={onNext}
      progress={progress}
      subtitle="These values drive your countdown, training phase, and taper timing."
      title="When is race day?"
    >
      <Field
        keyboardType="numbers-and-punctuation"
        label="Race date"
        onChangeText={(raceDate) => updateDraft({ raceDate })}
        placeholder="YYYY-MM-DD"
        value={draft.raceDate}
      />
      <Field
        keyboardType="numbers-and-punctuation"
        label="Start time"
        onChangeText={(raceTime) => updateDraft({ raceTime })}
        placeholder="07:00"
        value={draft.raceTime}
      />
      <Field
        autoCapitalize="none"
        label="Time zone"
        onChangeText={(raceTimezone) => updateDraft({ raceTimezone })}
        placeholder="America/New_York"
        value={draft.raceTimezone}
      />
    </OnboardingShell>
  );
}
