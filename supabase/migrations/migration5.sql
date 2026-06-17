begin;

alter table public.workouts
    add column heart_rate_time_seconds integer[],
    add column heart_rate_bpm smallint[],
    add column heart_rate_stream_original_size integer,
    add column heart_rate_stream_resolution text,
    add column heart_rate_stream_series_type text;

alter table public.workouts
    add constraint "workouts_heart_rate_stream_pair_CK" check (
        (
            heart_rate_time_seconds is null
            and heart_rate_bpm is null
        )
        or (
            heart_rate_time_seconds is not null
            and heart_rate_bpm is not null
        )
    ),
    add constraint "workouts_heart_rate_stream_length_CK" check (
        heart_rate_time_seconds is null
        or (
            cardinality(heart_rate_time_seconds) > 0
            and cardinality(heart_rate_time_seconds) = cardinality(heart_rate_bpm)
        )
    ),
    add constraint "workouts_heart_rate_stream_null_values_CK" check (
        heart_rate_time_seconds is null
        or (
            array_position(heart_rate_time_seconds, null) is null
            and array_position(heart_rate_bpm, null) is null
        )
    ),
    add constraint "workouts_heart_rate_stream_values_CK" check (
        heart_rate_time_seconds is null
        or (
            0 <= all(heart_rate_time_seconds)
            and 1 <= all(heart_rate_bpm)
        )
    ),
    add constraint "workouts_heart_rate_stream_original_size_CK" check (
        heart_rate_stream_original_size is null
        or heart_rate_stream_original_size >= cardinality(heart_rate_time_seconds)
    ),
    add constraint "workouts_heart_rate_stream_resolution_CK" check (
        heart_rate_stream_resolution is null
        or heart_rate_stream_resolution in ('low', 'medium', 'high')
    ),
    add constraint "workouts_heart_rate_stream_series_type_CK" check (
        heart_rate_stream_series_type is null
        or heart_rate_stream_series_type in ('distance', 'time')
    ),
    add constraint "workouts_heart_rate_stream_metadata_CK" check (
        (
            heart_rate_time_seconds is null
            and heart_rate_stream_original_size is null
            and heart_rate_stream_resolution is null
            and heart_rate_stream_series_type is null
        )
        or heart_rate_time_seconds is not null
    );

commit;
