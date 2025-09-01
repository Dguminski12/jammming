# Jammming — Manual Test Plan

> Keep DevTools **Console** and **Network** open while testing.  
> Run tests top-to-bottom once, then re-run the “happy path” after fixes.

---

## 0) Setup & Reset (once per session)

### Do
- `npm run dev` (open the URL that matches your Redirect URI exactly)
- Clear stale auth in Console:
  ```js
  localStorage.removeItem("access_token");
  localStorage.removeItem("expires_at");
  sessionStorage.removeItem("spotify_pkce_verifier");
  sessionStorage.removeItem("spotify_auth_state");
  ```

### Expect
- App shows Title, Search UI, Results, and Playlist sections.

### If not
- Fix the **first** Console error (often a mis-capitalized filename/import).

---

## 1) Authentication (PKCE)

### Do
- Click **Connect Spotify** → approve → return to the app.
- Click **Connect Spotify** again.

### Expect
- First click redirects to Spotify; second click logs a token or `[auth] localStorage hit`.
- No `/api/token` request on the second click (already cached).

### If not
- **Redirect mismatch (400)**: browser URL, `.env`, and Spotify app Redirect URI must match **exactly** (host, port, trailing slash).
- **Invalid client / missing env**: restart dev server so `.env` loads; verify Client ID.

---

## 2) Search (happy path)

### Do
- Type `tame impala` → press **Enter** or click **Search**.

### Expect
- Network: `GET /v1/search?type=track&q=tame%20impala&limit=10` → **200 OK**.
- ~10 rows render in **Results**; each row has Title / Artist / Album / **＋**.

### If not
- Add a one-time log after fetch:
  ```js
  console.log("sample", data?.tracks?.items?.[0]);
  ```
  - If defined → mapping to `{ id, name, artist, album, uri }` is wrong. Ensure:
    ```js
    const mapped = data.tracks.items.map(t => ({
      id: t.id,
      name: t.name,
      artist: t.artists?.[0]?.name ?? "Unknown",
      album: t.album?.name ?? "Unknown",
      uri: t.uri,
    }));
    setSearchResults(mapped);
    ```
  - If `undefined` → the request failed (check Network status & `Authorization` header).

---

## 3) Search (edge cases)

### Do
- Search `   ` (spaces), then `@@@`, then `the beatles`.

### Expect
- Empty/whitespace: does nothing.
- Nonsense term: “No results” message.
- Special chars: returns results (URL uses `encodeURIComponent`).

### If not
- Ensure:
  ```js
  const q = term.trim();
  if (!q) return;
  ```
- Add an empty state in `TrackList` when `tracks.length === 0`.

---

## 4) Results Rendering (Track / TrackList)

### Do
- Inspect one row in DevTools.

### Expect
- **Four columns**: Title / Artist / Album / Action.
- No React key warnings.

### If not
- Header/rows align with:
  ```css
  grid-template-columns: 2fr 1fr 1fr auto;
  ```
- Use stable keys:
  ```jsx
  key={t.id}
  ```

---

## 5) Add to Playlist

### Do
- Click **＋** on two different results; click **＋** again on the first.

### Expect
- Both tracks appear in **Playlist**; duplicates do **not** appear.

### If not
- Guard duplicates:
  ```js
  setPlaylistTracks(prev =>
    prev.some(t => t.id === track.id) ? prev : [...prev, track]
  );
  ```

---

## 6) Remove from Playlist

### Do
- Click **−** on the first playlist item; then on the last.

### Expect
- Items are removed immediately; no errors.

### If not
- Parent passes:
  ```jsx
  <TrackList tracks={playlistTracks} onRemove={removeTrack} isRemoval />
  ```
- Child shows minus only when `isRemoval`:
  ```jsx
  {isRemoval && onRemove && <button onClick={() => onRemove(track)}>−</button>}
  ```

---

## 7) Rename Playlist

### Do
- Edit the playlist name input.

### Expect
- Value updates instantly; no console errors.

### If not
- Props are wired:
  - App →  
    ```jsx
    <Playlist playlistName={playlistName} onNameChange={setPlaylistName} ... />
    ```
  - Playlist →  
    ```jsx
    function Playlist({ playlistName, onNameChange, ... }) {
      return <input value={playlistName} onChange={e => onNameChange(e.target.value)} />;
    }
    ```

---

## 8) Save Playlist (real API)

### Pre
- Playlist contains ≥1 track **with** a valid `uri`.

### Do
- Click **Save to Spotify**.

### Expect
- Button shows **Saving…** (disabled).
- Network sequence:
  1. `GET /v1/me` → **200**
  2. `POST /v1/users/{id}/playlists` → **201 Created**
  3. `POST /v1/playlists/{playlistId}/tracks` → **201 Created** (may repeat in chunks)
- Alert confirms; playlist clears; name resets.
- New playlist appears in Spotify (Library → Playlists).

### If not
- **401**: token stale → clear auth cache and reconnect:
  ```js
  localStorage.removeItem("access_token");
  localStorage.removeItem("expires_at");
  sessionStorage.removeItem("spotify_pkce_verifier");
  sessionStorage.removeItem("spotify_auth_state");
  ```
- **403 scope**: ensure scopes include
  ```js
  ["playlist-modify-public", "playlist-modify-private"]
  ```
  then reconnect.
- **400 invalid track uri**: log before save:
  ```js
  console.log(playlistTracks.map(t => t.uri));
  ```
  URIs must be `spotify:track:<id>`; fix your search mapping if missing.

---

## 9) Large Playlist (chunking)

### Do
- Add >100 URIs (for testing you can duplicate entries).
- Save.

### Expect
- Multiple `POST /tracks` calls (100 URIs per request), all **201**.
- All tracks appear in the created playlist.

### If not
- Ensure chunking:
  ```js
  for (let i = 0; i < uris.length; i += 100) {
    await spotifyFetch(`playlists/${playlistId}/tracks`, {
      method: "POST",
      body: JSON.stringify({ uris: uris.slice(i, i + 100) })
    });
  }
  ```

---

## 10) Token Expiry Flow

### Do
- Simulate expiry:
  ```js
  localStorage.setItem('expires_at', String(Date.now() - 1000));
  ```
- Try search or save again.

### Expect
- App re-runs auth (one redirect) and proceeds.

### If not
- In `getAccessToken`, localStorage branch must fall through to redirect when expired:
  ```js
  if (!(stored && Number(storedExpiry) && Date.now() < storedExpiry)) {
    // redirect path
  }
  ```

---

## 11) Error Handling (graceful fail)

### Do
- Temporarily remove a scope or break Redirect URI in Spotify dashboard, then connect/save.

### Expect
- Clear alert or console error for 400/403.
- UI remains usable; buttons re-enable.

### If not
- Wrap calls in `try/catch`:
  ```js
  try { /* ... */ } catch (e) {
    console.error(e); alert("Save failed: " + e.message);
  }
  ```

---

## 12) UI / UX States

### Do
- Try: empty search; saving while already saving; search with no results.

### Expect
- Search no-ops on empty term.
- Save button disabled during save (`isSaving`) and when empty.
- “No results” message appears appropriately.

### If not
- Add minimal conditional renders:
  ```jsx
  if (!tracks.length) return <p>No results yet.</p>;
  ```

---

## 13) Styling & Layout

### Do
- Resize window narrow and wide; try tracks with long titles/albums.

### Expect
- Titles/album text truncate; grid stays aligned.

### If not
- CSS:
  ```css
  .title, .album { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  ```

---

## 14) Keyboard & Accessibility

### Do
- Tab through controls; Enter to search; Space/Enter on **＋/−**.

### Expect
- Visible focus; actions work via keyboard.

### If not
- Use real `<button>`s; ensure inputs have placeholders/labels.

---

## 15) Regression (quick pass after changes)

### Do
- After refactor, run: **Connect → Search → Add → Remove → Save**.

### Expect
- No new warnings; happy path still passes.

---

## Bug Log Template

```
**Title:** <short summary>

**Steps to Reproduce**
1) …
2) …

**Expected**
…

**Actual**
…

**Console/Network**
(first error line or status codes)

**Fix**
…

**Re-test Result**
pass / fail
```
