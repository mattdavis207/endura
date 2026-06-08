import { useOnboardingStore } from "@/state/onboarding";

import type { OnboardingScreenProps } from "./screenTypes";
import {
  DurationPickerField,
  numberOptions,
  PacePickerField,
  ValueUnitPickerField,
  WheelPickerField,
} from "./pickerFields";
import { OnboardingShell } from "./ui";

function parseSpeed(value: string) {
  const match = value.match(/^(\d+(?:\.\d+)?) (km\/h|mph)$/);

  return {
    unit: (match?.[2] ?? "mph") as "km/h" | "mph",
    value: match?.[1] ?? "18.0",
  };
}

export function SwimTargetsScreen({
  onBack,
  onNext,
  progress,
}: OnboardingScreenProps) {
  const draft = useOnboardingStore((state) => state.draft);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);

  return (
    <OnboardingShell
      eyebrow="Swim targets"
      onBack={onBack}
      onContinue={onNext}
      onSkip={onNext}
      progress={progress}
      subtitle="Optional targets give the coach a benchmark for pacing and progress."
      title="What would a strong swim look like?"
    >
      <DurationPickerField
        fallback="01:15:00"
        label="Target swim time"
        maxHours={5}
        onChange={(targetSwimTime) => updateDraft({ targetSwimTime })}
        optional
        value={draft.targetSwimTime}
      />
      <PacePickerField
        fallback="02:00 /100m"
        label="Target swim pace"
        onChange={(targetSwimPace) => updateDraft({ targetSwimPace })}
        optional
        units={["100m", "100yd"]}
        value={draft.targetSwimPace}
      />
    </OnboardingShell>
  );
}

export function BikeTargetsScreen({
  onBack,
  onNext,
  progress,
}: OnboardingScreenProps) {
  const draft = useOnboardingStore((state) => state.draft);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);
  const speed = parseSpeed(draft.targetBikeSpeed);
  const speedOptions =
    speed.unit === "mph"
      ? numberOptions(5, 45, 0.5, 1)
      : numberOptions(8, 72, 0.5, 1);

  return (
    <OnboardingShell
      eyebrow="Bike targets"
      onBack={onBack}
      onContinue={onNext}
      onSkip={onNext}
      progress={progress}
      subtitle="Use whichever metric you train with. Every field is optional."
      title="Set your bike benchmarks"
    >
      <DurationPickerField
        fallback="06:00:00"
        label="Target bike time"
        maxHours={24}
        onChange={(targetBikeTime) => updateDraft({ targetBikeTime })}
        optional
        value={draft.targetBikeTime}
      />
      <WheelPickerField
        label="Target average power"
        onChange={(targetBikePower) => updateDraft({ targetBikePower })}
        optional
        options={numberOptions(50, 600, 5).map((option) => ({
          label: `${option.label} watts`,
          value: option.value,
        }))}
        value={draft.targetBikePower || "180"}
      />
      <ValueUnitPickerField
        label="Target average speed"
        onUnitChange={(unit) => {
          const converted =
            unit === "km/h"
              ? Math.min(72, Number(speed.value) * 1.609344)
              : Math.max(5, Number(speed.value) / 1.609344);
          const rounded = Math.round(converted * 2) / 2;
          updateDraft({
            targetBikeSpeed: `${rounded.toFixed(1)} ${unit}`,
          });
        }}
        onValueChange={(value) =>
          updateDraft({ targetBikeSpeed: `${value} ${speed.unit}` })
        }
        optional
        unit={speed.unit}
        unitOptions={[
          { label: "km/h", value: "km/h" },
          { label: "mph", value: "mph" },
        ]}
        value={speed.value}
        valueOptions={speedOptions}
      />
    </OnboardingShell>
  );
}

export function RunTargetsScreen({
  onBack,
  onNext,
  progress,
}: OnboardingScreenProps) {
  const draft = useOnboardingStore((state) => state.draft);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);

  return (
    <OnboardingShell
      eyebrow="Run targets"
      onBack={onBack}
      onContinue={onNext}
      onSkip={onNext}
      progress={progress}
      subtitle="These targets can be adjusted as your fitness and race plan develop."
      title="What pace are you building toward?"
    >
      <DurationPickerField
        fallback="04:30:00"
        label="Target run time"
        maxHours={24}
        onChange={(targetRunTime) => updateDraft({ targetRunTime })}
        optional
        value={draft.targetRunTime}
      />
      <PacePickerField
        fallback={`${draft.distanceUnit === "km" ? "06:00 /km" : "10:00 /mi"}`}
        label="Target pace"
        onChange={(targetRunPace) => updateDraft({ targetRunPace })}
        optional
        units={["km", "mi"]}
        value={draft.targetRunPace}
      />
    </OnboardingShell>
  );
}
