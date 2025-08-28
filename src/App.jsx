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
    { id: 99, name: "Seed song", artist: "Seed artist", album: "Seed album" }]);
  const [term, setTerm] = useState("");

// Function to add or remove tracks from the playlist
  function addTrack(track) {
    setPlaylistTracks((prev) =>
    prev.some((t) => t.id === track.id) ? prev : [...prev, track]);
  }

  function removeTrack(track) {
  setPlaylistTracks((prev) => prev.filter((t) => t.id !== track.id));
}

//Function to save the playlist
  function savePlaylist() {
    alert(`(Mock) Saved ${playlistName} with ${playlistTracks.length} tracks.`);
  }

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
        />        
      </div>
      
      <button id="searchBtn">Search</button>
    </main>
  );
}
