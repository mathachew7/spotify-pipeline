{{
  config(
    materialized = 'table',
    description  = 'Top artists by play count with avg audio feature profile.'
  )
}}

with sessions as (
    select * from {{ ref('fct_listening_sessions') }}
),

aggregated as (
    select
        primary_artist_id                       as artist_id,
        primary_artist_name                     as artist_name,

        count(*)                                as total_plays,
        count(distinct track_id)                as unique_tracks,
        count(distinct session_date)            as active_days,

        -- Audio feature profile
        round(avg(energy),         3)           as avg_energy,
        round(avg(danceability),   3)           as avg_danceability,
        round(avg(valence),        3)           as avg_valence,
        round(avg(acousticness),   3)           as avg_acousticness,
        round(avg(tempo),          1)           as avg_tempo,

        -- Recency
        max(played_at)                          as last_played_at,
        min(played_at)                          as first_played_at,

        -- Most common mood
        approx_top_count(mood_bucket, 1)[offset(0)].value as dominant_mood

    from sessions
    where primary_artist_id is not null
    group by 1, 2
)

select
    *,
    dense_rank() over (order by total_plays desc) as play_rank
from aggregated
order by total_plays desc
