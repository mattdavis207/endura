import { useOnboardingStore } from "@/state/onboarding";

import type { DistanceUnit, RaceType } from "./types";
import { distanceOptions, raceTypeLabels } from "./types";
import type { OnboardingScreenProps } from "./screenTypes";
import { DecimalPickerField } from "./pickerFields";
import { ChoiceList, OnboardingShell, SegmentedControl } from "./ui";

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
  const selectDistanceUnit = (distanceUnit: DistanceUnit) => {
    if (distanceUnit === draft.distanceUnit) {
      return;
    }

    const factor = distanceUnit === "km" ? 1.609344 : 1 / 1.609344;
    const convert = (value: string) =>
      value ? (Number(value) * factor).toFixed(1) : value;

    updateDraft({
      customBikeDistance: convert(draft.customBikeDistance),
      customRunDistance: convert(draft.customRunDistance),
      customSwimDistance: convert(draft.customSwimDistance),
      distanceUnit,
    });
  };

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
        onChange={(raceDistanceType) =>
          updateDraft({
            customBikeDistance:
              raceDistanceType === "Custom" && !draft.customBikeDistance
                ? "1.0"
                : draft.customBikeDistance,
            customRunDistance:
              raceDistanceType === "Custom" && !draft.customRunDistance
                ? "1.0"
                : draft.customRunDistance,
            customSwimDistance:
              raceDistanceType === "Custom" && !draft.customSwimDistance
                ? "0.1"
                : draft.customSwimDistance,
            raceDistanceType,
          })
        }
        options={options}
        value={draft.raceDistanceType}
      />

      {isCustom ? (
        <>
          <SegmentedControl<DistanceUnit>
            onChange={selectDistanceUnit}
            options={[
              { label: "Kilometers", value: "km" },
              { label: "Miles", value: "mi" },
            ]}
            value={draft.distanceUnit}
          />
          {raceType === "triathlon" || raceType === "custom" ? (
            <>
              <DecimalPickerField
                label="Swim distance"
                max={draft.distanceUnit === "km" ? 50 : 31}
                onChange={(customSwimDistance) =>
                  updateDraft({ customSwimDistance })
                }
                unit={draft.distanceUnit}
                value={draft.customSwimDistance}
              />
              <DecimalPickerField
                label="Bike distance"
                max={draft.distanceUnit === "km" ? 1000 : 620}
                onChange={(customBikeDistance) =>
                  updateDraft({ customBikeDistance })
                }
                unit={draft.distanceUnit}
                value={draft.customBikeDistance}
              />
              <DecimalPickerField
                label="Run distance"
                max={draft.distanceUnit === "km" ? 500 : 310}
                onChange={(customRunDistance) =>
                  updateDraft({ customRunDistance })
                }
                unit={draft.distanceUnit}
                value={draft.customRunDistance}
              />
            </>
          ) : null}
          {raceType === "running" ? (
            <DecimalPickerField
              label="Run distance"
              max={draft.distanceUnit === "km" ? 500 : 310}
              onChange={(customRunDistance) =>
                updateDraft({ customRunDistance })
              }
              unit={draft.distanceUnit}
              value={draft.customRunDistance}
            />
          ) : null}
          {raceType === "cycling" ? (
            <DecimalPickerField
              label="Bike distance"
              max={draft.distanceUnit === "km" ? 1000 : 620}
              onChange={(customBikeDistance) =>
                updateDraft({ customBikeDistance })
              }
              unit={draft.distanceUnit}
              value={draft.customBikeDistance}
            />
          ) : null}
          {raceType === "swimming" ? (
            <DecimalPickerField
              label="Swim distance"
              max={draft.distanceUnit === "km" ? 50 : 31}
              onChange={(customSwimDistance) =>
                updateDraft({ customSwimDistance })
              }
              unit={draft.distanceUnit}
              value={draft.customSwimDistance}
            />
          ) : null}
        </>
      ) : null}
    </OnboardingShell>
  );
}
