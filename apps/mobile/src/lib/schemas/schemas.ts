export type TrainingHQRace = {
  title: string | null;
  date: string | null;
  startTime: string | null;
  timezone: string | null;
  type: string | null;
  distanceType: string | null;
  distanceUnit: string | null;
  distancesMeters: {
    swim: number | null;
    bike: number | null;
    run: number | null;
  };
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
  power: {
    averageWatts: number | null;
    normalizedWatts: number | null;
  };
  heartRate: {
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
  cadence: {
    average: number | null;
  };
  rawData: Record<string, unknown> | null;
};

export type TrainingHQStats = {
  recentWorkoutCount: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  averageHeartRate: number | null;
};

export type TrainingHQResponse = {
  displayName: string | null;
  race: TrainingHQRace | null;
  recentWorkouts: TrainingHQWorkout[];
  stats: TrainingHQStats;
};
