# Training HQ Flow

This document is the working reference for the Training HQ app flow.

The core idea: Training HQ should show the user's planned workout first, then attach completion data from synced Strava workouts when a planned workout has been completed.

## User Experience

On app load, the user should quickly see the latest Training HQ state stored in the database.

The primary workout card should be chosen in this order:

1. Today's planned workout, if one exists.
2. The next upcoming planned workout, if today has no planned workout.
3. Recent completed/past workouts as supporting history.

Card behavior:

- A completed planned workout shows as complete with the matched Strava workout attached.
- An unmatched workout for today shows as in progress.
- An unmatched future workout shows as next workout or planned.
- An unmatched past workout shows as missed or skipped later, depending on product rules.
- The user can scroll left to previous workouts.
- The user can scroll right once to the next planned workout.
- Scrolling farther into the future should eventually open the calendar tab view.

## Endpoint Shape

Use two Training HQ endpoints.

### `GET /training-hq`

Fast read-only endpoint.

Responsibilities:

- Read current dashboard state from the database.
- Return planned workout cards, matched actual workouts, race info, profile info, and stats.
- Do not call Strava.
- Do not create, update, or reconcile rows.

This endpoint is safe to call on app load.

### `POST /training-hq/refresh`

Explicit mutation endpoint.

Responsibilities:

- Sync recent Strava activities.
- Save or upsert completed workouts.
- Create missing workout summaries.
- Ensure the current training plan exists.
- Ensure planned workouts exist for the current plan window.
- Reconcile completed workouts against planned workouts.
- Return the same response shape as `GET /training-hq`.

This endpoint can run on pull-to-refresh, background refresh, or after initial load.

Do not make `GET /training-hq` call `POST /training-hq/refresh` internally. Keep reads and mutations separate.

## Frontend Loading Flow

Preferred flow:

```ts
const cachedDashboard = await apiGet<TrainingHQResponse>("/training-hq");
setTrainingHQ(cachedDashboard);

const refreshedDashboard = await apiPost<TrainingHQResponse>(
  "/training-hq/refresh",
  {},
);
setTrainingHQ(refreshedDashboard);
```

Why:

- The user sees the last known state quickly.
- Strava latency or failure does not block the screen.
- The UI can show a refreshing indicator while fresh data is being fetched.

Useful response fields:

```ts
type TrainingHQRefreshState = "fresh" | "refreshing" | "stale" | "failed";

type TrainingHQResponse = {
  displayName: string | null;
  race: TrainingHQRace | null;
  cards: TrainingHQCard[];
  stats: TrainingHQStats;
  lastRefreshedAt: string | null;
  refreshState?: TrainingHQRefreshState;
};
```

## Service Organization

Keep endpoints thin. Services should own the work.

Recommended files:

```txt
apps/api/app/api/training_hq.py
  GET /training-hq
  POST /training-hq/refresh

apps/api/app/services/training_hq_service.py
  get_dashboard(user_id)
  refresh_dashboard(user_id)
  build_training_hq_response(...)

apps/api/app/services/training_plan_service.py
  get_current_week_plan(user_id)
  ensure_current_week_plan(user_id)
  ensure_planned_workouts(user_id, training_plan_id)
  get_training_hq_cards(user_id)
  match_completed_workouts_to_planned_workouts(user_id)

apps/api/app/services/workout_service.py
  save_workouts(user_id, workouts)
  get_recent_workouts(user_id)
  get_workouts_for_date_range(user_id, start_date, end_date)

apps/api/app/services/workout_summary_service.py
  create_missing_summaries(user_id)

apps/api/app/integrations/strava/strava_client.py
  Strava API calls only
```

## Database Responsibilities

### `workouts`

Actual completed workouts imported from Strava or created manually.

Used for:

- Recent history.
- Matching completion against planned workouts.
- Generating summaries.
- Feeding future AI plan generation.

### `workout_summaries`

AI-readable summaries of completed workouts.

Used for:

- Feeding plan generation.
- Capturing fatigue indicators and performance notes.
- Later vector search or context retrieval.

Do not use this table as the source of truth for completion. Completion comes from `workouts`.

### `training_plans`

Weekly training plan header.

One row per user, goal, and week start.

Used for:

- Grouping generated planned workouts.
- Tracking the generated weekly plan summary.
- Avoiding duplicate plan generation for the same week.

### `planned_workouts`

The target output of the planning flow.

One row per prescribed workout.

Used for:

- Training HQ cards.
- Calendar view.
- Matching planned workouts to actual workouts.
- Storing status and the linked `actual_workout_id`.

## Planned Workout Matching

After Strava sync, match completed workouts to planned workouts.

Minimum matching rules:

1. Same user.
2. Same local date as `planned_date`.
3. Compatible sport type.
4. Actual workout is not already linked to another planned workout.
5. Duration is close enough to the planned duration.

Start simple:

```txt
complete if:
- actual local date = planned_date
- normalized actual sport = normalized planned sport
- actual duration is between 50% and 150% of planned duration
```

Then update:

```txt
planned_workouts.actual_workout_id = workouts.id
planned_workouts.status = 'completed'
```

Sport normalization examples:

```txt
run: run, running, trailrun
bike: bike, ride, cycling, virtualride, gravelride, mountainbikeride
swim: swim, swimming
strength: strength, weighttraining, workout, crossfit
mobility: yoga, pilates, mobility
```

If multiple actual workouts could match the same planned workout, choose the highest score.

Suggested scoring:

```txt
+50 same normalized sport
+30 same date
+20 duration closest to planned duration
+10 distance closest to target distance, once target distance exists
```

## Display Status

Do not necessarily store every UI state in the database.

Durable DB statuses should stay simple:

```txt
planned
completed
skipped
modified
failed
```

Computed UI statuses can be returned by the API:

```txt
completed
in_progress
next_workout
planned
missed
```

Example:

```py
if planned_workout["actual_workout_id"]:
    display_status = "completed"
elif planned_date == today:
    display_status = "in_progress"
elif planned_date > today:
    display_status = "next_workout"
else:
    display_status = "missed"
```

## Suggested Response Shape

Training HQ should return cards already shaped for the frontend.

```ts
type TrainingHQCard = {
  id: string;
  date: string;
  kind: "planned_workout";
  displayStatus:
    | "completed"
    | "in_progress"
    | "next_workout"
    | "planned"
    | "missed";
  plannedWorkout: TrainingHQPlannedWorkout;
  actualWorkout: TrainingHQWorkout | null;
};
```

Planned workout:

```ts
type TrainingHQPlannedWorkout = {
  id: string;
  trainingPlanId: string;
  plannedDate: string;
  sportType: string;
  title: string | null;
  description: string | null;
  plannedDurationSeconds: number;
  targetDistanceMeters: number | null;
  targetIntensity: string | null;
  purpose: string;
  status: string;
};
```

For now, `actualWorkout` can reuse the completed workout shape already used by `recentWorkouts`.

## AI Plan Generation

The AI should generate rows for `planned_workouts`, grouped under a `training_plans` row.

Minimum AI output per workout:

```json
{
  "planned_date": "2026-06-18",
  "sport_type": "run",
  "planned_duration_seconds": 2700,
  "target_intensity": "easy z2",
  "purpose": "Aerobic base run with relaxed pacing"
}
```

Recommended future columns for `planned_workouts`:

```sql
alter table public.planned_workouts
add column title text,
add column description text,
add column target_distance_meters numeric(12, 2),
add column workout_structure jsonb not null default '{}'::jsonb,
add column raw_ai_plan jsonb not null default '{}'::jsonb;
```

## Implementation Order

Build this in small steps.

1. Add `TrainingPlanService`.
2. Implement `get_current_week_plan`.
3. Implement `get_training_hq_cards` from existing `planned_workouts`.
4. Temporarily seed or manually insert planned workouts.
5. Change `GET /training-hq` to return `cards`.
6. Update the mobile schema and Training HQ screen to render `cards`.
7. Implement `POST /training-hq/refresh`.
8. Move Strava sync/save orchestration into `refresh_dashboard`.
9. Implement planned workout matching.
10. Add workout summary generation.
11. Add AI weekly plan generation.

Do not start with AI generation. First make planned workout cards and matching work with seeded data. Then replace the seed/stub with AI-generated rows.

