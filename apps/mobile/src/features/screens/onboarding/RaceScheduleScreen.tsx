import { Ionicons } from "@expo/vector-icons";
import { addYears, format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Pressable } from "react-native";
import { Calendar } from "react-native-calendars";

import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useOnboardingStore } from "@/state/onboarding";

import type { OnboardingScreenProps } from "./screenTypes";
import { ClockTimePickerField } from "./pickerFields";
import { DropdownField, OnboardingShell } from "./ui";

const popularTimeZones = [
  { label: "Eastern Time (US & Canada)", value: "America/New_York" },
  { label: "Central Time (US & Canada)", value: "America/Chicago" },
  { label: "Mountain Time (US & Canada)", value: "America/Denver" },
  { label: "Arizona", value: "America/Phoenix" },
  { label: "Pacific Time (US & Canada)", value: "America/Los_Angeles" },
  { label: "Alaska", value: "America/Anchorage" },
  { label: "Hawaii", value: "Pacific/Honolulu" },
  { label: "Atlantic Time (Canada)", value: "America/Halifax" },
  { label: "UTC", value: "UTC" },
  { label: "London", value: "Europe/London" },
  { label: "Central European Time", value: "Europe/Paris" },
  { label: "Tokyo", value: "Asia/Tokyo" },
  { label: "Sydney", value: "Australia/Sydney" },
  { label: "Auckland", value: "Pacific/Auckland" },
];

export function RaceScheduleScreen({
  onBack,
  onNext,
  progress,
}: OnboardingScreenProps) {
  const draft = useOnboardingStore((state) => state.draft);
  const updateDraft = useOnboardingStore((state) => state.updateDraft);
  const [isCalendarOpen, setIsCalendarOpen] = useState(!draft.raceDate);
  const today = format(new Date(), "yyyy-MM-dd");
  const maximumDate = format(addYears(new Date(), 50), "yyyy-MM-dd");
  const timeZoneOptions = useMemo(() => {
    if (
      !draft.raceTimezone ||
      popularTimeZones.some(({ value }) => value === draft.raceTimezone)
    ) {
      return popularTimeZones;
    }

    return [
      {
        label: `Device time zone (${draft.raceTimezone})`,
        value: draft.raceTimezone,
      },
      ...popularTimeZones,
    ];
  }, [draft.raceTimezone]);

  useEffect(() => {
    const values: { raceTime?: string; raceTimezone?: string } = {};

    if (!draft.raceTime) {
      values.raceTime = "07:00";
    }

    if (!draft.raceTimezone) {
      values.raceTimezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }

    if (Object.keys(values).length > 0) {
      updateDraft(values);
    }
  }, [draft.raceTime, draft.raceTimezone, updateDraft]);

  return (
    <OnboardingShell
      canContinue={Boolean(draft.raceDate && draft.raceTime)}
      eyebrow={draft.raceTitle || "Race schedule"}
      onBack={onBack}
      onContinue={onNext}
      progress={progress}
      subtitle="These values drive your countdown, training phase, and taper timing."
      title="When is race day?"
    >
      <VStack className="gap-2">
        <Text className="text-sm font-bold text-slate-200">Race date</Text>
        <Pressable
          accessibilityRole="button"
          className="h-14 flex-row items-center justify-between rounded-md border border-slate-700 bg-slate-900 px-4"
          onPress={() => setIsCalendarOpen((current) => !current)}
        >
          <Text
            className={`text-base font-semibold ${
              draft.raceDate ? "text-white" : "text-slate-500"
            }`}
          >
            {draft.raceDate || "Select race date"}
          </Text>
          <Ionicons name="calendar-outline" size={21} color="#60a5fa" />
        </Pressable>
      </VStack>
      {isCalendarOpen ? (
        <Calendar
          current={draft.raceDate || today}
          enableSwipeMonths
          maxDate={maximumDate}
          minDate={today}
          onDayPress={({ dateString }) => {
            updateDraft({ raceDate: dateString });
            setIsCalendarOpen(false);
          }}
          markedDates={
            draft.raceDate
              ? {
                  [draft.raceDate]: {
                    selected: true,
                    selectedColor: "#3b82f6",
                  },
                }
              : undefined
          }
          style={{
            borderColor: "#334155",
            borderRadius: 8,
            borderWidth: 1,
            overflow: "hidden",
          }}
          theme={{
            arrowColor: "#60a5fa",
            calendarBackground: "#0f172a",
            dayTextColor: "#e2e8f0",
            monthTextColor: "#ffffff",
            textDisabledColor: "#475569",
            textMonthFontWeight: "700",
            textSectionTitleColor: "#94a3b8",
            todayTextColor: "#60a5fa",
          }}
        />
      ) : null}
      <ClockTimePickerField
        label="Start time"
        onChange={(raceTime) => updateDraft({ raceTime })}
        value={draft.raceTime}
      />
      <DropdownField
        label="Time zone"
        onChange={(raceTimezone) => updateDraft({ raceTimezone })}
        options={timeZoneOptions}
        value={draft.raceTimezone}
      />
    </OnboardingShell>
  );
}
