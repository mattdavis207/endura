import { useOnboardingStore } from "@/state/onboarding";

import type { RaceType } from "./types";
import { raceTypeLabels } from "./types";
import type { OnboardingScreenProps } from "./screenTypes";
import { ChoiceList, Field, OnboardingShell } from "./ui";

const raceTypes = (Object.entries(raceTypeLabels) as [RaceType, string][]).map(
  ([value, label]) => ({ label, value }),
);

export function RaceIdentityScreen({
  onBack,
  onNext,
  progress,
}: OnboardingScreenProps) {
  const draft = useOnboardingStore((state) => state.draft);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);

  return (
    <OnboardingShell
      canContinue={Boolean(draft.raceTitle.trim() && draft.raceType)}
      eyebrow="Your race"
      onBack={onBack}
      onContinue={onNext}
      progress={progress}
      subtitle="Name the event you’re building toward, then choose its discipline."
      title="What’s on the calendar?"
    >
      <Field
        autoCapitalize="words"
        label="Race name"
        maxLength={100}
        onChangeText={(raceTitle) => updateDraft({ raceTitle })}
        placeholder="Ironman Maryland"
        value={draft.raceTitle}
      />
      <ChoiceList
        onChange={(raceType) =>
          updateDraft({
            raceDistanceType: "",
            raceType,
          })
        }
        options={raceTypes}
        value={draft.raceType}
      />
    </OnboardingShell>
  );
}
