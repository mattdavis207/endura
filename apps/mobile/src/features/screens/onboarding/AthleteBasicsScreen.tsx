import { useEffect } from "react";

import { useOnboardingStore } from "@/state/onboarding";

import type { OnboardingScreenProps } from "./screenTypes";
import { numberOptions, WheelPickerField } from "./pickerFields";
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

  useEffect(() => {
    if (!draft.age) {
      updateDraft({ age: "30" });
    }
  }, [draft.age, updateDraft]);

  const canContinue = Boolean(
    draft.email.includes("@") && Number(draft.age || 30) >= 13 && draft.gender,
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
        maxLength={254}
        onChangeText={(email) => updateDraft({ email })}
        placeholder="you@example.com"
        value={draft.email}
      />
      <WheelPickerField
        label="Age"
        onChange={(age) => updateDraft({ age })}
        options={numberOptions(13, 100)}
        value={draft.age || "30"}
      />
      <ChoiceList
        onChange={(gender) => updateDraft({ gender })}
        options={genderOptions}
        value={draft.gender}
      />
    </OnboardingShell>
  );
}
