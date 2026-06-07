import { useOnboardingStore } from "@/state/onboarding";

import type { OnboardingScreenProps } from "./screenTypes";
import { Field, OnboardingShell } from "./ui";

export function TrainingNotesScreen({
  onBack,
  onNext,
  progress,
}: OnboardingScreenProps) {
  const draft = useOnboardingStore((state) => state.draft);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);

  return (
    <OnboardingShell
      eyebrow="Optional context"
      onBack={onBack}
      onContinue={onNext}
      onSkip={onNext}
      progress={progress}
      subtitle="Keep this brief. You can maintain detailed notes with your workouts later."
      title="Anything the coach should account for?"
    >
      <Field
        label="Current injuries"
        multiline
        onChangeText={(injuryNotes) => updateDraft({ injuryNotes })}
        optional
        placeholder="Left calf is returning from a mild strain"
        value={draft.injuryNotes}
      />
      <Field
        label="Other limitations"
        multiline
        onChangeText={(limitations) => updateDraft({ limitations })}
        optional
        placeholder="No pool access on Fridays"
        value={draft.limitations}
      />
    </OnboardingShell>
  );
}
