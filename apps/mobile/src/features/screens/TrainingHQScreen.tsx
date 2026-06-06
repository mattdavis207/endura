import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { type ComponentProps, useEffect, useState } from "react";

import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import { CoachInput, IconTile, ScreenShell, WorkoutCard } from "./ui";

const RACE_DAY_TIME = new Date("2026-09-19T06:30:00-04:00").getTime();

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
};

type CountdownMode = "days" | "weeks" | "months";
type FontAwesome5IconName = NonNullable<
  ComponentProps<typeof FontAwesome5>["name"]
>;

const countdownModes: Array<{
  icon: FontAwesome5IconName;
  label: string;
  mode: CountdownMode;
}> = [
  { icon: "calendar-day", label: "Days", mode: "days" },
  { icon: "calendar-week", label: "Weeks", mode: "weeks" },
  { icon: "calendar-alt", label: "Months", mode: "months" },
];

// get current distance to race day from now
function getCountdownParts(): CountdownParts {
  const distance = Math.max(RACE_DAY_TIME - Date.now(), 0);
  const totalSeconds = Math.floor(distance / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  return {
    days: totalDays,
    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((distance % (1000 * 60)) / 1000),
    totalDays,
    totalWeeks: totalDays / 7,
    totalMonths: totalDays / 30.4375,
    totalHours,
    totalMinutes,
    totalSeconds,
  };
}

function formatCountdownSummary(
  countdown: CountdownParts,
  mode: CountdownMode,
) {
  if (mode === "months") {
    return `${countdown.totalMonths.toFixed(2)} months`;
  }

  if (mode === "weeks") {
    return `${countdown.totalWeeks.toFixed(1)} weeks`;
  }

  return `${countdown.totalDays} days`;
}

export function TrainingHQScreen() {
  const [countdown, setCountdown] = useState<CountdownParts>(() =>
    getCountdownParts(),
  );
  const [countdownMode, setCountdownMode] = useState<CountdownMode>("days");

  // runs every second to update the countdown
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCountdown(getCountdownParts());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <ScreenShell
      title="Training HQ"
      subtitle="Countdown, today, history, and quick coach input."
    >
      <Card className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Race Countdown
        </Text>
        <Card
          variant="outline"
          className="items-center rounded-md border-0 bg-slate-900 p-4"
        >
          <Text className="text-5xl font-black text-white">
            {formatCountdownSummary(countdown, countdownMode)}
          </Text>
          <Text className="mt-2 text-sm font-semibold text-slate-300">
            {`${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`}
          </Text>
          <Text className="mt-1 text-sm font-semibold uppercase tracking-wide text-blue-300">
            days to Ironman
          </Text>
          <HStack className="mt-5 gap-3">
            {countdownModes.map((item) => {
              const isSelected = item.mode === countdownMode;

              return (
                <VStack key={item.mode} className="items-center gap-1">
                  <Button
                    action="primary"
                    variant="solid"
                    size="md"
                    accessibilityLabel={`Show countdown in ${item.label.toLowerCase()}`}
                    onPress={() => setCountdownMode(item.mode)}
                    className={`h-12 w-12 rounded-full p-0 ${
                      isSelected ? "bg-blue-500" : "bg-slate-700"
                    }`}
                  >
                    <FontAwesome5
                      name={item.icon}
                      size={18}
                      color={isSelected ? "#ffffff" : "#cbd5e1"}
                    />
                  </Button>
                  <Text
                    className={`text-[11px] font-bold ${
                      isSelected ? "text-blue-300" : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </Text>
                </VStack>
              );
            })}
          </HStack>
          <Text className="mt-3 text-center text-xs font-medium text-slate-400">
            {`${countdown.totalHours.toLocaleString()} hours | ${countdown.totalMinutes.toLocaleString()} minutes | ${countdown.totalSeconds.toLocaleString()} seconds`}
          </Text>
        </Card>
      </Card>

      <HStack className="gap-3">
        <IconTile icon="pulse-outline" label="Activity" />
        <IconTile icon="flag-outline" label="Out from race" />
      </HStack>

      <Card className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <HStack className="items-start gap-3">
          <VStack className="w-14 gap-1">
            <Box className="h-24 rounded-sm bg-slate-700" />
            <Box className="-mt-20 ml-3 h-24 rounded-sm bg-slate-600" />
            <Text className="mt-2 text-xs font-bold text-slate-500">
              Past workouts
            </Text>
          </VStack>
          <Box className="flex-1">
            <WorkoutCard detail="Easy run + mobility planned" />
          </Box>
          <VStack className="items-center gap-2 pt-12">
            <Text className="w-14 text-center text-[11px] font-semibold text-slate-500">
              Weekly view
            </Text>
            <Box className="h-12 w-12 items-center justify-center rounded-full bg-slate-900">
              <Ionicons name="arrow-forward" color="#ffffff" size={22} />
            </Box>
          </VStack>
        </HStack>
      </Card>

      <CoachInput placeholder="Ask the coach about tomorrow" />
    </ScreenShell>
  );
}
