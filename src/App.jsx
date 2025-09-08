import { useState, useRef, useEffect } from "react";
import Tracklist from "./components/Tracklist.jsx";
import Playlist from "./components/Playlist.jsx";
import { getAccessToken } from "./lib/spotifyAuth.js";
import { spotifyFetch } from "./lib/spotifyAuth.js";

export default function App() {
  //Sample search result data
  const [searchResults, setSearchResults] = useState([]);
  //Sample Playlist data
  const [playlistName, setPlaylistName] = useState("My Playlist");
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [term, setTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  //Audio ref for track previews
  const audioRef = useRef(null);
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    const onEnded = () => setPlayingId(null);
    audioRef.current.addEventListener("ended", onEnded);
    return () => audioRef.current?.removeEventListener("ended", onEnded);
  }, []);

  function togglePreview(track) {
    if (!track.previewUrl) return;
    const audio  = audioRef.current ?? (audioRef.current = new Audio());

    if (playingId === track.id) {
      audio.pause();
      setPlayingId(null);
      return;
    }

    try {
      audio.pause();
      audio.src = track.previewUrl;
      audio.currentTime = 0;
      audio.play()
        .then(() => setPlayingId(track.id))
        .catch(err => {console.log("Error playing preview:", err); setPlayingId(null);});
    } catch (err) {
      console.error("Error with audio playback:", err);
    }
  }

// Function to add or remove tracks from the playlist
  function addTrack(track) {
  setPlaylistTracks(prev => {
    if (prev.some(t => t.id === track.id)) return prev;
    const withUri = track.uri ? track : { ...track, uri: `spotify:track:${track.id}` }; // fallback for mock items
    return [...prev, withUri];
  });
}

  function removeTrack(track) {
  setPlaylistTracks((prev) => prev.filter((t) => t.id !== track.id));
}

//Function to save the playlist
  async function savePlaylist() {
    //Collect URIs of tracks to save
    const uris = playlistTracks.map(t => t.uri).filter(Boolean);
    if (!uris.length) {
      alert("Your playlist is empty!");
      return;
    }
    
    setIsSaving(true);
    try {
      //Determine user ID
      const me = await spotifyFetch("me");
      const userId = me.id;

      //Create the playlist
      const playlist = await spotifyFetch(`users/${userId}/playlists`, {
        method: "POST",
        body: JSON.stringify({
          name: playlistName || "New Playlist",
          public: false,
          description: "Created with Jammming"
        })
    });
    const playlistId = playlist.id;
    
    //Add tracks to the playlist
    for (let i = 0; i < uris.length; i += 100) {
      const chunk = uris.slice(i, i + 100);
      await spotifyFetch(`playlists/${playlistId}/tracks`, {
        method: "POST",
        body: JSON.stringify({ uris: chunk })
      });
    }
    //Reset playlist
    alert(`Saved playlist "${playlistName}" with ${uris.length} tracks to your Spotify account!`);
    setPlaylistName("New Playlist");
    setPlaylistTracks([]);
  } catch (err) {
    console.error("Error saving playlist:", err);
  } finally {
    setIsSaving(false);
  }
  }
  
  async function handleSearch() {
    const q = term.trim();
    if (!q) return;

    try {
      const data = await spotifyFetch(`search?type=track&q=${encodeURIComponent(q)}&type=track&market=from_token&limit=20`);
      const items = data.tracks?.items ?? [];
      const results = items.map(t => ({
        id: t.id,
        name: t.name,
        artist: t.artists?.[0]?.name ?? "Unknown Artist",
        album: t.album?.name ?? "Unknown Album",
        uri: t.uri,
        previewUrl: t.preview_url,
      }));
    setSearchResults(results);
    console.log(`Got ${results.length} tracks foor "${q}"`, results);
    } catch (err) {
      console.error("Error searching tracks:", err);
    };
  };

  return (
    <div className="app">
      <main className="container">
        <h1 className="title">Jammming</h1>
        <p className="subtitle">Search Spotify, build a playlist, save to your account.</p>

        <div className="actions">
          <button className="button" onClick={async () => {
            const token = await getAccessToken();
            console.log("Access Token:", token);
          }}>
            Connect Spotify
          </button>
          <form className="search-form" onSubmit={e => { e.preventDefault(); handleSearch(); }}>
            <input
              className="input"
              value={term}
              onChange={e => setTerm(e.target.value)}
              placeholder="Search songs or artists..."
            />
            <button className="button" type="submit">Search</button>
          </form>
        </div>

        <div className="grid">
          <div className="panel">
            <h2>Results</h2>
            <Tracklist 
              tracks={searchResults}
              onAdd={addTrack}
              onPreview={togglePreview}
              playingId={playingId} />
          </div>
          <div className="panel">
            <Playlist
              playlistName={playlistName}
              onNameChange={setPlaylistName}
              tracks={playlistTracks}
              onRemove={removeTrack}
              onSave={savePlaylist}
              isSaving={isSaving}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
