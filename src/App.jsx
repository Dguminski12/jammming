import { useState } from "react";
import Tracklist from "./components/Tracklist.jsx";
import Playlist from "./components/Playlist.jsx";
import { getAccessToken } from "./lib/spotifyAuth.js";
import { spotifyFetch } from "./lib/spotifyAuth.js";

export default function App() {
  //Sample search result data
  const [searchResults, setSearchResults] = useState([
    { id: 1, name: "Song A", artist: "Artist A", album: "Album A" },
    { id: 2, name: "Song B", artist: "Artist B", album: "Album B" },
    { id: 3, name: "Song C", artist: "Artist C", album: "Album C" }
  ]);
  //Sample Playlist data
  const [playlistName, setPlaylistName] = useState("My Playlist");
  const [playlistTracks, setPlaylistTracks] = useState([
    { id: 99, name: "Seed song", artist: "Seed artist", album: "Seed album", uri: "spotify:track:3n3Ppam7vgaVa1iaRUc9Lp" }]);
  const [term, setTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
      const data = await spotifyFetch(`search?type=track&q=${encodeURIComponent(q)}&type=track&limit=10`);
      const items = data.tracks?.items ?? [];
      const results = items.map(t => ({
        id: t.id,
        name: t.name,
        artist: t.artists?.[0]?.name ?? "Unknown Artist",
        album: t.album?.name ?? "Unknown Album",
        uri: t.uri,
      }));
    setSearchResults(results);
    console.log(`Got ${results.length} tracks foor "${q}"`, results);
    } catch (err) {
      console.error("Error searching tracks:", err);
    };
  };

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Jammming</h1>
      <p>Search Spotify, build a playlist, save to your account.</p>

      <button onClick= {async () => {
        const token = await getAccessToken();
        console.log("Access Token:", token);
      }}>
        Connect Spotify
        </button>

      <div>
        <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search songs or artists..." />
        <button type="button" onClick={handleSearch}>Search</button>
      </div>

      <div id="trackListDiv">
        <h1>Results</h1>
        <Tracklist tracks={searchResults} onAdd={addTrack} />
      </div>

      <div id="playlistDiv">
        <Playlist
            playlistName={playlistName}
            onNameChange={setPlaylistName}
            tracks={playlistTracks}
            onRemove={removeTrack}
            onSave={savePlaylist}
            isSaving={isSaving}
        />        
      </div>
      
      <button id="searchBtn">Search</button>
    </main>
  );
}
