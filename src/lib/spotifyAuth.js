const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SCOPES = ["playlist-modify-public", "playlist-modify-private"];

export async function getAccesstoken() {
    console.log("getAccessToken called", { CLIENT_ID, REDIRECT_URI });
    return null;
}