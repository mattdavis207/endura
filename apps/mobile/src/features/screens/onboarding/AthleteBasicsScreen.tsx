import { useOnboardingStore } from "@/state/onboarding";

import type { OnboardingScreenProps } from "./screenTypes";
import { ChoiceList, Field, OnboardingShell } from "./ui";

const genderOptions = [
  { label: "Woman", value: "woman" },
  { label: "Man", value: "man" },
  { label: "Non-binary", value: "non_binary" },
  { label: "Prefer not to say", value: "not_specified" },
];

export function AthleteBasicsScreen({
  onBack,
  onNext,
  progress,
}: OnboardingScreenProps) {
  const draft = useOnboardingStore((state) => state.draft);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);
  const canContinue = Boolean(
    draft.email.includes("@") && Number(draft.age) >= 13 && draft.gender,
  );

  return (
    <OnboardingShell
      canContinue={canContinue}
      eyebrow="Athlete profile"
      onBack={onBack}
      onContinue={onNext}
      progress={progress}
      subtitle={`A few basics help personalize training guidance for ${draft.firstName || "you"}.`}
      title="Tell us about the athlete"
    >
      <Field
        autoCapitalize="none"
        keyboardType="email-address"
        label="Email"
        onChangeText={(email) => updateDraft({ email })}
        placeholder="you@example.com"
        value={draft.email}
      />
      <Field
        keyboardType="number-pad"
        label="Age"
        maxLength={3}
        onChangeText={(age) => updateDraft({ age })}
        placeholder="30"
        value={draft.age}
      />
      <ChoiceList
        onChange={(gender) => updateDraft({ gender })}
        options={genderOptions}
        value={draft.gender}
      />
    </OnboardingShell>
  );
}
