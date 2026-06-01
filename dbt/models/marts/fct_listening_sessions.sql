{{
  config(
    materialized    = 'table',
    partition_by    = {'field': 'session_date', 'data_type': 'date'},
    cluster_by      = ['primary_artist_id'],
    description     = 'One row per track play, enriched with audio features. Core fact table.'
  )
}}

with plays as (
    select * from {{ ref('stg_tracks') }}
),

features as (
    select * from {{ ref('stg_audio_features') }}
),

joined as (
    select
        -- Identifiers
        p.track_id,
        p.track_name,
        p.primary_artist_id,
        p.primary_artist_name,
        p.album_id,
        p.album_name,

        -- Time dims
        p.played_at,
        p.play_date                                             as session_date,
        p.play_hour,
        p.play_dow,
        case p.play_dow
            when 1 then 'Sunday'
            when 2 then 'Monday'
            when 3 then 'Tuesday'
            when 4 then 'Wednesday'
            when 5 then 'Thursday'
            when 6 then 'Friday'
            when 7 then 'Saturday'
        end                                                     as day_of_week_name,
        case
            when p.play_hour between 5  and 11 then 'Morning'
            when p.play_hour between 12 and 16 then 'Afternoon'
            when p.play_hour between 17 and 20 then 'Evening'
            else 'Night'
        end                                                     as time_of_day,

        -- Audio features
        f.energy,
        f.danceability,
        f.valence,
        f.acousticness,
        f.instrumentalness,
        f.speechiness,
        f.liveness,
        f.tempo,
        f.loudness,
        f.musical_key,
        f.musical_mode,
        f.mood_bucket,
        f.duration_ms,

        -- Context
        p.context_type,
        p.context_uri

    from plays p
    left join features f using (track_id)
)

select * from joined
