export type TrainingHQRaceDistances = {
  swim: number | null;
  bike: number | null;
  run: number | null;
};

export type TrainingHQRace = {
  title: string | null;
  date: string | null;
  startTime: string | null;
  timezone: string | null;
  type: string | null;
  distanceType: string | null;
  distanceUnit: string | null;
  distancesMeters: TrainingHQRaceDistances;
};

export type TrainingHQWorkoutPower = {
  averageWatts: number | null;
  normalizedWatts: number | null;
};

export type TrainingHQWorkoutHeartRate = {
  average: number | null;
  max: number | null;
  timeSeconds: number[] | null;
  bpm: number[] | null;
  stream: {
    originalSize: number | null;
    resolution: string | null;
    seriesType: string | null;
  };
};

export type TrainingHQWorkoutCadence = {
  average: number | null;
};

export type TrainingHQWorkout = {
  id: string | null;
  source: string | null;
  sourceWorkoutId: string | null;
  sportType: string | null;
  name: string | null;
  startedAt: string | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  calories: number | null;
  power: TrainingHQWorkoutPower;
  heartRate: TrainingHQWorkoutHeartRate;
  cadence: TrainingHQWorkoutCadence;
  rawData: Record<string, unknown> | null;
};

export type TrainingHQCardType = "planned_workout" | "actual_workout";

export type TrainingHQDisplayStatus =
  | "completed"
  | "in_progress"
  | "next_workout"
  | "planned"
  | "missed";

export type TrainingHQPlannedWorkoutDetails = {
  trainingPlanId: string | null;
  plannedWorkoutId: string | null;
  plannedDate: string | null;
  plannedDurationSeconds: number | null;
  targetDistanceMeters: number | null;
  targetIntensity: string | null;
  purpose: string | null;
  status: string | null;
};

export type TrainingHQCard = TrainingHQWorkout & {
  cardType: TrainingHQCardType;
  displayStatus: TrainingHQDisplayStatus;
  plannedWorkout: TrainingHQPlannedWorkoutDetails | null;
  actualWorkout: TrainingHQWorkout | null;
};

export type TrainingHQStats = {
  recentWorkoutCount: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  averageHeartRate: number | null;
};

export type TrainingHQRefreshState =
  | "fresh"
  | "refreshing"
  | "stale"
  | "failed";

export type TrainingHQResponse = {
  displayName: string | null;
  race: TrainingHQRace | null;
  cards: TrainingHQCard[];
  stats: TrainingHQStats;
  lastRefreshedAt: string | null;
  refreshState?: TrainingHQRefreshState;
  recentWorkouts?: TrainingHQWorkout[];
};
