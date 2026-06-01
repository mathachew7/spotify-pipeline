{{
  config(
    materialized = 'view',
    description  = 'Latest audio features per track, deduplicated on track_id.'
  )
}}

with source as (
    select * from {{ source('raw', 'raw_audio_features') }}
),

cleaned as (
    select
        track_id,
        -- Clamp all 0-1 features to valid range
        greatest(0.0, least(1.0, danceability))      as danceability,
        greatest(0.0, least(1.0, energy))            as energy,
        cast(key as int64)                           as musical_key,
        loudness,
        cast(mode as int64)                          as musical_mode,
        greatest(0.0, least(1.0, speechiness))       as speechiness,
        greatest(0.0, least(1.0, acousticness))      as acousticness,
        greatest(0.0, least(1.0, instrumentalness))  as instrumentalness,
        greatest(0.0, least(1.0, liveness))          as liveness,
        greatest(0.0, least(1.0, valence))           as valence,
        tempo,
        duration_ms,
        time_signature,
        _ingested_at,
        -- Derived mood bucket
        case
            when valence >= 0.6 and energy >= 0.6 then 'Happy/Energetic'
            when valence >= 0.6 and energy <  0.6 then 'Happy/Calm'
            when valence <  0.6 and energy >= 0.6 then 'Angry/Intense'
            else 'Sad/Melancholic'
        end as mood_bucket
    from source
    where track_id is not null
),

deduped as (
    select *
    from cleaned
    qualify row_number() over (partition by track_id order by _ingested_at desc) = 1
)

select * from deduped
