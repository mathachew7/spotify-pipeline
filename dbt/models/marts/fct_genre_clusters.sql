{{
  config(
    materialized = 'table',
    description  = 'Track-level feature vectors for clustering / graph similarity. Powers the force graph.'
  )
}}

with sessions as (
    select * from {{ ref('fct_listening_sessions') }}
),

track_agg as (
    select
        track_id,
        any_value(track_name)           as track_name,
        any_value(primary_artist_id)    as artist_id,
        any_value(primary_artist_name)  as artist_name,
        any_value(album_id)             as album_id,
        any_value(album_name)           as album_name,

        count(*)                        as play_count,
        max(played_at)                  as last_played_at,
        min(played_at)                  as first_played_at,

        -- Audio feature vector (all 0-1)
        any_value(energy)               as energy,
        any_value(danceability)         as danceability,
        any_value(valence)              as valence,
        any_value(acousticness)         as acousticness,
        any_value(instrumentalness)     as instrumentalness,
        any_value(speechiness)          as speechiness,
        any_value(liveness)             as liveness,
        any_value(tempo)                as tempo,
        any_value(loudness)             as loudness,
        any_value(mood_bucket)          as mood_bucket

    from sessions
    group by 1
),

ranked as (
    select
        *,
        -- Normalised play count for node sizing
        round(
            (play_count - min(play_count) over()) /
            nullif(max(play_count) over() - min(play_count) over(), 0),
            4
        ) as play_count_normalised,

        -- Artist rank for colour grouping
        dense_rank() over (order by play_count desc) as track_rank
    from track_agg
)

select * from ranked
order by play_count desc
