import { useOnboardingStore } from "@/state/onboarding";

import type { OnboardingScreenProps } from "./screenTypes";
import { Field, OnboardingShell } from "./ui";

export function SwimTargetsScreen(props: OnboardingScreenProps) {
  const draft = useOnboardingStore((state) => state.draft);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);

  return (
    <OnboardingShell
      {...props}
      eyebrow="Swim targets"
      onContinue={props.onNext}
      onSkip={props.onNext}
      subtitle="Optional targets give the coach a benchmark for pacing and progress."
      title="What would a strong swim look like?"
    >
      <Field
        keyboardType="numbers-and-punctuation"
        label="Target swim time"
        onChangeText={(targetSwimTime) => updateDraft({ targetSwimTime })}
        optional
        placeholder="01:10:00"
        value={draft.targetSwimTime}
      />
      <Field
        keyboardType="numbers-and-punctuation"
        label="Target pace per 100m"
        onChangeText={(targetSwimPace) => updateDraft({ targetSwimPace })}
        optional
        placeholder="1:45"
        value={draft.targetSwimPace}
      />
    </OnboardingShell>
  );
}

export function BikeTargetsScreen(props: OnboardingScreenProps) {
  const draft = useOnboardingStore((state) => state.draft);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);

  return (
    <OnboardingShell
      {...props}
      eyebrow="Bike targets"
      onContinue={props.onNext}
      onSkip={props.onNext}
      subtitle="Use whichever metric you train with. Every field is optional."
      title="Set your bike benchmarks"
    >
      <Field
        keyboardType="numbers-and-punctuation"
        label="Target bike time"
        onChangeText={(targetBikeTime) => updateDraft({ targetBikeTime })}
        optional
        placeholder="05:30:00"
        value={draft.targetBikeTime}
      />
      <Field
        keyboardType="number-pad"
        label="Target average power"
        onChangeText={(targetBikePower) => updateDraft({ targetBikePower })}
        optional
        placeholder="190 watts"
        value={draft.targetBikePower}
      />
      <Field
        keyboardType="decimal-pad"
        label="Target average speed"
        onChangeText={(targetBikeSpeed) => updateDraft({ targetBikeSpeed })}
        optional
        placeholder="32 km/h"
        value={draft.targetBikeSpeed}
      />
    </OnboardingShell>
  );
}

export function RunTargetsScreen(props: OnboardingScreenProps) {
  const draft = useOnboardingStore((state) => state.draft);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);

  return (
    <OnboardingShell
      {...props}
      eyebrow="Run targets"
      onContinue={props.onNext}
      onSkip={props.onNext}
      subtitle="These targets can be adjusted as your fitness and race plan develop."
      title="What pace are you building toward?"
    >
      <Field
        keyboardType="numbers-and-punctuation"
        label="Target run time"
        onChangeText={(targetRunTime) => updateDraft({ targetRunTime })}
        optional
        placeholder="04:15:00"
        value={draft.targetRunTime}
      />
      <Field
        keyboardType="numbers-and-punctuation"
        label="Target pace"
        onChangeText={(targetRunPace) => updateDraft({ targetRunPace })}
        optional
        placeholder="6:02 /km"
        value={draft.targetRunPace}
      />
    </OnboardingShell>
  );
}
