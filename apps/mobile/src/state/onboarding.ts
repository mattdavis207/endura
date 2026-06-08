import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
  OnboardingDraft,
  OnboardingStep,
} from "@/features/screens/onboarding/types";

const initialDraft: OnboardingDraft = {
  firstName: "",
  email: "",
  raceTitle: "",
  raceType: "",
  raceDate: "",
  raceTime: "",
  raceTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  raceDistanceType: "",
  distanceUnit: "mi",
  customSwimDistance: "",
  customBikeDistance: "",
  customRunDistance: "",
  primaryGoalType: "",
  targetFinishTime: "",
  customGoalText: "",
  targetSwimTime: "",
  targetSwimPace: "",
  targetBikeTime: "",
  targetBikePower: "",
  targetBikeSpeed: "",
  targetRunTime: "",
  targetRunPace: "",
  age: "30",
  gender: "",
  phoneNumber: "",
  heightCm: 175,
  heightUnit: "cm",
  weightKg: 75,
  weightUnit: "kg",
  trainingExperience: "",
  currentWeeklyTrainingHours: 8,
  preferredTrainingDays: [],
  restDayPreferences: [],
  availableHoursWeekday: 1,
  availableHoursWeekend: 4,
  injuryNotes: "",
  limitations: "",
  stravaConnected: false,
};

type OnboardingState = {
  draft: OnboardingDraft;
  step: OnboardingStep;
  reset: () => void;
  setStep: (step: OnboardingStep) => void;
  toggleRestDay: (day: string) => void;
  toggleTrainingDay: (day: string) => void;
  updateDraft: (values: Partial<OnboardingDraft>) => void;
};

// callback function for updating onboarding draft using zustand persist and set
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      draft: initialDraft,
      // changes as the user goes through onboarding
      step: "welcome",
      reset: () => set({ draft: initialDraft, step: "welcome" }),
      setStep: (step) => set({ step }),
      toggleRestDay: (day) =>
        set((state) => {
          const currentDays = state.draft.restDayPreferences;
          const restDayPreferences =
            day === "flexible"
              ? currentDays.includes("flexible")
                ? []
                : ["flexible"]
              : currentDays.includes(day)
                ? currentDays.filter((currentDay) => currentDay !== day)
                : [
                    ...currentDays.filter(
                      (currentDay) => currentDay !== "flexible",
                    ),
                    day,
                  ];

          return {
            draft: {
              ...state.draft,
              restDayPreferences,
            },
          };
        }),
      // update the list of preferred training days based on if the selected day is not already in the list
      toggleTrainingDay: (day) =>
        set((state) => ({
          draft: {
            ...state.draft,
            preferredTrainingDays: state.draft.preferredTrainingDays.includes(
              day,
            )
              ? state.draft.preferredTrainingDays.filter(
                  (currentDay) => currentDay !== day,
                )
              : [...state.draft.preferredTrainingDays, day],
          },
        })),
      // takes in new values and updates their states
      updateDraft: (values) =>
        set((state) => ({
          draft: {
            ...state.draft,
            ...values,
          },
        })),
    }),
    {
      name: "endura-onboarding-draft",
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as {
          draft?: Partial<OnboardingDraft> & {
            restDayPreference?: string;
          };
          step?: OnboardingStep;
        };
        const legacyRestDay = state.draft?.restDayPreference;

        return {
          ...state,
          draft: {
            ...initialDraft,
            ...state.draft,
            heightUnit: state.draft?.heightUnit ?? "cm",
            weightUnit: state.draft?.weightUnit ?? "kg",
            restDayPreferences:
              state.draft?.restDayPreferences ??
              (legacyRestDay ? [legacyRestDay] : []),
          },
        };
      },
      // custom JSON storage for the onboarding draft
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
