# Jammming – Feature Design: Track Audio Previews

**Date:** September 08, 2025  
**Owner:** Jammming team  
**Status:** Implemented (v1)

---

## Objective
Enable users to play a short audio preview for tracks in **Search Results** so they can quickly decide which songs to add to their playlist, without leaving the app.

---

## Background
Spotify exposes a 30‑second `preview_url` on some tracks, but many tracks return `null` (licensing/region). Inline previews reduce context switching and help users decide faster.

User story:
- *As a listener, I want to tap ▶ on any result and hear a short preview so I can decide whether to add it to my playlist.*

---

## Technical Design
### Data shape
Extend mapped track:
```js
{ id, name, artist, album, uri, previewUrl /* from t.preview_url or fallback */ }
```

### Components & state
- **App.jsx**
  - `audioRef` (single `Audio`) so only one preview plays at a time.
  - `playingId` – id of the currently playing track.
  - `togglePreview(track)` – play/pause logic.
  - `ensurePreviewUrl(track)` – resolves a preview by trying, in order:
    1) existing `track.previewUrl`,
    2) `GET /v1/tracks/{id}` (sometimes provides `preview_url` when search didn’t),
    3) iTunes Search API fallback (GB, first result) to get a 30s `.m4a`.
  - Cache any discovered preview back into `searchResults`.

- **Tracklist.jsx**
  - Receives optional `onPreview` and `playingId`, passes to `Track`.

- **Track.jsx**
  - Adds ▶/⏸ button in the action cell; calls `onPreview(track)`.

### Requests
- Search: `GET /v1/search?q={query}&type=track&limit=10`
- Full track (on demand): `GET /v1/tracks/{id}`
- Fallback: `https://itunes.apple.com/search?term={artist+name}&media=music&entity=song&limit=1&country=GB`

### UI
- Results list shows ▶ for all rows; first click may fetch a preview.
- If none found, show a friendly alert; no crash.
- CSS: small action button group; pause icon while playing.

---

## Acceptance Criteria
- Clicking ▶ on a result **plays** a preview if available; clicking again **pauses**.
- Starting a different track stops the current one and plays the new track.
- If Spotify’s search item has no `preview_url`, the app **tries once** to resolve it via full-track fetch; if still missing, tries iTunes; otherwise informs the user.
- Only one preview plays at a time.
- No unhandled errors in Console during normal use.

---

## Risks / Caveats
- Many Spotify tracks truly have no preview.
- iTunes fallback may mismatch tracks/regions and introduces a 3rd‑party dependency.
- Respect iTunes TOS; do not cache audio beyond session needs.
- Mobile browsers require a user gesture to play audio (satisfied by the button click).

---

## Future Work
- Toast notifications instead of alerts; progress/progress ring.
- Add iTunes fallback for missing previews
- Feature flag to disable iTunes fallback for “Spotify‑only” mode.
- Unit tests mocking Spotify and iTunes responses.
