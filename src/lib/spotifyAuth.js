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


export async function getAccesstoken() {
    await startAuth();
    console.log("getAccessToken called", { CLIENT_ID, REDIRECT_URI });
    return null;
}