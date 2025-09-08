import Tracklist from "./Tracklist.jsx";

export default function Playlist({ playlistName, onNameChange, tracks, onSave, onRemove, isRemoval = false, isSaving = false }) {
  return (
    <div>
        <h2>Playlist</h2>

        <input
            className="playlist-name-input"
            value={playlistName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="New Playlist Name"
        />
        <Tracklist tracks={tracks} onRemove={onRemove} isRemoval />

        <button className="save-btn" onClick={onSave} disabled={!tracks.length || isSaving}>
          {isSaving ? "Saving..." : "Save to Spotify"}
          </button>
        
    </div>
  );
}