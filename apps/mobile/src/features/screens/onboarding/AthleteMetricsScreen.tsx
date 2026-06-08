import { useOnboardingStore } from "@/state/onboarding";

import type { HeightUnit, TrainingExperience, WeightUnit } from "./types";
import type { OnboardingScreenProps } from "./screenTypes";
import { numberOptions, ValueUnitPickerField } from "./pickerFields";
import { ChoiceList, OnboardingShell } from "./ui";

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
  const heightValue =
    draft.heightUnit === "cm"
      ? String(Math.round(draft.heightCm))
      : String(Math.round(draft.heightCm / 2.54));
  const weightValue =
    draft.weightUnit === "kg"
      ? String(Math.round(draft.weightKg))
      : String(Math.round(draft.weightKg * 2.2046226218));

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
      <ValueUnitPickerField<HeightUnit>
        label="Height"
        onUnitChange={(heightUnit) => updateDraft({ heightUnit })}
        onValueChange={(value) =>
          updateDraft({
            heightCm:
              draft.heightUnit === "cm"
                ? Number(value)
                : Math.round(Number(value) * 2.54),
          })
        }
        unit={draft.heightUnit}
        unitOptions={[
          { label: "cm", value: "cm" },
          { label: "in", value: "in" },
        ]}
        value={heightValue}
        valueOptions={
          draft.heightUnit === "cm"
            ? numberOptions(120, 230)
            : numberOptions(48, 90)
        }
      />
      <ValueUnitPickerField<WeightUnit>
        label="Weight"
        onUnitChange={(weightUnit) => updateDraft({ weightUnit })}
        onValueChange={(value) =>
          updateDraft({
            weightKg:
              draft.weightUnit === "kg"
                ? Number(value)
                : Math.round(Number(value) / 2.2046226218),
          })
        }
        unit={draft.weightUnit}
        unitOptions={[
          { label: "kg", value: "kg" },
          { label: "lb", value: "lb" },
        ]}
        value={weightValue}
        valueOptions={
          draft.weightUnit === "kg"
            ? numberOptions(35, 250)
            : numberOptions(77, 550)
        }
      />
      <ChoiceList
        onChange={(trainingExperience) => updateDraft({ trainingExperience })}
        options={experienceOptions}
        value={draft.trainingExperience}
      />
    </OnboardingShell>
  );
}
