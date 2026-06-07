import { useOnboardingStore } from "@/state/onboarding";

import type { DistanceUnit, RaceType } from "./types";
import { distanceOptions, raceTypeLabels } from "./types";
import type { OnboardingScreenProps } from "./screenTypes";
import { ChoiceList, Field, OnboardingShell, SegmentedControl } from "./ui";

export function RaceDistanceScreen({
  onBack,
  onNext,
  progress,
}: OnboardingScreenProps) {
  const draft = useOnboardingStore((state) => state.draft);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);
  const raceType = (draft.raceType || "custom") as RaceType;
  const isCustom = draft.raceDistanceType === "Custom";
  const options = distanceOptions[raceType].map((label) => ({
    label,
    value: label,
  }));

  const customDistanceComplete =
    raceType === "triathlon" || raceType === "custom"
      ? Boolean(
          draft.customSwimDistance &&
          draft.customBikeDistance &&
          draft.customRunDistance,
        )
      : raceType === "running"
        ? Boolean(draft.customRunDistance)
        : raceType === "cycling"
          ? Boolean(draft.customBikeDistance)
          : Boolean(draft.customSwimDistance);

  return (
    <OnboardingShell
      canContinue={Boolean(
        draft.raceDistanceType && (!isCustom || customDistanceComplete),
      )}
      eyebrow={`${raceTypeLabels[raceType]} distance`}
      onBack={onBack}
      onContinue={onNext}
      progress={progress}
      subtitle="Choose the closest standard distance or enter your own."
      title="How far is the race?"
    >
      <ChoiceList
        onChange={(raceDistanceType) => updateDraft({ raceDistanceType })}
        options={options}
        value={draft.raceDistanceType}
      />

      {isCustom ? (
        <>
          <SegmentedControl<DistanceUnit>
            onChange={(distanceUnit) => updateDraft({ distanceUnit })}
            options={[
              { label: "Kilometers", value: "km" },
              { label: "Miles", value: "mi" },
            ]}
            value={draft.distanceUnit}
          />
          {raceType === "triathlon" || raceType === "custom" ? (
            <>
              <Field
                keyboardType="decimal-pad"
                label={`Swim distance (${draft.distanceUnit})`}
                onChangeText={(customSwimDistance) =>
                  updateDraft({ customSwimDistance })
                }
                placeholder="3.8"
                value={draft.customSwimDistance}
              />
              <Field
                keyboardType="decimal-pad"
                label={`Bike distance (${draft.distanceUnit})`}
                onChangeText={(customBikeDistance) =>
                  updateDraft({ customBikeDistance })
                }
                placeholder="180"
                value={draft.customBikeDistance}
              />
              <Field
                keyboardType="decimal-pad"
                label={`Run distance (${draft.distanceUnit})`}
                onChangeText={(customRunDistance) =>
                  updateDraft({ customRunDistance })
                }
                placeholder="42.2"
                value={draft.customRunDistance}
              />
            </>
          ) : null}
          {raceType === "running" ? (
            <Field
              keyboardType="decimal-pad"
              label={`Run distance (${draft.distanceUnit})`}
              onChangeText={(customRunDistance) =>
                updateDraft({ customRunDistance })
              }
              placeholder="42.2"
              value={draft.customRunDistance}
            />
          ) : null}
          {raceType === "cycling" ? (
            <Field
              keyboardType="decimal-pad"
              label={`Bike distance (${draft.distanceUnit})`}
              onChangeText={(customBikeDistance) =>
                updateDraft({ customBikeDistance })
              }
              placeholder="160"
              value={draft.customBikeDistance}
            />
          ) : null}
          {raceType === "swimming" ? (
            <Field
              keyboardType="decimal-pad"
              label={`Swim distance (${draft.distanceUnit})`}
              onChangeText={(customSwimDistance) =>
                updateDraft({ customSwimDistance })
              }
              placeholder="3.8"
              value={draft.customSwimDistance}
            />
          ) : null}
        </>
      ) : null}
    </OnboardingShell>
  );
}
