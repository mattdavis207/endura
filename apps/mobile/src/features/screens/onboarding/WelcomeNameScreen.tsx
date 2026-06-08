import { useOnboardingStore } from "@/state/onboarding";

import type { OnboardingScreenProps } from "./screenTypes";
import { Field, OnboardingShell } from "./ui";

export function WelcomeNameScreen({ onNext, progress }: OnboardingScreenProps) {
  const firstName = useOnboardingStore((state) => state.draft.firstName);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);

  return (
    <OnboardingShell
      canContinue={firstName.trim().length > 0}
      continueLabel="Let's Begin"
      eyebrow="Welcome to Endura"
      onContinue={onNext}
      progress={progress}
      subtitle="We’ll use your name to make the Training HQ and coach feel like yours."
      title="What should we call you?"
    >
      <Field
        autoCapitalize="words"
        autoFocus
        label="First name"
        maxLength={50}
        onChangeText={(value) => updateDraft({ firstName: value })}
        placeholder="Matthew"
        returnKeyType="done"
        value={firstName}
      />
    </OnboardingShell>
  );
}
