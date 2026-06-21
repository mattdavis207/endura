begin;

alter table public.profiles
    add column training_hq_refreshed_at timestamptz;

alter table public.planned_workouts
    add column title text,
    add column description text,
    add column target_distance_meters numeric(12, 2),
    add column workout_structure jsonb not null default '{}'::jsonb,
    add column raw_ai_plan jsonb not null default '{}'::jsonb;

alter table public.planned_workouts
    add constraint "planned_workouts_target_distance_CK" check (
        target_distance_meters is null or target_distance_meters >= 0
    );

create unique index "planned_workouts_actual_UK"
    on public.planned_workouts (actual_workout_id)
    where actual_workout_id is not null;

commit;
