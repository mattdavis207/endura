create extension if not exists vector with schema extensions;

create domain provider_dom as text
    check (value in ('strava'));

create domain source_dom as text
    check (value in ('strava', 'garmin', 'manual'));

create domain sport_type_dom as text
    check (
        value in (
            'swim',
            'bike',
            'run',
            'strength',
            'mobility',
            'brick',
            'other'
        )
    );

create domain status_dom as text
    check (
        value in (
            'planned',
            'completed',
            'skipped',
            'modified',
            'failed'
        )
    );

create domain recommendation_type_dom as text
    check (
        value in (
            'daily_adjustment',
            'weekly_plan',
            'general_question'
        )
    );

create domain rating_dom as smallint
    check (value between 1 and 5);

create domain score_dom as smallint
    check (value between 1 and 10);


-- Stores public application profile data for each Supabase Auth user.
create table public.profiles (
    id uuid not null,
    display_name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint "profiles_PK" primary key (id),
    constraint "profiles_FK" foreign key (id)
        references auth.users (id)
        on delete cascade,
    constraint "profiles_display_name_CK" check (
        display_name is null or length(trim(display_name)) > 0
    )
);


-- Stores short-lived, single-use OAuth state values associated with a user.
create table public.oauth_states (
    state text not null,
    user_id uuid not null,
    provider provider_dom not null,
    expires_at timestamptz not null,
    consumed_at timestamptz,
    created_at timestamptz not null default now(),

    constraint "oauth_states_PK" primary key (state),
    constraint "oauth_states_FK" foreign key (user_id)
        references public.profiles (id)
        on delete cascade,
    constraint "oauth_states_expiration_CK" check (expires_at > created_at),
    constraint "oauth_states_consumed_at_CK" check (
        consumed_at is null or consumed_at >= created_at
    )
);


-- Stores each user's Strava connection and server-only OAuth credentials.
create table public.strava_connections (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null,
    strava_athlete_id bigint not null,
    access_token text not null,
    refresh_token text not null,
    token_type text not null default 'Bearer',
    expires_at timestamptz not null,
    granted_scopes text[] not null default array[]::text[],
    connected_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    revoked_at timestamptz,

    constraint "strava_connections_PK" primary key (id),
    constraint "strava_connections_FK" foreign key (user_id)
        references public.profiles (id)
        on delete cascade,
    constraint "strava_connections_user_UK" unique (user_id),
    constraint "strava_connections_athlete_UK" unique (strava_athlete_id),
    constraint "strava_connections_access_token_CK" check (
        length(trim(access_token)) > 0
    ),
    constraint "strava_connections_refresh_token_CK" check (
        length(trim(refresh_token)) > 0
    ),
    constraint "strava_connections_token_type_CK" check (
        length(trim(token_type)) > 0
    ),
    constraint "strava_connections_revoked_at_CK" check (
        revoked_at is null or revoked_at >= connected_at
    )
);


-- Stores race goals and performance targets for each user.
create table public.goals (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null,
    race_name text not null,
    race_date date not null,
    target_bike_watts numeric(7, 2),
    target_swim_pace_seconds_per_100m integer,
    target_run_pace_seconds_per_km integer,
    weekly_volume_target_minutes integer,
    long_ride_target_minutes integer,
    long_run_target_minutes integer,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint "goals_PK" primary key (id),
    constraint "goals_FK" foreign key (user_id)
        references public.profiles (id)
        on delete cascade,
    constraint "goals_race_name_CK" check (length(trim(race_name)) > 0),
    constraint "goals_target_bike_watts_CK" check (
        target_bike_watts is null or target_bike_watts > 0
    ),
    constraint "goals_target_swim_pace_CK" check (
        target_swim_pace_seconds_per_100m is null
        or target_swim_pace_seconds_per_100m > 0
    ),
    constraint "goals_target_run_pace_CK" check (
        target_run_pace_seconds_per_km is null
        or target_run_pace_seconds_per_km > 0
    ),
    constraint "goals_weekly_volume_CK" check (
        weekly_volume_target_minutes is null
        or weekly_volume_target_minutes > 0
    ),
    constraint "goals_long_ride_CK" check (
        long_ride_target_minutes is null or long_ride_target_minutes > 0
    ),
    constraint "goals_long_run_CK" check (
        long_run_target_minutes is null or long_run_target_minutes > 0
    )
);


-- Stores completed workouts imported from providers or entered manually.
create table public.workouts (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null,
    source source_dom not null,
    source_workout_id text,
    sport_type sport_type_dom not null,
    name text,
    started_at timestamptz not null,
    duration_seconds integer not null,
    distance_meters numeric(12, 2),
    average_heart_rate numeric(6, 2),
    max_heart_rate numeric(6, 2),
    average_power_watts numeric(8, 2),
    normalized_power_watts numeric(8, 2),
    average_pace_seconds_per_km numeric(10, 2),
    average_cadence numeric(8, 2),
    calories integer,
    raw_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint "workouts_PK" primary key (id),
    constraint "workouts_FK" foreign key (user_id)
        references public.profiles (id)
        on delete cascade,
    constraint "workouts_source_UK" unique (source, source_workout_id),
    constraint "workouts_external_id_CK" check (
        source = 'manual' or source_workout_id is not null
    ),
    constraint "workouts_duration_CK" check (duration_seconds >= 0),
    constraint "workouts_distance_CK" check (
        distance_meters is null or distance_meters >= 0
    ),
    constraint "workouts_average_hr_CK" check (
        average_heart_rate is null or average_heart_rate >= 0
    ),
    constraint "workouts_max_hr_CK" check (
        max_heart_rate is null or max_heart_rate >= 0
    ),
    constraint "workouts_heart_rate_order_CK" check (
        average_heart_rate is null
        or max_heart_rate is null
        or max_heart_rate >= average_heart_rate
    ),
    constraint "workouts_average_power_CK" check (
        average_power_watts is null or average_power_watts >= 0
    ),
    constraint "workouts_normalized_power_CK" check (
        normalized_power_watts is null or normalized_power_watts >= 0
    ),
    constraint "workouts_pace_CK" check (
        average_pace_seconds_per_km is null
        or average_pace_seconds_per_km > 0
    ),
    constraint "workouts_cadence_CK" check (
        average_cadence is null or average_cadence >= 0
    ),
    constraint "workouts_calories_CK" check (
        calories is null or calories >= 0
    )
);


-- Stores AI-readable workout summaries and their vector embeddings.
create table public.workout_summaries (
    id uuid not null default gen_random_uuid(),
    workout_id uuid not null,
    summary text not null,
    fatigue_indicators jsonb not null default '{}'::jsonb,
    performance_notes text,
    embedding extensions.vector(1536),
    embedding_model text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint "workout_summaries_PK" primary key (id),
    constraint "workout_summaries_FK" foreign key (workout_id)
        references public.workouts (id)
        on delete cascade,
    constraint "workout_summaries_workout_UK" unique (workout_id),
    constraint "workout_summaries_summary_CK" check (
        length(trim(summary)) > 0
    ),
    constraint "workout_summaries_embedding_model_CK" check (
        (embedding is null and embedding_model is null)
        or (
            embedding is not null
            and embedding_model is not null
            and length(trim(embedding_model)) > 0
        )
    )
);


-- Stores weekly training plan headers and their overall summaries.
create table public.training_plans (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null,
    goal_id uuid not null,
    week_start date not null,
    generated_by_ai boolean not null default false,
    plan_summary text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint "training_plans_PK" primary key (id),
    constraint "training_plans_user_FK" foreign key (user_id)
        references public.profiles (id)
        on delete cascade,
    constraint "training_plans_goal_FK" foreign key (goal_id)
        references public.goals (id)
        on delete restrict,
    constraint "training_plans_week_UK" unique (user_id, week_start),
    constraint "training_plans_week_start_CK" check (
        extract(isodow from week_start) = 1
    )
);


-- Stores each day-level workout prescribed within a weekly training plan.
create table public.planned_workouts (
    id uuid not null default gen_random_uuid(),
    training_plan_id uuid not null,
    actual_workout_id uuid,
    planned_date date not null,
    sport_type sport_type_dom not null,
    planned_duration_seconds integer not null,
    target_intensity text,
    purpose text not null,
    status status_dom not null default 'planned',
    modification_reason text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint "planned_workouts_PK" primary key (id),
    constraint "planned_workouts_plan_FK" foreign key (training_plan_id)
        references public.training_plans (id)
        on delete cascade,
    constraint "planned_workouts_actual_FK" foreign key (actual_workout_id)
        references public.workouts (id)
        on delete set null,
    constraint "planned_workouts_duration_CK" check (
        planned_duration_seconds > 0
    ),
    constraint "planned_workouts_purpose_CK" check (
        length(trim(purpose)) > 0
    ),
    constraint "planned_workouts_modification_CK" check (
        status not in ('modified', 'failed')
        or (
            modification_reason is not null
            and length(trim(modification_reason)) > 0
        )
    )
);


-- Stores generated AI recommendations and the context used to produce them.
create table public.ai_recommendations (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null,
    goal_id uuid,
    recommendation_type recommendation_type_dom not null,
    user_question text,
    final_recommendation text not null,
    retrieved_context jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),

    constraint "ai_recommendations_PK" primary key (id),
    constraint "ai_recommendations_user_FK" foreign key (user_id)
        references public.profiles (id)
        on delete cascade,
    constraint "ai_recommendations_goal_FK" foreign key (goal_id)
        references public.goals (id)
        on delete set null,
    constraint "ai_recommendations_question_CK" check (
        user_question is null or length(trim(user_question)) > 0
    ),
    constraint "ai_recommendations_final_CK" check (
        length(trim(final_recommendation)) > 0
    )
);


-- Stores subjective user feedback linked to a workout or AI recommendation.
create table public.user_feedback (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null,
    workout_id uuid,
    ai_recommendation_id uuid,
    note text,
    rating rating_dom,
    fatigue_score score_dom,
    soreness_score score_dom,
    confidence_score score_dom,
    created_at timestamptz not null default now(),

    constraint "user_feedback_PK" primary key (id),
    constraint "user_feedback_user_FK" foreign key (user_id)
        references public.profiles (id)
        on delete cascade,
    constraint "user_feedback_workout_FK" foreign key (workout_id)
        references public.workouts (id)
        on delete cascade,
    constraint "user_feedback_recommendation_FK" foreign key (ai_recommendation_id)
        references public.ai_recommendations (id)
        on delete cascade,
    constraint "user_feedback_target_CK" check (
        num_nonnulls(workout_id, ai_recommendation_id) >= 1
    ),
    constraint "user_feedback_note_CK" check (
        note is null or length(trim(note)) > 0
    )
);


create unique index "goals_one_active_per_user_UQ"
    on public.goals (user_id)
    where is_active;

create index "oauth_states_user_provider_IX"
    on public.oauth_states (user_id, provider);

create index "oauth_states_unconsumed_expiration_IX"
    on public.oauth_states (expires_at)
    where consumed_at is null;

create index "strava_connections_expiration_IX"
    on public.strava_connections (expires_at)
    where revoked_at is null;

create index "goals_user_race_date_IX"
    on public.goals (user_id, race_date);

create index "workouts_user_started_at_IX"
    on public.workouts (user_id, started_at desc);

create index "workouts_user_sport_IX"
    on public.workouts (user_id, sport_type);

create index "workout_summaries_embedding_HNSW_IX"
    on public.workout_summaries
    using hnsw (embedding extensions.vector_cosine_ops)
    where embedding is not null;

create index "training_plans_goal_IX"
    on public.training_plans (goal_id);

create index "planned_workouts_plan_date_IX"
    on public.planned_workouts (training_plan_id, planned_date);

create index "planned_workouts_status_IX"
    on public.planned_workouts (status);

create index "planned_workouts_actual_IX"
    on public.planned_workouts (actual_workout_id)
    where actual_workout_id is not null;

create index "ai_recommendations_user_created_at_IX"
    on public.ai_recommendations (user_id, created_at desc);

create index "ai_recommendations_goal_IX"
    on public.ai_recommendations (goal_id)
    where goal_id is not null;

create index "user_feedback_user_created_at_IX"
    on public.user_feedback (user_id, created_at desc);

create index "user_feedback_workout_IX"
    on public.user_feedback (workout_id)
    where workout_id is not null;

create index "user_feedback_recommendation_IX"
    on public.user_feedback (ai_recommendation_id)
    where ai_recommendation_id is not null;


alter table public.profiles enable row level security;
alter table public.oauth_states enable row level security;
alter table public.strava_connections enable row level security;
alter table public.goals enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_summaries enable row level security;
alter table public.training_plans enable row level security;
alter table public.planned_workouts enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.user_feedback enable row level security;
