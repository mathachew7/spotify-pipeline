{{
  config(
    materialized = 'view',
    description  = 'Deduplicated track play events from raw_plays. One row per (track_id, played_at).'
  )
}}

with source as (
    select * from {{ source('raw', 'raw_plays') }}
),

cleaned as (
    select
        track_id,
        track_name,
        -- Explode comma-delimited artist fields into arrays
        split(artist_ids, ',')   as artist_id_array,
        split(artist_names, ',') as artist_name_array,
        -- Primary artist (first in list)
        split(artist_ids, ',')[safe_offset(0)]   as primary_artist_id,
        split(artist_names, ',')[safe_offset(0)] as primary_artist_name,
        album_id,
        album_name,
        context_type,
        context_uri,
        timestamp(played_at)  as played_at,
        date(played_at)       as play_date,
        extract(hour from played_at)         as play_hour,
        extract(dayofweek from played_at)    as play_dow,   -- 1=Sun, 7=Sat
        _ingested_at,
        _date_partition
    from source
    where track_id is not null
      and played_at is not null
),

deduped as (
    select *
    from cleaned
    qualify row_number() over (partition by track_id, played_at order by _ingested_at desc) = 1
)

select * from deduped
