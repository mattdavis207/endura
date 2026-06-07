import { useOnboardingStore } from "@/state/onboarding";

import type { TrainingExperience } from "./types";
import type { OnboardingScreenProps } from "./screenTypes";
import { ChoiceList, NumberWheel, OnboardingShell } from "./ui";

const heights = Array.from({ length: 81 }, (_, index) => index + 140);
const weights = Array.from({ length: 141 }, (_, index) => index + 40);

const experienceOptions: {
  label: string;
  value: TrainingExperience;
}[] = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
  { label: "Competitive", value: "competitive" },
];

export function AthleteMetricsScreen({
  onBack,
  onNext,
  progress,
}: OnboardingScreenProps) {
  const draft = useOnboardingStore((state) => state.draft);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);

  return (
    <OnboardingShell
      eyebrow="Training profile"
      onBack={onBack}
      onContinue={onNext}
      onSkip={onNext}
      progress={progress}
      subtitle="These values are optional and can be changed from Settings."
      title="Add some training context"
    >
      <NumberWheel
        label="Height"
        onChange={(heightCm) => updateDraft({ heightCm })}
        suffix="cm"
        value={draft.heightCm}
        values={heights}
      />
      <NumberWheel
        label="Weight"
        onChange={(weightKg) => updateDraft({ weightKg })}
        suffix="kg"
        value={draft.weightKg}
        values={weights}
      />
      <ChoiceList
        onChange={(trainingExperience) => updateDraft({ trainingExperience })}
        options={experienceOptions}
        value={draft.trainingExperience}
      />
    </OnboardingShell>
  );
}
