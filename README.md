# SFX Tool

A foraging-style synth for authoring game sound effects in the browser. Three synthesis modes, multichannel stacks, render-time patterns, an FX chain, and a folder-organized library that persists in your browser.

Live: https://wednesdaywoe.github.io/SFX-Tool/

## Synthesis modes

Each mode has its own preset rail, parameter panel, and forage/mutate behavior. Switch modes with `⌘1` / `⌘2` / `⌘3`.

### Percussive — short impacts (clicks, taps, thuds, clanks)
Defined in [`src/presets.ts`](src/presets.ts).

| Preset  | Description                                                                |
| ------- | -------------------------------------------------------------------------- |
| Click   | Bright, snappy, transient-dominated. Prototypical UI click.                |
| Tick    | Very short, very bright, transient-only. Clock / checkbox.                 |
| Tap     | Softer, mid-range, slightly resonant. Finger on surface.                   |
| Pop     | Round, bubbly, body-dominated. Bubble bursting / boop.                     |
| Snap    | Sharp, fast, prominent transient. Finger snap / stick break.               |
| Impact  | Heavier, lower, resonance-dominated. Solid hits solid.                     |
| Thud    | Soft, low, dampened. Heavy on soft (book on carpet).                       |
| Clank   | Metallic, ringing, high-Q resonance. Metal-on-metal.                       |

### Tonal — pitched / sustained sounds
Defined in [`src/presets-tonal.ts`](src/presets-tonal.ts).

| Preset    | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| Laser     | Pitch-sweep aggressive sound — square+saw with downward sweep.           |
| Coin      | Bright pickup with tonal ring — triangle+sine, holds for ring.           |
| Beep      | Simple UI confirmation — sine, brief, fixed pitch.                       |
| Jump      | Upward pitch sweep with quick decay — platformer staple.                 |
| Whoosh    | Noise-dominated swept sound — BP filter sweep on noise.                  |
| Magic     | Ascending sparkly tone — relies on Pattern feature for the arpeggio.     |
| Electric  | Harsh modern synth — dual saw+square, sub, high-Q BP.                    |

### Atmospheric — continuous evolving textures
Defined in [`src/presets-atmospheric.ts`](src/presets-atmospheric.ts). Atmospheric mode plays live (no fixed length) until you stop it; export bakes a fixed-duration render.

| Preset           | Description                                                       |
| ---------------- | ----------------------------------------------------------------- |
| Wind             | Gusty, flowing — pink/brown noise with slow filter random walk.   |
| Rain             | White/pink noise with HP+BP filters — pattering density.          |
| Fire             | Crackling — pink/brown with fast + slow random walks.             |
| Ocean            | Brown noise with very slow filter LFO — wave rhythm.              |
| Drone            | 1–3 oscillators + light noise, slow RW filter, optional shimmer.  |
| Hum              | Mechanical low-frequency — sine/triangle, periodic Q LFO.         |
| Riser            | Building intensity — slow envelope on amp + filter.               |
| Sci-Fi Ambient   | Drone + shimmer — fast LFO/RW on a HP filter.                     |
| Glitch           | Wildcard — fast RWs at high depth, broken-electronic feel.        |

## Pattern feature

Render-time repeats and arpeggios. A pattern triggers the source sound N times (1–8 steps) with configurable per-step pitch offsets and per-step volume decay; direction can be forward, reverse, or ping-pong. Patterns can be authored per sound (in the Tonal/Percussive Pattern panel) or per stack layer (overriding the source's pattern). Some presets ship with a default pattern (e.g. Coin's three-step arpeggio, Magic's eight-step).

Named pattern templates ([`src/presets-pattern.ts`](src/presets-pattern.ts)): Single, Double, Triple, Machine Gun, Octave Up, Major Arp, Minor Arp.

Toggle on/off with `⌘P`.

## Stack feature

Multichannel layer composition for building richer sounds out of multiple library entries. Defined in [`src/stack/`](src/stack/).

- Drag a sound from the Library onto the Stack Timeline or Stack Roster to add a layer.
- Drag a layer block horizontally to adjust its time offset; drag the amber strip on top vertically for gain.
- Per-layer mute/solo, optional pattern override, and (for atmospheric layers) per-layer duration.
- Stack-level pattern clips all layers together.
- Toggle whether the TRIGGER button plays the source sound or the stack composition with `⌘⇧T`.

Selected-layer keyboard nudges:

| Keys           | Action                       |
| -------------- | ---------------------------- |
| `←` / `→`      | Offset ±1 ms                 |
| `⇧←` / `⇧→`    | Offset ±10 ms                |
| `↑` / `↓`      | Gain ±0.05                   |
| `M`            | Toggle mute                  |
| `S`            | Toggle solo                  |
| `Del`          | Remove layer                 |

## FX chain

Each mode owns its own FX state — switching modes doesn't carry effects from one synth context to another. Fixed signal order: **Distortion → Bitcrusher → Delay → Reverb → EQ**. Defined in [`src/dsp/fx/types.ts`](src/dsp/fx/types.ts).

1. **Distortion** — drive (0–1), curve (soft / hard / fold), tone (100–12 kHz), mix.
2. **Bitcrusher** — bit depth (1–16), sample-rate divisor (1–32), mix.
3. **Delay** — time (1–2000 ms), feedback (0–0.95), feedback filter (200–12 kHz), mix.
4. **Reverb** — space (small_room, hall, cathedral, plate, spring, ambient_pad), pre-delay (0–100 ms), mix.
5. **EQ** — four-band: low shelf @ 250 Hz, low-mid peak @ 600 Hz, high-mid peak @ 3 kHz, high shelf @ 6 kHz, each ±12 dB.

## Forage / Mutate / Randomize

Each preset defines parameter **ranges** (numeric bounds and categorical choices) that scope exploration. Implemented in [`src/foraging.ts`](src/foraging.ts), [`src/foraging-tonal.ts`](src/foraging-tonal.ts), [`src/foraging-atmospheric.ts`](src/foraging-atmospheric.ts).

- **Randomize** (`R`) — uniformly samples within the current preset's ranges. Big jumps, but stays in-character for the preset.
- **Mutate** (`M`) — Gaussian perturbation around current values. Distance S/M/L (≈ 5%/15%/30% of each range's width). Numeric params only; categorical params stay fixed to preserve the preset's identity.

## Library

Browser-`localStorage` persisted ([`src/storage/persistence.ts`](src/storage/persistence.ts)), auto-saving. Folder-organized, drag-and-drop reordering, per-entry context actions:

- **Recall** — load the entry's params into the parameter panel.
- **Audition** — play the entry without recalling it.
- **Export JSON** — single-entry `.sfx.json`.
- **Rename / Delete** — entries; deleted folders move their entries to Unfiled.

Library backup/restore via the Settings modal: export everything as a `.zip` (manifest + sounds + stacks + folder metadata), import a `.zip` to restore.

## Export formats

- **WAV** — `⌘E`. Offline render, 16-bit PCM, 44.1 kHz.
- **JSON spec** — `⌘⇧E`. Versioned `.sfx.json` containing mode, preset, params, optional pattern, and metadata. Stacks export with each layer either as a reference (library entry ID) or flattened inline (configurable in Settings).
- **Library ZIP** — full backup with manifest, sounds, stacks, and folder structure ([`src/library/zipExport.ts`](src/library/zipExport.ts)).

## Keyboard shortcuts

Defined in [`src/useKeyboardShortcuts.ts`](src/useKeyboardShortcuts.ts). All shortcuts are also listed in the in-app About modal (`?` icon, top right).

| Keys          | Action                                                |
| ------------- | ----------------------------------------------------- |
| `Space`       | Trigger current sound or stack                        |
| `R`           | Randomize within current preset                       |
| `M`           | Mutate (current distance)                             |
| `S`           | Save current sound or stack to library                |
| `1`–`8`       | Select preset 1 through 8                             |
| `⌘1` / `⌘2` / `⌘3` | Switch to Percussive / Tonal / Atmospheric mode |
| `⌘P`          | Toggle pattern on/off                                 |
| `⌘⇧T`         | Toggle TRIGGER PLAYS between source and stack         |
| `⌘E`          | Export WAV                                            |
| `⌘⇧E`         | Export JSON spec                                      |

## Tech stack

React 19, Vite 8, TypeScript 6, Tailwind 4, jszip. Synthesis and rendering use the Web Audio API; persistence uses `localStorage`. Hosted on GitHub Pages.

## Development

```sh
npm install
npm run dev      # local dev server
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
```

Pushes to `main` deploy automatically via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
