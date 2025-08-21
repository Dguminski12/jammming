import { useState } from "react";
import Track from "./components/Track.jsx";
import TrackList from "./components/Tracklist.jsx";

export default function App() {
  const [searchResults, setSearchResults] = useState([
    { id: 1, name: "Song A", artist: "Artist A", album: "Album A" },
    { id: 2, name: "Song B", artist: "Artist B", album: "Album B" },
    { id: 3, name: "Song C", artist: "Artist C", album: "Album C" }
  ]);

  const [playlistName, setPlaylistName] = useState("My Playlist");
  const [playlistTracks, setPlaylistTracks] = useState([
    { id: 99, name: "Seed song", artist: "Seed artist", album: "Seed album" }
  ]);
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Jammming</h1>
      <p>Search Spotify, build a playlist, save to your account.</p>
      <div id="trackListDiv">
        <TrackList tracks={searchResults} />
      </div>
      <div id="playlistDiv">
        <h2>Playlist</h2>
        <input
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          placeholder="New Playlist Name"
        />
        <TrackList tracks={playlistTracks} />
      </div>
      <button id="saveBtn">Save to Spotify</button>
      <button id="searchBtn">Search</button>
    </main>
  );
}
