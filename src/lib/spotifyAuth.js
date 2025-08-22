const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SCOPES = ["playlist-modify-public", "playlist-modify-private"];

function randomString(len = 64) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function base64UrlEncode(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(hash); // code_challenge
}

async function startAuth() {
  const verifier = randomString(64);
  const state = randomString(16);

  sessionStorage.setItem("spotify_pkce_verifier", verifier);
  sessionStorage.setItem("spotify_auth_state", state);

  const challenge = await sha256(verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(" "),
    code_challenge_method: "S256",
    code_challenge: challenge,
    state
  });

  // go to Spotify
  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function fetchAccessToken(code) {
    const verifier = sessionStorage.getItem("spotify_pkce_verifier");
    const url = "https://accounts.spotify.com/api/token";

    const payload = {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: verifier
        })
    }
    const body = await fetch(url, payload);
    const response = await body.json();

    localStorage.setItem('access_token', response.access_token);
}

let accessToken = null;
let expiresAt = 0;

export async function getAccessToken() {
    if (accessToken && Date.now() < expiresAt) return accessToken;
    
    const stored = localStorage.getItem('access_token');
    const storedExpiry = localStorage.getItem('expires_at');
    if (stored && storedExpiry && Date.now() < storedExpiry) {
        accessToken = stored;
        expiresAt = storedExpiry;
        return accessToken;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
        console.log("Authorization code:", code);
        return null;
    }
    await startAuth();
    console.log("getAccessToken called", { CLIENT_ID, REDIRECT_URI });
    return null;
}

export async function spotifyfetch(accessToken) {
  let token = await getAccessToken();

  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  });

  const data = await response.json();
}