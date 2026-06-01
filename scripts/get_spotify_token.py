"""
One-time OAuth flow to get a Spotify refresh token.
Run once, store the refresh token in your .env or GCP Secret Manager.

Usage:
  python scripts/get_spotify_token.py
  # Opens browser → authorize → paste callback URL → prints tokens

Requirements:
  pip install spotipy python-dotenv
"""
import os
import webbrowser
from urllib.parse import urlencode, urlparse, parse_qs

import requests
from base64 import b64encode

CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET", "")
REDIRECT_URI = "http://localhost:8888/callback"

SCOPES = [
    "user-read-recently-played",
    "user-top-read",
    "user-read-playback-state",
    "user-read-currently-playing",
]


def main() -> None:
    if not CLIENT_ID or not CLIENT_SECRET:
        print(
            "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.\n"
            "Create an app at https://developer.spotify.com/dashboard"
        )
        return

    params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": " ".join(SCOPES),
        "show_dialog": "true",
    }
    auth_url = "https://accounts.spotify.com/authorize?" + urlencode(params)
    print(f"\nOpening browser for authorization:\n{auth_url}\n")
    webbrowser.open(auth_url)

    callback_url = input("Paste the full callback URL here: ").strip()
    parsed = urlparse(callback_url)
    code = parse_qs(parsed.query).get("code", [None])[0]
    if not code:
        print("Could not extract code from URL.")
        return

    # Exchange code for tokens
    creds = b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    resp = requests.post(
        "https://accounts.spotify.com/api/token",
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI,
        },
        headers={"Authorization": f"Basic {creds}"},
        timeout=15,
    )
    resp.raise_for_status()
    tokens = resp.json()

    print("\n✓ Token exchange successful!\n")
    print(f"ACCESS_TOKEN  (expires in ~1hr):\n{tokens['access_token']}\n")
    print(f"REFRESH_TOKEN (save this permanently):\n{tokens['refresh_token']}\n")
    print("Add to your .env file:")
    print(f"  SPOTIFY_REFRESH_TOKEN={tokens['refresh_token']}")


if __name__ == "__main__":
    main()
