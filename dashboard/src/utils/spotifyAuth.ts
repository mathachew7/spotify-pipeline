const AUTH_KEY = 'wavelength_auth'
const VERIFIER_KEY = 'wavelength_pkce_verifier'
const CLIENT_ID_KEY = 'wavelength_client_id'

export interface SpotifyAuth {
  accessToken: string
  refreshToken: string
  expiresAt: number   // ms timestamp
  clientId: string
  displayName: string
  avatarUrl: string | null
}

// ── PKCE helpers ──────────────────────────────────────────────────────────

function randomBase64Url(byteLen: number): string {
  const buf = new Uint8Array(byteLen)
  crypto.getRandomValues(buf)
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function sha256Base64Url(plain: string): Promise<string> {
  const data = new TextEncoder().encode(plain)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// ── Storage ───────────────────────────────────────────────────────────────

export function getStoredClientId(): string {
  return localStorage.getItem(CLIENT_ID_KEY) ?? ''
}

export function saveClientId(id: string): void {
  localStorage.setItem(CLIENT_ID_KEY, id.trim())
}

export function getStoredAuth(): SpotifyAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? (JSON.parse(raw) as SpotifyAuth) : null
  } catch {
    return null
  }
}

function saveAuth(auth: SpotifyAuth): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY)
  sessionStorage.removeItem(VERIFIER_KEY)
}

export function isTokenFresh(auth: SpotifyAuth): boolean {
  return Date.now() < auth.expiresAt - 60_000
}

// ── OAuth PKCE flow ───────────────────────────────────────────────────────

const SCOPES = [
  'user-read-recently-played',
  'user-top-read',
  'user-read-private',
  'user-read-email',
].join(' ')

export function getRedirectUri(): string {
  return window.location.origin
}

export async function startAuthFlow(clientId: string): Promise<void> {
  const verifier = randomBase64Url(64)
  const challenge = await sha256Base64Url(verifier)

  sessionStorage.setItem(VERIFIER_KEY, verifier)
  saveClientId(clientId)

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })

  window.location.href = `https://accounts.spotify.com/authorize?${params}`
}

export async function exchangeCode(code: string): Promise<SpotifyAuth | null> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  const clientId = getStoredClientId()
  if (!verifier || !clientId) return null

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: getRedirectUri(),
      client_id: clientId,
      code_verifier: verifier,
    }),
  })

  if (!res.ok) return null
  const tok = await res.json() as { access_token: string; refresh_token: string; expires_in: number }

  sessionStorage.removeItem(VERIFIER_KEY)

  const profile = await fetchProfile(tok.access_token)

  const auth: SpotifyAuth = {
    accessToken: tok.access_token,
    refreshToken: tok.refresh_token,
    expiresAt: Date.now() + tok.expires_in * 1000,
    clientId,
    displayName: profile?.display_name ?? 'Spotify User',
    avatarUrl: profile?.images?.[0]?.url ?? null,
  }

  saveAuth(auth)
  return auth
}

export async function refreshAccessToken(auth: SpotifyAuth): Promise<SpotifyAuth | null> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: auth.refreshToken,
      client_id: auth.clientId,
    }),
  })

  if (!res.ok) return null
  const tok = await res.json() as { access_token: string; refresh_token?: string; expires_in: number }

  const newAuth: SpotifyAuth = {
    ...auth,
    accessToken: tok.access_token,
    refreshToken: tok.refresh_token ?? auth.refreshToken,
    expiresAt: Date.now() + tok.expires_in * 1000,
  }

  saveAuth(newAuth)
  return newAuth
}

async function fetchProfile(accessToken: string) {
  try {
    const res = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return null
    return res.json() as Promise<{ display_name: string; images: Array<{ url: string }> }>
  } catch {
    return null
  }
}
