begin;

create domain race_type_dom as text
    check (
        value in (
            'triathlon',
            'running',
            'cycling',
            'swimming',
            'custom'
        )
    );

create domain primary_goal_type_dom as text
    check (
        value in (
            'finish',
            'comfortable',
            'time',
            'competitive',
            'custom'
        )
    );

create domain gender_dom as text
    check (
        value in (
            'woman',
            'man',
            'non_binary',
            'not_specified'
        )
    );

create domain training_experience_dom as text
    check (
        value in (
            'beginner',
            'intermediate',
            'advanced',
            'competitive'
        )
    );

create domain distance_unit_dom as text
    check (value in ('km', 'mi'));

create domain height_unit_dom as text
    check (value in ('cm', 'in'));

create domain weight_unit_dom as text
    check (value in ('kg', 'lb'));

create domain swim_pace_unit_dom as text
    check (value in ('100m', '100yd'));

create domain speed_unit_dom as text
    check (value in ('km/h', 'mph'));

create domain day_of_week_dom as text
    check (
        value in (
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday'
        )
    );

create domain rest_day_dom as text
    check (
        value in (
            'flexible',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday'
        )
    );


alter table public.profiles
    add column age smallint,
    add column gender gender_dom,
    add column phone_number text,
    add column height_cm numeric(5, 2),
    add column height_unit height_unit_dom,
    add column weight_kg numeric(6, 2),
    add column weight_unit weight_unit_dom,
    add column training_experience training_experience_dom,
    add column onboarding_completed_at timestamptz;

alter table public.profiles
    add constraint "profiles_age_CK" check (
        age is null or age between 13 and 120
    ),
    add constraint "profiles_phone_number_CK" check (
        phone_number is null
        or length(trim(phone_number)) between 7 and 30
    ),
    add constraint "profiles_height_cm_CK" check (
        height_cm is null or height_cm between 100 and 250
    ),
    add constraint "profiles_height_unit_CK" check (
        height_cm is null or height_unit is not null
    ),
    add constraint "profiles_weight_kg_CK" check (
        weight_kg is null or weight_kg between 25 and 350
    ),
    add constraint "profiles_weight_unit_CK" check (
        weight_kg is null or weight_unit is not null
    ),
    add constraint "profiles_onboarding_completed_at_CK" check (
        onboarding_completed_at is null
        or onboarding_completed_at >= created_at
    );


alter table public.goals
    add column race_type race_type_dom,
    add column race_start_time time,
    add column race_timezone text,
    add column race_distance_type text,
    add column distance_unit distance_unit_dom,
    add column swim_distance_meters numeric(12, 2),
    add column bike_distance_meters numeric(12, 2),
    add column run_distance_meters numeric(12, 2),
    add column primary_goal_type primary_goal_type_dom,
    add column target_finish_time_seconds integer,
    add column custom_goal_text text,
    add column target_swim_time_seconds integer,
    add column target_swim_pace_unit swim_pace_unit_dom,
    add column target_bike_time_seconds integer,
    add column target_bike_speed_kph numeric(6, 2),
    add column target_bike_speed_unit speed_unit_dom,
    add column target_run_time_seconds integer,
    add column target_run_pace_unit distance_unit_dom;

do $$
begin
    if exists (select 1 from public.goals) then
        raise exception using
            message = 'migration2 requires a goals backfill before applying new NOT NULL onboarding fields',
            hint = 'Backfill race_type, race_start_time, race_timezone, race_distance_type, distance_unit, and primary_goal_type, then remove this guard.';
    end if;
end
$$;

alter table public.goals
    alter column race_type set not null,
    alter column race_start_time set not null,
    alter column race_timezone set not null,
    alter column race_distance_type set not null,
    alter column distance_unit set not null,
    alter column primary_goal_type set not null;

alter table public.goals
    add constraint "goals_race_timezone_CK" check (
        length(trim(race_timezone)) > 0
    ),
    add constraint "goals_race_distance_type_CK" check (
        length(trim(race_distance_type)) > 0
    ),
    add constraint "goals_swim_distance_CK" check (
        swim_distance_meters is null or swim_distance_meters > 0
    ),
    add constraint "goals_bike_distance_CK" check (
        bike_distance_meters is null or bike_distance_meters > 0
    ),
    add constraint "goals_run_distance_CK" check (
        run_distance_meters is null or run_distance_meters > 0
    ),
    add constraint "goals_target_finish_time_CK" check (
        target_finish_time_seconds is null
        or target_finish_time_seconds > 0
    ),
    add constraint "goals_custom_goal_text_CK" check (
        custom_goal_text is null
        or length(trim(custom_goal_text)) between 1 and 240
    ),
    add constraint "goals_primary_goal_details_CK" check (
        (
            primary_goal_type = 'time'
            and target_finish_time_seconds is not null
        )
        or (
            primary_goal_type = 'custom'
            and custom_goal_text is not null
            and length(trim(custom_goal_text)) > 0
        )
        or primary_goal_type not in ('time', 'custom')
    ),
    add constraint "goals_target_swim_time_CK" check (
        target_swim_time_seconds is null
        or target_swim_time_seconds > 0
    ),
    add constraint "goals_target_bike_time_CK" check (
        target_bike_time_seconds is null
        or target_bike_time_seconds > 0
    ),
    add constraint "goals_target_bike_speed_CK" check (
        target_bike_speed_kph is null
        or target_bike_speed_kph > 0
    ),
    add constraint "goals_target_run_time_CK" check (
        target_run_time_seconds is null
        or target_run_time_seconds > 0
    ),
    add constraint "goals_target_swim_pace_unit_CK" check (
        target_swim_pace_seconds_per_100m is null
        or target_swim_pace_unit is not null
    ),
    add constraint "goals_target_bike_speed_unit_CK" check (
        target_bike_speed_kph is null
        or target_bike_speed_unit is not null
    ),
    add constraint "goals_target_run_pace_unit_CK" check (
        target_run_pace_seconds_per_km is null
        or target_run_pace_unit is not null
    );


-- Stores each user's recurring availability, preferred training days, and limitations.
create table public.training_preferences (
    user_id uuid not null,
    current_weekly_training_minutes integer not null,
    preferred_training_days day_of_week_dom[] not null default array[]::day_of_week_dom[],
    preferred_rest_days rest_day_dom[] not null default array[]::rest_day_dom[],
    available_weekday_minutes integer not null,
    available_weekend_minutes integer not null,
    injury_notes text,
    limitations text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint "training_preferences_PK" primary key (user_id),
    constraint "training_preferences_FK" foreign key (user_id)
        references public.profiles (id)
        on delete cascade,
    constraint "training_preferences_weekly_minutes_CK" check (
        current_weekly_training_minutes between 0 and 10080
    ),
    constraint "training_preferences_training_days_CK" check (
        cardinality(preferred_training_days) between 1 and 7
    ),
    constraint "training_preferences_rest_days_CK" check (
        cardinality(preferred_rest_days) <= 7
        and (
            not ('flexible'::rest_day_dom = any(preferred_rest_days))
            or cardinality(preferred_rest_days) = 1
        )
    ),
    constraint "training_preferences_weekday_minutes_CK" check (
        available_weekday_minutes between 0 and 1440
    ),
    constraint "training_preferences_weekend_minutes_CK" check (
        available_weekend_minutes between 0 and 1440
    ),
    constraint "training_preferences_injury_notes_CK" check (
        injury_notes is null
        or length(trim(injury_notes)) between 1 and 500
    ),
    constraint "training_preferences_limitations_CK" check (
        limitations is null
        or length(trim(limitations)) between 1 and 500
    )
);

alter table public.training_preferences enable row level security;

commit;
