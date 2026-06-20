import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import {
  type ComponentProps,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  useWindowDimensions,
} from "react-native";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { apiGet, apiPost } from "@/lib/api/client";
import type {
  TrainingHQResponse,
  TrainingHQWorkout,
} from "@/lib/schemas/schemas";

import { SportIcon } from "./trainingHqSportIcons";
import { CoachInput } from "./ui";
import React from "react";

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

type WorkoutDay = {
  dateKey: string;
  date: Date;
  workouts: TrainingHQWorkout[];
};

const countdownModes: {
  icon: FontAwesome5IconName;
  label: string;
  mode: CountdownMode;
}[] = [
  { icon: "calendar-day", label: "Days", mode: "days" },
  { icon: "calendar-week", label: "Weeks", mode: "weeks" },
  { icon: "calendar-alt", label: "Months", mode: "months" },
];

// get current distance to race day from now
function getCountdownParts(raceDayTime: number | null): CountdownParts {
  const distance = raceDayTime ? Math.max(raceDayTime - Date.now(), 0) : 0;
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

function getRaceTitle(trainingHQ: TrainingHQResponse | null): string {
  return trainingHQ?.race?.title ?? "race day";
}

function getDisplayName(trainingHQ: TrainingHQResponse | null): string {
  return trainingHQ?.displayName ?? "athlete";
}

function parseWorkoutDate(workout: TrainingHQWorkout): Date | null {
  if (!workout.startedAt) {
    return null;
  }

  const date = new Date(workout.startedAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

function groupWorkoutsByDay(workouts: TrainingHQWorkout[]): WorkoutDay[] {
  const groups = new Map<string, WorkoutDay>();

  workouts.forEach((workout) => {
    const date = parseWorkoutDate(workout);

    if (!date) {
      return;
    }

    const dateKey = date.toISOString().slice(0, 10);
    const existingGroup = groups.get(dateKey);

    if (existingGroup) {
      existingGroup.workouts.push(workout);
      return;
    }

    groups.set(dateKey, {
      date,
      dateKey,
      workouts: [workout],
    });
  });

  return Array.from(groups.values()).sort(
    (first, second) => first.date.getTime() - second.date.getTime(),
  );
}

function formatWorkoutDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatWorkoutTime(workout: TrainingHQWorkout): string {
  const date = parseWorkoutDate(workout);

  if (!date) {
    return "Time unavailable";
  }

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(totalSeconds: number | null): string {
  if (!totalSeconds) {
    return "--";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatDistance(distanceMeters: number | null): string {
  if (!distanceMeters) {
    return "--";
  }

  const miles = distanceMeters / 1609.344;
  return `${miles.toFixed(2)} mi`;
}

function formatPaceOrSpeed(
  sportType: string | null,
  durationSeconds: number | null,
  distanceMeters: number | null,
): string {
  if (!durationSeconds || !distanceMeters) {
    return "--";
  }

  const sport = sportType?.toLowerCase() ?? "";

  if (sport.includes("ride") || sport.includes("bike") || sport.includes("cycling")) {
    const hours = durationSeconds / 3600;
    const miles = distanceMeters / 1609.344;
    return `${(miles / hours).toFixed(1)} mph`;
  }

  if (sport.includes("swim")) {
    const secondsPer100Meters = durationSeconds / (distanceMeters / 100);
    const minutes = Math.floor(secondsPer100Meters / 60);
    const seconds = Math.round(secondsPer100Meters % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${seconds} /100m`;
  }

  const secondsPerMile = durationSeconds / (distanceMeters / 1609.344);
  const minutes = Math.floor(secondsPerMile / 60);
  const seconds = Math.round(secondsPerMile % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds} /mi`;
}

function formatNumber(value: number | null | undefined, suffix = ""): string {
  if (value === null || value === undefined) {
    return "--";
  }

  return `${Math.round(value).toLocaleString()}${suffix}`;
}

function getCurrentDaySportType(workoutDays: WorkoutDay[]): string | null {
  const todayKey = new Date().toISOString().slice(0, 10);
  const currentDay = workoutDays.find((day) => day.dateKey === todayKey);
  const fallbackDay = workoutDays[0];
  const workout = currentDay?.workouts[0] ?? fallbackDay?.workouts[0];

  return workout?.sportType ?? null;
}

function getWorkoutDayTotals(day: WorkoutDay) {
  const totalDurationSeconds = day.workouts.reduce(
    (total, workout) => total + (workout.durationSeconds ?? 0),
    0,
  );
  const totalDistanceMeters = day.workouts.reduce(
    (total, workout) => total + (workout.distanceMeters ?? 0),
    0,
  );
  const totalCalories = day.workouts.reduce(
    (total, workout) => total + (workout.calories ?? 0),
    0,
  );
  const heartRates = day.workouts
    .map((workout) => workout.heartRate.average)
    .filter((heartRate): heartRate is number => heartRate !== null);

  return {
    totalDurationSeconds,
    totalDistanceMeters,
    totalCalories: totalCalories > 0 ? totalCalories : null,
    averageHeartRate: heartRates.length
      ? heartRates.reduce((total, heartRate) => total + heartRate, 0) /
        heartRates.length
      : null,
  };
}

function WorkoutMetricRow({ workout }: { workout: TrainingHQWorkout }) {
  return (
    <VStack className="gap-2 rounded-2xl bg-slate-950 p-3">
      <HStack className="items-center justify-between">
        <HStack className="flex-1 items-center gap-2 pr-2">
          <SportIcon sportType={workout.sportType} size={18} color="#93c5fd" />
          <VStack className="flex-1">
            <Text
              className="text-sm font-black text-white"
              numberOfLines={1}
            >
              {workout.name ?? workout.sportType ?? "Workout"}
            </Text>
            <Text className="text-xs font-semibold text-slate-500">
              {formatWorkoutTime(workout)}
            </Text>
          </VStack>
        </HStack>
      </HStack>

      <HStack className="justify-between">
        <VStack>
          <Text className="text-[10px] font-bold uppercase text-slate-500">
            Distance
          </Text>
          <Text className="text-sm font-black text-white">
            {formatDistance(workout.distanceMeters)}
          </Text>
        </VStack>
        <VStack>
          <Text className="text-[10px] font-bold uppercase text-slate-500">
            Pace
          </Text>
          <Text className="text-sm font-black text-white">
            {formatPaceOrSpeed(
              workout.sportType,
              workout.durationSeconds,
              workout.distanceMeters,
            )}
          </Text>
        </VStack>
        <VStack>
          <Text className="text-[10px] font-bold uppercase text-slate-500">
            Avg HR
          </Text>
          <Text className="text-sm font-black text-white">
            {formatNumber(workout.heartRate.average)}
          </Text>
        </VStack>
      </HStack>
    </VStack>
  );
}

function WorkoutDayCard({
  day,
}: {
  day: WorkoutDay;
}) {
  const primaryWorkout = day.workouts[0];
  const totals = getWorkoutDayTotals(day);
  const workoutCount = day.workouts.length;
  const hasMultipleWorkouts = workoutCount > 1;

  return (
    <VStack className="gap-3">
      <HStack className="items-center justify-between px-1">
        <Text className="text-sm font-bold uppercase tracking-wide text-slate-400">
          {formatWorkoutDate(day.date)}
        </Text>
        <HStack className="items-center gap-1 rounded-full bg-emerald-500 px-2 py-1">
          <Ionicons name="checkmark" size={13} color="#ffffff" />
          <Text className="text-[11px] font-black uppercase text-white">
            Complete
          </Text>
        </HStack>
      </HStack>

      <Card
        variant="outline"
        className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900"
      >
        <Box className="bg-slate-800 px-5 py-4">
          <HStack className="items-center justify-between">
            <HStack className="items-center gap-2">
              {day.workouts.slice(0, 2).map((workout, index) => (
                <Box
                  key={`${day.dateKey}-icon-${workout.id ?? workout.sourceWorkoutId ?? index}`}
                  className="h-12 w-12 items-center justify-center rounded-full bg-blue-500/20"
                >
                  <SportIcon
                    sportType={workout.sportType}
                    size={24}
                    color="#93c5fd"
                  />
                </Box>
              ))}
              {workoutCount > 2 ? (
                <Box className="h-12 w-12 items-center justify-center rounded-full bg-slate-700">
                  <Text className="text-sm font-black text-blue-200">
                    +{workoutCount - 2}
                  </Text>
                </Box>
              ) : null}
            </HStack>

            <Button
              size="sm"
              variant="solid"
              action="primary"
              className="rounded-full bg-blue-500 px-4"
            >
              <ButtonText className="text-xs font-black text-white">
                View stats
              </ButtonText>
            </Button>
          </HStack>

          <HStack className="mt-5 justify-between">
            <VStack>
              <Text className="text-[11px] font-bold uppercase text-slate-400">
                Time
              </Text>
              <Text className="mt-1 text-lg font-black text-white">
                {formatDuration(totals.totalDurationSeconds)}
              </Text>
            </VStack>
            <VStack>
              <Text className="text-[11px] font-bold uppercase text-slate-400">
                Distance
              </Text>
              <Text className="mt-1 text-lg font-black text-white">
                {formatDistance(totals.totalDistanceMeters)}
              </Text>
            </VStack>
            <VStack>
              <Text className="text-[11px] font-bold uppercase text-slate-400">
                Calories
              </Text>
              <Text className="mt-1 text-lg font-black text-white">
                {formatNumber(totals.totalCalories)}
              </Text>
            </VStack>
          </HStack>
        </Box>

        <VStack className="gap-4 px-5 py-5">
          {hasMultipleWorkouts ? (
            <VStack className="gap-2">
              {day.workouts.map((workout, index) => (
                <WorkoutMetricRow
                  key={`${day.dateKey}-workout-${workout.id ?? workout.sourceWorkoutId ?? index}`}
                  workout={workout}
                />
              ))}
            </VStack>
          ) : (
            <>
              <HStack className="items-start justify-between">
                <VStack className="flex-1 pr-3">
                  <Text className="text-xs font-bold uppercase tracking-wide text-blue-300">
                    {primaryWorkout.sportType ?? "Workout"}
                  </Text>
                  <Text className="mt-1 text-2xl font-black text-white">
                    {primaryWorkout.name ?? "Completed workout"}
                  </Text>
                  <Text className="mt-2 text-sm font-semibold text-slate-400">
                    Completed at {formatWorkoutTime(primaryWorkout)}
                  </Text>
                </VStack>

                <VStack className="items-end">
                  <Text className="text-[11px] font-bold uppercase text-slate-500">
                    Distance
                  </Text>
                  <Text className="text-xl font-black text-white">
                    {formatDistance(totals.totalDistanceMeters)}
                  </Text>
                </VStack>
              </HStack>

              <HStack className="items-end justify-between">
                <VStack className="gap-3">
                  <HStack className="items-center gap-3">
                    <Ionicons name="heart" size={22} color="#ef4444" />
                    <Text className="text-3xl font-black text-white">
                      {formatNumber(totals.averageHeartRate)}
                    </Text>
                    <Text className="text-xs font-bold uppercase text-slate-500">
                      avg hr
                    </Text>
                  </HStack>
                  <HStack className="items-center gap-3">
                    <Ionicons
                      name="speedometer-outline"
                      size={22}
                      color="#60a5fa"
                    />
                    <Text className="text-3xl font-black text-white">
                      {formatPaceOrSpeed(
                        primaryWorkout.sportType,
                        totals.totalDurationSeconds,
                        totals.totalDistanceMeters,
                      )}
                    </Text>
                  </HStack>
                </VStack>

                <VStack className="w-28 gap-2">
                  <Box className="h-1 rounded-full bg-blue-500" />
                  <Box className="h-1 rounded-full bg-blue-400" />
                  <Box className="h-1 rounded-full bg-slate-600" />
                </VStack>
              </HStack>
            </>
          )}
        </VStack>
      </Card>
    </VStack>
  );
}

export function TrainingHQScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const workoutScrollRef = useRef<ScrollView>(null);
  const [countdown, setCountdown] = useState<CountdownParts>(() =>
    getCountdownParts(null),
  );
  const [countdownMode, setCountdownMode] = useState<CountdownMode>("days");
  const [activeWorkoutIndex, setActiveWorkoutIndex] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [syncError, setSyncError] = useState<string>();
  const [loadError, setLoadError] = useState<string>();

  const [trainingHQ, setTrainingHQ] = useState<TrainingHQResponse | null>(null);
  const workoutDays = useMemo(
    () => groupWorkoutsByDay(trainingHQ?.recentWorkouts ?? []),
    [trainingHQ],
  );
  const latestWorkoutIndex = Math.max(workoutDays.length - 1, 0);
  const workoutSlideWidth = Math.max(windowWidth - 32, 300);
  const workoutSlideGutter = 14;
  const workoutArrowTop = 210;
  const workoutArrowEdgeOffset = -8;
  const workoutRightArrowOffset = workoutSlideWidth - 32;
  const raceDayTime = trainingHQ?.race?.date
    ? new Date(
        `${trainingHQ.race.date}T${trainingHQ.race.startTime ?? "00:00:00"}`,
      ).getTime()
    : null;

  // runs every second to update the countdown
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCountdown(getCountdownParts(raceDayTime));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [raceDayTime]);

  async function loadTrainingHQ() {
    setIsLoading(true);
    setSyncError(undefined);
    setLoadError(undefined);

    // first sync strava workouts
    try {
      await apiPost<TrainingHQResponse>("/integrations/strava/sync", {});
    } catch (error) {
      console.error("Strava sync failed:", error);
      setSyncError("Could not refresh Strava workouts.");
    }

    // then pull data for training HQ
    try {
      const data = await apiGet<TrainingHQResponse>("/training-hq");
      setTrainingHQ(data);
    } catch {
      setLoadError("Could not load Training HQ.");
    } finally {
      setIsLoading(false);
    }
  }
  // call sync and training-hq endpoints sequentially
  useEffect(() => {
    void loadTrainingHQ();
  }, []);

  useEffect(() => {
    setActiveWorkoutIndex(latestWorkoutIndex);
    workoutScrollRef.current?.scrollTo({
      x: latestWorkoutIndex * workoutSlideWidth,
      animated: false,
    });
  }, [latestWorkoutIndex, workoutDays.length, workoutSlideWidth]);

  function scrollToWorkoutDay(index: number) {
    const nextIndex = Math.min(Math.max(index, 0), workoutDays.length - 1);

    setActiveWorkoutIndex(nextIndex);
    workoutScrollRef.current?.scrollTo({
      x: nextIndex * workoutSlideWidth,
      animated: true,
    });
  }

  function showNewerWorkoutDay() {
    scrollToWorkoutDay(activeWorkoutIndex + 1);
  }

  function showOlderWorkoutDay() {
    scrollToWorkoutDay(activeWorkoutIndex - 1);
  }

  function handleWorkoutScrollEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / workoutSlideWidth,
    );

    setActiveWorkoutIndex(
      Math.min(Math.max(nextIndex, 0), workoutDays.length - 1),
    );
  }

  return (
    <Box className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-4 pb-6 pt-14"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-4xl font-black text-white">
          Welcome {getDisplayName(trainingHQ)}
        </Text>

        <VStack className="gap-3">
          <Card className="rounded-3xl border-0 bg-slate-900 p-4">
            <HStack className="items-center justify-between">
              <VStack>
                <Text className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Race Countdown
                </Text>
                <Text className="mt-1 text-4xl font-black text-white">
                  {formatCountdownSummary(countdown, countdownMode)}
                </Text>
              </VStack>
              <Text className="text-right text-xs font-semibold text-slate-400">
                {`${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`}
              </Text>
            </HStack>

            <HStack className="mt-4 gap-2">
              {countdownModes.map((item) => {
                const isSelected = item.mode === countdownMode;

                return (
                  <Button
                    key={item.mode}
                    action="primary"
                    variant="solid"
                    size="sm"
                    accessibilityLabel={`Show countdown in ${item.label.toLowerCase()}`}
                    onPress={() => setCountdownMode(item.mode)}
                    className={`h-9 flex-1 rounded-full p-0 ${
                      isSelected ? "bg-blue-500" : "bg-slate-800"
                    }`}
                  >
                    <HStack className="items-center gap-2">
                      <FontAwesome5
                        name={item.icon}
                        size={13}
                        color={isSelected ? "#ffffff" : "#94a3b8"}
                      />
                      <ButtonText
                        className={`text-xs font-black ${
                          isSelected ? "text-white" : "text-slate-400"
                        }`}
                      >
                        {item.label}
                      </ButtonText>
                    </HStack>
                  </Button>
                );
              })}
            </HStack>
          </Card>

          <HStack className="gap-3">
            <Card className="w-24 items-center justify-center rounded-3xl border-0 bg-slate-900 p-4">
              <Box className="h-14 w-14 items-center justify-center rounded-full bg-blue-500/20">
                <SportIcon
                  sportType={getCurrentDaySportType(workoutDays)}
                  size={28}
                  color="#93c5fd"
                />
              </Box>
              <Text className="mt-2 text-center text-xs font-bold uppercase text-slate-400">
                Today
              </Text>
            </Card>

            <Card className="flex-1 justify-center rounded-3xl border-0 bg-slate-900 p-4">
              <Text className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Out from
              </Text>
              <Text className="mt-1 text-2xl font-black text-white">
                {getRaceTitle(trainingHQ)}
              </Text>
            </Card>
          </HStack>
        </VStack>

        {syncError || loadError ? (
          <VStack className="gap-1 rounded-2xl bg-red-950/60 p-3">
            {syncError ? (
              <Text className="text-sm font-semibold text-red-200">
                {syncError}
              </Text>
            ) : null}
            {loadError ? (
              <Text className="text-sm font-semibold text-red-200">
                {loadError}
              </Text>
            ) : null}
          </VStack>
        ) : null}

        {workoutDays.length > 0 ? (
          <Box className="relative">
            <Box
              className="absolute z-10"
              style={{
                left: workoutArrowEdgeOffset,
                top: workoutArrowTop,
              }}
            >
              <Button
                size="sm"
                variant="solid"
                action="secondary"
                onPress={showOlderWorkoutDay}
                className={`h-10 w-10 rounded-full bg-slate-800/90 p-0 ${
                  activeWorkoutIndex === 0 ? "opacity-40" : "opacity-100"
                }`}
              >
                <Ionicons name="chevron-back" size={22} color="#ffffff" />
              </Button>
            </Box>
            <Box
              className="absolute z-10"
              style={{
                left: workoutRightArrowOffset,
                top: workoutArrowTop,
              }}
            >
              <Button
                size="sm"
                variant="solid"
                action="secondary"
                onPress={showNewerWorkoutDay}
                className={`h-10 w-10 rounded-full bg-slate-800/90 p-0 ${
                  activeWorkoutIndex >= workoutDays.length - 1
                    ? "opacity-40"
                    : "opacity-100"
                }`}
              >
                <Ionicons name="chevron-forward" size={22} color="#ffffff" />
              </Button>
            </Box>

            <ScrollView
              ref={workoutScrollRef}
              horizontal
              bounces={false}
              decelerationRate="fast"
              disableIntervalMomentum
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleWorkoutScrollEnd}
              snapToAlignment="center"
              snapToInterval={workoutSlideWidth}
              scrollEventThrottle={16}
            >
              {workoutDays.map((day) => (
                <Box
                  key={day.dateKey}
                  style={{
                    paddingHorizontal: workoutSlideGutter,
                    width: workoutSlideWidth,
                  }}
                >
                  <WorkoutDayCard day={day} />
                </Box>
              ))}
            </ScrollView>
          </Box>
        ) : (
          <Card className="items-center rounded-3xl border-0 bg-slate-900 p-6">
            <Ionicons name="calendar-clear-outline" size={32} color="#93c5fd" />
            <Text className="mt-3 text-center text-lg font-black text-white">
              {isLoading ? "Loading workouts..." : "No workouts yet"}
            </Text>
            <Text className="mt-1 text-center text-sm font-semibold text-slate-400">
              Completed workouts will appear here after sync.
            </Text>
          </Card>
        )}

        <CoachInput placeholder="Ask the coach about tomorrow" />
      </ScrollView>
    </Box>
  );
}
