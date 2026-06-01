import type { EnrichedTrack, Track, AudioFeatures, PlayHistory } from '@/types/spotify'

// ── Helpers ───────────────────────────────────────────────────────────────

function daysAgo(days: number, hour: number, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function makeAlbumArt(color: string): string {
  // Inline SVG data-URI so there's no network dependency in mock mode
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='${encodeURIComponent(color)}'/%3E%3C/svg%3E`
}

// ── Raw track definitions ─────────────────────────────────────────────────

interface RawTrack {
  id: string
  name: string
  artist: { id: string; name: string; genres: string[] }
  album: string
  albumColor: string
  releaseDate: string
  duration_ms: number
  popularity: number
  features: Omit<AudioFeatures, 'id' | 'duration_ms'>
  plays: string[]
}

const RAW: RawTrack[] = [
  {
    id: 'tr_01', name: 'Blinding Lights',
    artist: { id: 'ar_weeknd', name: 'The Weeknd', genres: ['canadian pop', 'r&b'] },
    album: 'After Hours', albumColor: '#8B0000', releaseDate: '2020-03-20',
    duration_ms: 200040, popularity: 95,
    features: { danceability: 0.514, energy: 0.730, key: 5, loudness: -5.934, mode: 1, speechiness: 0.060, acousticness: 0.001, instrumentalness: 0.000, liveness: 0.090, valence: 0.334, tempo: 171.0, time_signature: 4 },
    plays: [daysAgo(0, 8, 30), daysAgo(0, 14), daysAgo(1, 22), daysAgo(3, 7), daysAgo(5, 20)],
  },
  {
    id: 'tr_02', name: 'As It Was',
    artist: { id: 'ar_harry', name: 'Harry Styles', genres: ['pop', 'uk pop'] },
    album: "Harry's House", albumColor: '#2E4057', releaseDate: '2022-05-20',
    duration_ms: 167303, popularity: 92,
    features: { danceability: 0.520, energy: 0.731, key: 6, loudness: -6.098, mode: 1, speechiness: 0.046, acousticness: 0.285, instrumentalness: 0.000, liveness: 0.123, valence: 0.960, tempo: 174.0, time_signature: 4 },
    plays: [daysAgo(0, 12), daysAgo(2, 9), daysAgo(4, 17), daysAgo(6, 21)],
  },
  {
    id: 'tr_03', name: 'Flowers',
    artist: { id: 'ar_miley', name: 'Miley Cyrus', genres: ['pop'] },
    album: 'Endless Summer Vacation', albumColor: '#F4A261', releaseDate: '2023-03-10',
    duration_ms: 200455, popularity: 91,
    features: { danceability: 0.712, energy: 0.668, key: 7, loudness: -5.283, mode: 1, speechiness: 0.046, acousticness: 0.178, instrumentalness: 0.000, liveness: 0.118, valence: 0.960, tempo: 118.0, time_signature: 4 },
    plays: [daysAgo(0, 18), daysAgo(1, 8), daysAgo(3, 13), daysAgo(5, 22)],
  },
  {
    id: 'tr_04', name: 'Anti-Hero',
    artist: { id: 'ar_taylor', name: 'Taylor Swift', genres: ['pop'] },
    album: 'Midnights', albumColor: '#1C1B33', releaseDate: '2022-10-21',
    duration_ms: 200690, popularity: 96,
    features: { danceability: 0.737, energy: 0.643, key: 2, loudness: -5.777, mode: 1, speechiness: 0.063, acousticness: 0.228, instrumentalness: 0.000, liveness: 0.108, valence: 0.493, tempo: 97.0, time_signature: 4 },
    plays: [daysAgo(0, 7), daysAgo(0, 23), daysAgo(2, 15), daysAgo(4, 8), daysAgo(6, 20)],
  },
  {
    id: 'tr_05', name: 'Levitating',
    artist: { id: 'ar_dua', name: 'Dua Lipa', genres: ['dance pop', 'pop'] },
    album: 'Future Nostalgia', albumColor: '#FF6B9D', releaseDate: '2020-10-02',
    duration_ms: 203807, popularity: 89,
    features: { danceability: 0.702, energy: 0.825, key: 2, loudness: -4.968, mode: 0, speechiness: 0.043, acousticness: 0.012, instrumentalness: 0.000, liveness: 0.113, valence: 0.915, tempo: 103.0, time_signature: 4 },
    plays: [daysAgo(1, 7, 30), daysAgo(2, 19), daysAgo(4, 12)],
  },
  {
    id: 'tr_06', name: 'Bad Habit',
    artist: { id: 'ar_stevelacy', name: 'Steve Lacy', genres: ['indie r&b', 'funk'] },
    album: 'Gemini Rights', albumColor: '#E8D5B7', releaseDate: '2022-07-15',
    duration_ms: 234500, popularity: 84,
    features: { danceability: 0.793, energy: 0.467, key: 9, loudness: -8.447, mode: 0, speechiness: 0.055, acousticness: 0.362, instrumentalness: 0.000, liveness: 0.103, valence: 0.768, tempo: 95.0, time_signature: 4 },
    plays: [daysAgo(0, 21), daysAgo(2, 13), daysAgo(5, 16)],
  },
  {
    id: 'tr_07', name: 'Running Up That Hill',
    artist: { id: 'ar_katebush', name: 'Kate Bush', genres: ['art rock', 'new wave'] },
    album: 'Hounds of Love', albumColor: '#4A90D9', releaseDate: '1985-08-05',
    duration_ms: 300000, popularity: 85,
    features: { danceability: 0.576, energy: 0.619, key: 3, loudness: -9.243, mode: 0, speechiness: 0.038, acousticness: 0.123, instrumentalness: 0.005, liveness: 0.095, valence: 0.522, tempo: 113.0, time_signature: 4 },
    plays: [daysAgo(1, 23), daysAgo(4, 11), daysAgo(6, 9)],
  },
  {
    id: 'tr_08', name: 'Heat Waves',
    artist: { id: 'ar_glassanimals', name: 'Glass Animals', genres: ['indie pop', 'psychedelic pop'] },
    album: 'Dreamland', albumColor: '#FF8C42', releaseDate: '2020-08-07',
    duration_ms: 238805, popularity: 90,
    features: { danceability: 0.638, energy: 0.619, key: 2, loudness: -8.013, mode: 0, speechiness: 0.036, acousticness: 0.222, instrumentalness: 0.002, liveness: 0.074, valence: 0.893, tempo: 80.0, time_signature: 4 },
    plays: [daysAgo(0, 20), daysAgo(1, 15), daysAgo(3, 10), daysAgo(5, 21)],
  },
  {
    id: 'tr_09', name: 'Good 4 U',
    artist: { id: 'ar_olivia', name: 'Olivia Rodrigo', genres: ['pop', 'pop punk'] },
    album: 'SOUR', albumColor: '#6B2D8B', releaseDate: '2021-05-21',
    duration_ms: 178147, popularity: 88,
    features: { danceability: 0.563, energy: 0.898, key: 1, loudness: -4.054, mode: 1, speechiness: 0.100, acousticness: 0.008, instrumentalness: 0.000, liveness: 0.125, valence: 0.677, tempo: 166.0, time_signature: 4 },
    plays: [daysAgo(0, 17), daysAgo(2, 8), daysAgo(3, 22), daysAgo(6, 14)],
  },
  {
    id: 'tr_10', name: 'MONTERO (Call Me By Your Name)',
    artist: { id: 'ar_lilnasx', name: 'Lil Nas X', genres: ['pop rap', 'lgbtq+ hip hop'] },
    album: 'MONTERO', albumColor: '#9B2335', releaseDate: '2021-09-17',
    duration_ms: 137876, popularity: 86,
    features: { danceability: 0.851, energy: 0.746, key: 0, loudness: -4.699, mode: 1, speechiness: 0.158, acousticness: 0.049, instrumentalness: 0.000, liveness: 0.124, valence: 0.614, tempo: 179.0, time_signature: 4 },
    plays: [daysAgo(1, 12), daysAgo(3, 18), daysAgo(5, 9)],
  },
  {
    id: 'tr_11', name: 'drivers license',
    artist: { id: 'ar_olivia', name: 'Olivia Rodrigo', genres: ['pop', 'pop punk'] },
    album: 'SOUR', albumColor: '#6B2D8B', releaseDate: '2021-05-21',
    duration_ms: 242014, popularity: 87,
    features: { danceability: 0.327, energy: 0.383, key: 8, loudness: -8.490, mode: 1, speechiness: 0.040, acousticness: 0.625, instrumentalness: 0.000, liveness: 0.097, valence: 0.130, tempo: 96.0, time_signature: 4 },
    plays: [daysAgo(2, 1), daysAgo(5, 23)],
  },
  {
    id: 'tr_12', name: 'Shivers',
    artist: { id: 'ar_ed', name: 'Ed Sheeran', genres: ['pop', 'uk pop'] },
    album: '=', albumColor: '#FF6B35', releaseDate: '2021-10-29',
    duration_ms: 207880, popularity: 83,
    features: { danceability: 0.736, energy: 0.793, key: 5, loudness: -4.769, mode: 1, speechiness: 0.067, acousticness: 0.021, instrumentalness: 0.000, liveness: 0.075, valence: 0.910, tempo: 143.0, time_signature: 4 },
    plays: [daysAgo(0, 9), daysAgo(2, 17), daysAgo(4, 11)],
  },
  {
    id: 'tr_13', name: 'Watermelon Sugar',
    artist: { id: 'ar_harry', name: 'Harry Styles', genres: ['pop', 'uk pop'] },
    album: 'Fine Line', albumColor: '#F7D6E0', releaseDate: '2019-12-13',
    duration_ms: 174000, popularity: 85,
    features: { danceability: 0.548, energy: 0.816, key: 0, loudness: -4.209, mode: 1, speechiness: 0.047, acousticness: 0.122, instrumentalness: 0.000, liveness: 0.333, valence: 0.946, tempo: 95.0, time_signature: 4 },
    plays: [daysAgo(1, 13), daysAgo(4, 7, 30), daysAgo(6, 18)],
  },
  {
    id: 'tr_14', name: 'Butter',
    artist: { id: 'ar_bts', name: 'BTS', genres: ['k-pop', 'k-pop boy group'] },
    album: 'Butter', albumColor: '#FFD700', releaseDate: '2021-07-09',
    duration_ms: 164442, popularity: 88,
    features: { danceability: 0.872, energy: 0.870, key: 9, loudness: -5.360, mode: 1, speechiness: 0.194, acousticness: 0.016, instrumentalness: 0.000, liveness: 0.090, valence: 0.713, tempo: 110.0, time_signature: 4 },
    plays: [daysAgo(0, 11), daysAgo(1, 19), daysAgo(2, 8), daysAgo(4, 15), daysAgo(6, 10)],
  },
  {
    id: 'tr_15', name: 'STAY',
    artist: { id: 'ar_klaroi', name: 'The Kid LAROI', genres: ['australian hip hop', 'pop'] },
    album: 'F*CK LOVE 3', albumColor: '#2D2D2D', releaseDate: '2021-08-06',
    duration_ms: 141000, popularity: 87,
    features: { danceability: 0.633, energy: 0.850, key: 1, loudness: -4.513, mode: 1, speechiness: 0.102, acousticness: 0.015, instrumentalness: 0.000, liveness: 0.089, valence: 0.646, tempo: 170.0, time_signature: 4 },
    plays: [daysAgo(0, 16), daysAgo(2, 21), daysAgo(4, 9)],
  },
  {
    id: 'tr_16', name: 'Industry Baby',
    artist: { id: 'ar_lilnasx', name: 'Lil Nas X', genres: ['pop rap', 'lgbtq+ hip hop'] },
    album: 'MONTERO', albumColor: '#9B2335', releaseDate: '2021-09-17',
    duration_ms: 212000, popularity: 85,
    features: { danceability: 0.727, energy: 0.752, key: 7, loudness: -5.032, mode: 1, speechiness: 0.233, acousticness: 0.038, instrumentalness: 0.000, liveness: 0.130, valence: 0.434, tempo: 149.0, time_signature: 4 },
    plays: [daysAgo(1, 20), daysAgo(3, 12), daysAgo(6, 17)],
  },
  {
    id: 'tr_17', name: 'Save Your Tears',
    artist: { id: 'ar_weeknd', name: 'The Weeknd', genres: ['canadian pop', 'r&b'] },
    album: 'After Hours', albumColor: '#8B0000', releaseDate: '2020-03-20',
    duration_ms: 215627, popularity: 88,
    features: { danceability: 0.812, energy: 0.838, key: 0, loudness: -5.487, mode: 1, speechiness: 0.054, acousticness: 0.010, instrumentalness: 0.000, liveness: 0.098, valence: 0.490, tempo: 118.0, time_signature: 4 },
    plays: [daysAgo(0, 22), daysAgo(1, 10), daysAgo(3, 20), daysAgo(5, 8)],
  },
  {
    id: 'tr_18', name: 'Therefore I Am',
    artist: { id: 'ar_billie', name: 'Billie Eilish', genres: ['electropop', 'indie pop'] },
    album: 'Happier Than Ever', albumColor: '#C8E6C9', releaseDate: '2021-07-30',
    duration_ms: 174086, popularity: 82,
    features: { danceability: 0.843, energy: 0.645, key: 11, loudness: -9.441, mode: 0, speechiness: 0.206, acousticness: 0.049, instrumentalness: 0.002, liveness: 0.124, valence: 0.349, tempo: 136.0, time_signature: 4 },
    plays: [daysAgo(2, 14), daysAgo(5, 11)],
  },
  {
    id: 'tr_19', name: 'Dynamite',
    artist: { id: 'ar_bts', name: 'BTS', genres: ['k-pop', 'k-pop boy group'] },
    album: 'BE', albumColor: '#E8F4FD', releaseDate: '2020-11-20',
    duration_ms: 199054, popularity: 86,
    features: { danceability: 0.742, energy: 0.765, key: 6, loudness: -5.830, mode: 1, speechiness: 0.105, acousticness: 0.015, instrumentalness: 0.000, liveness: 0.072, valence: 0.949, tempo: 114.0, time_signature: 4 },
    plays: [daysAgo(0, 10), daysAgo(2, 18), daysAgo(4, 14), daysAgo(6, 8)],
  },
  {
    id: 'tr_20', name: 'Permission to Dance',
    artist: { id: 'ar_bts', name: 'BTS', genres: ['k-pop', 'k-pop boy group'] },
    album: 'Permission to Dance', albumColor: '#1976D2', releaseDate: '2021-07-09',
    duration_ms: 187026, popularity: 80,
    features: { danceability: 0.786, energy: 0.757, key: 4, loudness: -5.490, mode: 1, speechiness: 0.074, acousticness: 0.011, instrumentalness: 0.000, liveness: 0.101, valence: 0.990, tempo: 124.0, time_signature: 4 },
    plays: [daysAgo(1, 17), daysAgo(4, 20)],
  },
  {
    id: 'tr_21', name: 'Unholy',
    artist: { id: 'ar_samsmith', name: 'Sam Smith', genres: ['pop', 'uk pop'] },
    album: 'Gloria', albumColor: '#3D1A78', releaseDate: '2023-01-27',
    duration_ms: 156943, popularity: 88,
    features: { danceability: 0.747, energy: 0.831, key: 8, loudness: -4.614, mode: 0, speechiness: 0.071, acousticness: 0.045, instrumentalness: 0.000, liveness: 0.108, valence: 0.468, tempo: 131.0, time_signature: 4 },
    plays: [daysAgo(0, 13), daysAgo(2, 22), daysAgo(5, 7)],
  },
  {
    id: 'tr_22', name: 'Ghost',
    artist: { id: 'ar_jb', name: 'Justin Bieber', genres: ['canadian pop', 'pop'] },
    album: 'Justice', albumColor: '#E53935', releaseDate: '2021-03-19',
    duration_ms: 153720, popularity: 79,
    features: { danceability: 0.549, energy: 0.553, key: 9, loudness: -7.234, mode: 1, speechiness: 0.039, acousticness: 0.321, instrumentalness: 0.000, liveness: 0.073, valence: 0.626, tempo: 130.0, time_signature: 4 },
    plays: [daysAgo(3, 9), daysAgo(6, 22)],
  },
  {
    id: 'tr_23', name: 'Leave The Door Open',
    artist: { id: 'ar_brunomars', name: 'Bruno Mars', genres: ['pop', 'r&b'] },
    album: 'An Evening with Silk Sonic', albumColor: '#B8860B', releaseDate: '2021-12-03',
    duration_ms: 243960, popularity: 83,
    features: { danceability: 0.705, energy: 0.381, key: 2, loudness: -9.095, mode: 1, speechiness: 0.046, acousticness: 0.659, instrumentalness: 0.000, liveness: 0.073, valence: 0.682, tempo: 94.0, time_signature: 4 },
    plays: [daysAgo(1, 0, 30), daysAgo(4, 1), daysAgo(6, 23)],
  },
  {
    id: 'tr_24', name: 'Woman',
    artist: { id: 'ar_dojacat', name: 'Doja Cat', genres: ['pop rap', 'r&b'] },
    album: 'Planet Her', albumColor: '#7B1FA2', releaseDate: '2021-06-25',
    duration_ms: 195254, popularity: 80,
    features: { danceability: 0.831, energy: 0.752, key: 6, loudness: -6.162, mode: 0, speechiness: 0.104, acousticness: 0.023, instrumentalness: 0.000, liveness: 0.106, valence: 0.472, tempo: 91.0, time_signature: 4 },
    plays: [daysAgo(0, 19, 30), daysAgo(3, 16), daysAgo(5, 13)],
  },
  {
    id: 'tr_25', name: "Beggin'",
    artist: { id: 'ar_maneskin', name: 'Maneskin', genres: ['glam rock', 'rock'] },
    album: 'Il ballo della vita', albumColor: '#B71C1C', releaseDate: '2017-10-26',
    duration_ms: 211667, popularity: 82,
    features: { danceability: 0.726, energy: 0.796, key: 2, loudness: -5.694, mode: 0, speechiness: 0.056, acousticness: 0.056, instrumentalness: 0.000, liveness: 0.091, valence: 0.556, tempo: 136.0, time_signature: 4 },
    plays: [daysAgo(1, 21), daysAgo(4, 19), daysAgo(6, 15)],
  },
  {
    id: 'tr_26', name: 'Peaches',
    artist: { id: 'ar_jb', name: 'Justin Bieber', genres: ['canadian pop', 'pop'] },
    album: 'Justice', albumColor: '#E53935', releaseDate: '2021-03-19',
    duration_ms: 198082, popularity: 81,
    features: { danceability: 0.673, energy: 0.469, key: 10, loudness: -7.654, mode: 1, speechiness: 0.108, acousticness: 0.295, instrumentalness: 0.000, liveness: 0.101, valence: 0.747, tempo: 90.0, time_signature: 4 },
    plays: [daysAgo(2, 12), daysAgo(5, 18)],
  },
  {
    id: 'tr_27', name: 'Kiss Me More',
    artist: { id: 'ar_dojacat', name: 'Doja Cat', genres: ['pop rap', 'r&b'] },
    album: 'Planet Her', albumColor: '#7B1FA2', releaseDate: '2021-06-25',
    duration_ms: 208426, popularity: 79,
    features: { danceability: 0.794, energy: 0.573, key: 1, loudness: -7.245, mode: 1, speechiness: 0.068, acousticness: 0.205, instrumentalness: 0.000, liveness: 0.088, valence: 0.679, tempo: 112.0, time_signature: 4 },
    plays: [daysAgo(1, 11), daysAgo(5, 14)],
  },
  {
    id: 'tr_28', name: 'Cold Heart',
    artist: { id: 'ar_elton', name: 'Elton John', genres: ['glam rock', 'pop'] },
    album: 'The Lockdown Sessions', albumColor: '#004D40', releaseDate: '2021-10-22',
    duration_ms: 200000, popularity: 78,
    features: { danceability: 0.698, energy: 0.760, key: 5, loudness: -5.855, mode: 0, speechiness: 0.042, acousticness: 0.037, instrumentalness: 0.000, liveness: 0.083, valence: 0.750, tempo: 103.0, time_signature: 4 },
    plays: [daysAgo(3, 14), daysAgo(6, 11)],
  },
  {
    id: 'tr_29', name: 'Fancy Like',
    artist: { id: 'ar_walkerhayes', name: 'Walker Hayes', genres: ['country pop'] },
    album: 'Country Stuff the Album', albumColor: '#33691E', releaseDate: '2022-01-21',
    duration_ms: 152786, popularity: 74,
    features: { danceability: 0.789, energy: 0.682, key: 4, loudness: -6.183, mode: 1, speechiness: 0.093, acousticness: 0.103, instrumentalness: 0.000, liveness: 0.085, valence: 0.872, tempo: 120.0, time_signature: 4 },
    plays: [daysAgo(4, 18), daysAgo(6, 8)],
  },
  {
    id: 'tr_30', name: 'Surrender',
    artist: { id: 'ar_natalietaylor', name: 'Natalie Taylor', genres: ['indie', 'singer-songwriter'] },
    album: 'Surrender', albumColor: '#263238', releaseDate: '2015-01-01',
    duration_ms: 248000, popularity: 65,
    features: { danceability: 0.268, energy: 0.196, key: 1, loudness: -14.102, mode: 1, speechiness: 0.028, acousticness: 0.872, instrumentalness: 0.010, liveness: 0.089, valence: 0.186, tempo: 75.0, time_signature: 3 },
    plays: [daysAgo(2, 23), daysAgo(6, 0)],
  },
]

// ── Build EnrichedTrack objects ───────────────────────────────────────────

function buildEnriched(raw: RawTrack): EnrichedTrack {
  const track: Track = {
    id: raw.id,
    name: raw.name,
    artists: [raw.artist],
    album: {
      id: `alb_${raw.id}`,
      name: raw.album,
      images: [{ url: makeAlbumArt(raw.albumColor), height: 64, width: 64 }],
      release_date: raw.releaseDate,
    },
    duration_ms: raw.duration_ms,
    popularity: raw.popularity,
    preview_url: null,
    external_urls: { spotify: `https://open.spotify.com/track/${raw.id}` },
  }

  const audioFeatures: AudioFeatures = {
    id: raw.id,
    duration_ms: raw.duration_ms,
    ...raw.features,
  }

  const playHistory: PlayHistory[] = raw.plays.map((played_at) => ({
    track,
    played_at,
    context: null,
  }))

  const lastPlayedAt = new Date(
    Math.max(...raw.plays.map((p) => new Date(p).getTime()))
  )

  return {
    track,
    audioFeatures,
    playHistory,
    playCount: raw.plays.length,
    lastPlayedAt,
  }
}

export const MOCK_TRACKS: EnrichedTrack[] = RAW.map(buildEnriched)
