# SPIKE — iOS Audio Anchor Proof

**Status:** throwaway. Delete `public/spike-audio.html` and this file when M1 lands.

**Purpose:** prove the three iOS-specific audio patterns in `appspec.md` work on a real iPhone before committing to the full Vue 3 / Vite / Tailwind stack:

1. **§8.3** — `AudioContext.createMediaStreamDestination()` → hidden `<audio srcObject>` anchor
2. **§8.6** — synchronous `AudioContext.resume()` inside a user-gesture handler
3. **§8.4** — `navigator.mediaSession.metadata` populating the lock-screen Now Playing card
4. **§8.2** — `navigator.audioSession.type = "playback"` bypassing the silent switch
5. **§8.1** — `visibilitychange` handler re-resuming the context after foreground

## Run it

### Option A — local dev server (recommended)

```sh
cd ~/GitHub/jaybodecode/binaural-therapy
npm run dev
# open http://localhost:5173/spike-audio.html
```

Vite serves `public/` at the site root, so the URL is `/spike-audio.html`.

### Option B — open the file directly

`public/spike-audio.html` is fully self-contained. You can open it with `file://` in Safari, **but** Safari blocks some features on `file://` (e.g. Service Workers, in some versions). For the most realistic iOS test use Option A over your local network, or deploy to GH Pages and test against the real URL.

## Test on iPhone

1. **Add to Home Screen.**
   - Open the spike URL in iOS Safari.
   - Tap the Share button → "Add to Home Screen".
   - Open the app from the Home Screen (not Safari tab) — this is the path where background audio matters.

2. **Tap "Start (unlock + anchor)".**
   - The Live Status block should show all green pills:
     - AudioContext state: `running`
     - audioSession.type: `available`
     - anchor.played: `playing`
     - mediaSession.title: `Binaural Therapy — Spike`
   - The Event Log shows:
     - `AudioContext resumed → state: running`
     - `navigator.audioSession.type = "playback" set`
     - `<audio> anchor is playing (iOS will keep us alive in bg)`

3. **Tap "Play binaural".**
   - You hear a soft delta-beat pulsing in headphones.
   - Defaults: 200 Hz carrier, 2 Hz beat Δf, gain 0.15.
   - Sweep the carrier slider — frequency changes should glide, not click.

4. **Lock the screen.**
   - Audio should continue for ≥10 seconds without dropping.
   - Pull down Control Center or wake the lock screen.
   - You should see a "Now Playing" card titled "Binaural Therapy — Spike".
   - The AudioContext state in the Live Status block should briefly show `suspended` or `interrupted`, then `running` when you unlock.

5. **Flip the hardware Ring/Silent switch to silent.**
   - Audio should still be audible. If it mutes, `navigator.audioSession.type = "playback"` did not take effect — your iOS version may be < 16.4.

6. **Pause from the lock screen / Control Center.**
   - Use the on-lock-screen Pause button. Audio stops.
   - Wait 30+ seconds.
   - Press Play from the lock screen.
   - **If audio does not resume:** you've hit the Apple Forums 762582 PWA pause/play freeze (appspec §8.4). Document the iOS version + device and we'll decide whether to wrap with Capacitor.

7. **Swipe-away test.**
   - Swipe the app up from the app switcher.
   - Re-tap the Home Screen icon.
   - The visibilitychange handler should re-resume the context. Live Status shows `suspended` → `running`.

## What to record for the next session

After testing, write down:

- Device model + iOS version (Settings → General → About)
- Did audio survive screen lock? (yes/no, how long)
- Did the Now Playing card appear? (yes/no)
- Did silent switch bypass work? (yes/no)
- Did the 30s pause/play test pass? (yes/no, or hit bug 762582)
- Did the swipe-away + re-tap test pass? (yes/no)
- Any errors in the Event Log

These answers drive the decisions in `appspec.md §16` (open questions) and may push us toward a Capacitor wrapper (post-M5).

## Cleanup

When M1 ships, delete:

```sh
rm public/spike-audio.html SPIKE.md
```

The M0 scaffold in `appspec.md §15` is the milestone we keep.
