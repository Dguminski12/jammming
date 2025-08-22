const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SCOPES = ["playlist-modify-public", "playlist-modify-private"];
let accessToken = null;
let expiresAt = 0;

//temp logging
console.log("[auth] env", {
  CLIENT_ID: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  REDIRECT_URI: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
  origin: window.location.origin
});


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
  console.log("[auth] starting redirect to Spotify…");
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

    const payload = await fetch(url,{
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
    });

    const data = await payload.json();
    accessToken = data.access_token;
    const expiresIn = Number(data.expires_in || 3600);
    expiresAt = Date.now() + expiresIn * 1000;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('expires_at', String(expiresAt));

    // remove ?code=... from the URL bar
    window.history.replaceState({}, "", window.location.pathname);

    return accessToken;
}

export async function getAccessToken() {
    if (accessToken && Date.now() < expiresAt){
        console.log("[auth] cache hit");
        return accessToken;
    }
    
    const stored = localStorage.getItem('access_token');
    const storedExpiry = Number(localStorage.getItem('expires_at'));
    if (stored && storedExpiry && Date.now() < storedExpiry) {
        console.log("[auth] localStorage hit");
        accessToken = stored;
        expiresAt = storedExpiry;
        return accessToken;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
        console.log("Authorization code:", code);
        return await fetchAccessToken(code);
    }
    await startAuth();
    console.log("getAccessToken called", { CLIENT_ID, REDIRECT_URI });
    return null;
}

export async function spotifyFetch(endpoint, init = {}) {
  const token = await getAccessToken();

  const res = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }

  return res.json();
}
