# SFX Tool — Technical Spec

Authoritative description of the SFX Tool data model, file formats, synthesis pipelines, and persistence behavior.

- **Spec version:** `3.0` (see `SPEC_VERSION` in [`src/spec.ts`](src/spec.ts))
- **Tool version:** `3.0.0` (see `TOOL_VERSION`)
- **Sample rate:** 44100 Hz mono ([`src/dsp/types.ts`](src/dsp/types.ts))

This document tracks the source of truth in TypeScript. Anywhere this doc disagrees with the types in `src/`, the types win.

---

## 1. Modes

The tool supports three synthesis modes. A given sound (and its preset) belongs to exactly one mode; a stack can mix layers from any modes.

| Mode          | Trigger model                | Source files                                   |
| ------------- | ---------------------------- | ---------------------------------------------- |
| `percussive`  | One-shot, transient + body   | [`src/dsp/render.ts`](src/dsp/render.ts), [`src/dsp/impulse.ts`](src/dsp/impulse.ts), [`src/dsp/body.ts`](src/dsp/body.ts), [`src/dsp/envelope.ts`](src/dsp/envelope.ts) |
| `tonal`       | One-shot, oscillator + ADSR  | [`src/dsp/tonal/`](src/dsp/tonal/)             |
| `atmospheric` | Continuous, real-time graph  | [`src/dsp/atmospheric/`](src/dsp/atmospheric/) |

Per-mode UI state (preset, params, pattern, FX) is held independently and switching modes does not carry state across.

---

## 2. Data model

### 2.1 `SoundSpec`

`SoundSpec` is a discriminated union over `mode` (and `kind: 'sound'`). All variants share `version`, `kind`, `mode`, `preset`, `params`, and an optional `metadata`. Defined in [`src/spec.ts`](src/spec.ts).

```ts
type SoundSpec = PercussiveSpec | TonalSpec | AtmosphericSpec

interface PercussiveSpec  { version: '3.0'; kind: 'sound'; mode: 'percussive';  preset: PercussivePreset;  params: PercussiveParams;  pattern?: PatternConfig; metadata?: SpecMetadata }
interface TonalSpec       { version: '3.0'; kind: 'sound'; mode: 'tonal';       preset: TonalPreset;       params: TonalParams;       pattern?: PatternConfig; metadata?: SpecMetadata }
interface AtmosphericSpec { version: '3.0'; kind: 'sound'; mode: 'atmospheric'; preset: AtmosphericPreset; params: AtmosphericParams; duration_ms?: number;    metadata?: SpecMetadata }
```

- `preset` is a known preset key for the mode, or the literal `'custom'` when the params no longer match any preset's defaults.
- `pattern` is omitted when the pattern is the default (off/single-step). Atmospheric specs do not carry a pattern (continuous, not trigger-based); they may carry `duration_ms` as a render-time hint.
- `metadata.tool` and `metadata.tool_version` are written by the tool on save. `metadata.created` is set at first save; `metadata.modified` is updated on subsequent saves. Unknown metadata keys are preserved verbatim across round-trip.

### 2.2 `StackSpec`

A stack is an ordered set of layers, each referring to a sound. Layers can reference a library entry by ID (compact mode) or inline a full `SoundSpec` (flattened mode).

```ts
interface StackSpec {
  version: '3.0'
  kind: 'stack'
  layers: StackLayerSerialized[]
  pattern?: PatternConfig          // stack-level pattern, applied to the rendered mix
  metadata?: SpecMetadata
}

interface StackLayerSerialized {
  ref: string | SoundSpec          // library entry ID (compact) or inline spec (flattened)
  offset_ms: number                // start time within the stack
  gain: number                     // per-layer linear gain
  mute: boolean                    // persisted; `solo` is transient and not serialized
  pattern?: PatternConfig          // overrides the source's pattern in stack context
  duration_ms?: number             // required for atmospheric layers; ignored otherwise
}
```

The export mode (`reference` vs `flattened`) is a user setting persisted in UI state ([`src/storage/persistence.ts`](src/storage/persistence.ts)). Reference mode is compact and best for backup; flattened mode is self-contained and best for sharing.

### 2.3 Parameter types

#### Percussive — `PercussiveParams` ([`src/dsp/types.ts:60`](src/dsp/types.ts#L60))

| Field                  | Type                                | Range / values                       |
| ---------------------- | ----------------------------------- | ------------------------------------ |
| `noise_type`           | `'white' \| 'pink' \| 'brown'`      | —                                    |
| `impulse_duration_ms`  | number                              | implementation-defined               |
| `filter_type`          | `'highpass' \| 'bandpass' \| 'lowpass'` | —                                |
| `filter_freq_hz`       | number                              | audible range                        |
| `filter_q`             | number                              | resonance                            |
| `body_amount`          | number                              | 0–1                                  |
| `body_freq_hz`         | number                              | sine/triangle body pitch             |
| `body_decay_ms`        | number                              | body envelope decay                  |
| `body_waveform`        | `'sine' \| 'triangle'`              | —                                    |
| `decay_ms`             | number                              | overall decay                        |
| `decay_curve`          | number                              | exponential shape factor             |
| `gain`                 | number                              | 0–1 output                           |

#### Tonal — `TonalParams` ([`src/dsp/types.ts:12`](src/dsp/types.ts#L12))

Sources: dual oscillators (`osc_a_*`, `osc_b_*`) with detune, a sub-oscillator amount, and an optional noise layer. Each oscillator picks from `'sine' | 'triangle' | 'square' | 'saw'`; noise from `'none' | 'white' | 'pink' | 'brown'`.

Filter: one `highpass | bandpass | lowpass` with frequency, Q, and a dedicated envelope (`filter_env_amount` ±1, attack, decay).

Amp envelope: full ADSR (`amp_attack_ms`, `amp_decay_ms`, `amp_sustain` 0–1, `amp_release_ms`).

Pitch envelope: `pitch_env_amount_oct` (±2 oct), attack, decay.

LFO: rate (0.1–20 Hz), depth (0–1), shape (`sine | triangle | square`), target (`off | pitch | filter | amp`).

Output: `base_pitch_semitones` (slider ±24, edit ±48; 0 = A4 / 440 Hz, see `TONAL_BASE_FREQ_HZ`), `gain` 0–1.

#### Atmospheric — `AtmosphericParams` ([`src/dsp/atmospheric/types.ts:39`](src/dsp/atmospheric/types.ts#L39))

Sources: noise (`white | pink | brown | blue | violet | grey | off`) + up to 3 oscillators (`osc_count: 0..3`), each `sine | triangle` with detune.

Two parallel filters (`filter_a_*`, `filter_b_*`), each with type, freq, Q, and mix.

Slow envelope: shape (`ramp_up | ramp_down | hold_then_release | attack_hold_release`), duration (1–30 s), amount (±1), target (`off | amp | filter_a_freq | filter_b_freq`).

Two random walks (RW1/RW2) and two LFOs (LFO1/LFO2). Each modulator has rate, depth, smoothing/phase, and a target from:

```
ModulationTarget = 'off' | 'amp' | 'pitch' | 'filter_a_freq' | 'filter_a_q' | 'filter_b_freq' | 'filter_b_q'
```

Output: `base_pitch_semitones` (±48 typed), `gain` 0–1.

### 2.4 `PatternConfig` ([`src/dsp/pattern/types.ts`](src/dsp/pattern/types.ts))

```ts
interface PatternConfig {
  enabled: boolean
  steps: number              // 1-8
  interval_ms: number        // 20-500 slider; wider via direct edit
  pitch_offsets: number[]    // semitones, length === steps
  volume_decay: number       // 0-1; per-step gain multiplier from the previous step
  direction: 'forward' | 'reverse' | 'ping-pong'
}
```

`steps === 1` is a no-op regardless of `enabled`. `volume_decay === 1` means no per-step decay. Patterns are render-time only (offline) for percussive/tonal sources; they don't apply to atmospheric sources.

Named pattern templates live in [`src/presets-pattern.ts`](src/presets-pattern.ts) (Single, Double, Triple, Machine Gun, Octave Up, Major Arp, Minor Arp). `detectPatternPreset(config)` returns the matching template name or `null` (= "Custom").

### 2.5 `FXConfig` ([`src/dsp/fx/types.ts`](src/dsp/fx/types.ts))

Fixed signal order: `Distortion → Bitcrusher → Delay → Reverb → EQ`. Each section is independently toggleable; when all are disabled (`isFXBypassed`), the FX render path is skipped entirely.

| Section      | Fields                                                                  | Notes                                              |
| ------------ | ----------------------------------------------------------------------- | -------------------------------------------------- |
| `distortion` | `enabled`, `drive` 0–1, `curve: 'soft'|'hard'|'fold'`, `tone_hz` 100–12000, `mix` 0–1 | waveshaper                                         |
| `bitcrusher` | `enabled`, `bit_depth` 1–16, `sample_rate_div` 1–32, `mix` 0–1          | quantize + downsample                              |
| `delay`      | `enabled`, `time_ms` 1–2000, `feedback` 0–0.95, `feedback_filter_freq_hz` 200–12000, `mix` 0–1 | feedback runs through a LP filter                  |
| `reverb`     | `enabled`, `space`, `mix` 0–1, `pre_delay_ms` 0–100                     | `space ∈ small_room, hall, cathedral, plate, spring, ambient_pad` |
| `eq`         | `enabled`, `low_gain_db`, `low_mid_gain_db`, `high_mid_gain_db`, `high_gain_db` (each ±12) | low shelf 250 Hz, peaks 600 Hz / 3 kHz, high shelf 6 kHz |

FX is **per-mode** in the live UI: switching modes does not bring FX along. FX is **not** carried in `SoundSpec` v3.0 — it is a session-level setting. Library entries restore params/pattern but not the FX chain that was applied at audition.

### 2.6 `LibraryEntry` ([`src/library/types.ts`](src/library/types.ts))

```ts
interface LibraryEntry {
  id: string
  name: string
  preset: string                  // preset key for sounds; '' or 'stack' for stacks
  spec: Spec                      // SoundSpec | StackSpec
  waveformBuffer: AudioBuffer | null  // transient cache, not persisted
  folderId?: string               // undefined = "Unfiled"
  createdAt: string               // ISO 8601
  modifiedAt: string
}

interface Folder { id: string; name: string; expanded: boolean }
interface LibraryState { folders: Folder[]; entries: LibraryEntry[] }
```

`waveformBuffer` is regenerated on first audition after load. Folder expanded/collapsed state persists with the folder itself (no separate UI key).

---

## 3. File formats

### 3.1 `.sfx.json` — single sound or stack

A JSON document containing one `Spec` (sound or stack). Examples in [`presets/`](presets/). Sounds carrying a non-default `pattern` include it inline. Stacks carry their layer list with refs (compact) or inline `SoundSpec`s (flattened) per the user's export setting.

### 3.2 Library `.zip` — full backup ([`src/library/zipExport.ts`](src/library/zipExport.ts))

Layout:

```
manifest.json
sounds/<safe-name>.sfx.json
sounds/<safe-name>_2.sfx.json
stacks/<safe-name>.sfx.json
...
```

`manifest.json` shape:

```ts
{
  version: '2.0',
  exported: ISO8601,
  tool: 'sfx-tool',
  tool_version: '3.0.0',
  folders: [{ id, name, order }],
  entries: [{ id, name, folder?, kind, filename, created, modified }]
}
```

Filenames are sanitized (`[^a-zA-Z0-9._-]` → `_`) and disambiguated with numeric suffixes on collision. Stacks in flattened export embed any referenced sounds inline so the zip is self-contained even if some sources aren't separate library entries.

### 3.3 Spec parsing & migration ([`src/spec.ts`](src/spec.ts) `parseSpec`)

- **Strict** about structure: missing/invalid `version`, unsupported `kind`, missing `mode`, or wrong type for `params` is a `SpecParseError`.
- **Permissive** about values: out-of-range numerics are clamped, unknown enum values fall back to defaults, and each non-fatal issue is collected into `warnings`.
- **v1 backward-compat:** specs with a `version` starting `1.` and no `kind` are accepted as `kind: 'sound'` and migrated to `3.0` on the next save.
- Round-trip preserves unknown `metadata` fields verbatim.

---

## 4. Synthesis pipelines

### 4.1 Percussive

Offline render via `OfflineAudioContext`. Pipeline: noise impulse → biquad filter → mixed with body sine/triangle (pitched + decaying) → amp envelope → DC offset removal → linear gain. Lowpass impulses on non-brown noise get a 3× pre-filter boost so heavy presets read as weighty rather than as a low "bop" (see `LOWPASS_IMPULSE_BOOST` in [`src/dsp/render.ts`](src/dsp/render.ts)).

Buffer length = `decay_ms + 50` (tail).

### 4.2 Tonal

Offline render via `OfflineAudioContext`. Pipeline:

1. **Sources** — `osc_a` + `osc_b` (with detune) + `sub` (one octave below A) + optional noise layer.
2. **Filter** — biquad (`lowpass | highpass | bandpass`) with envelope-modulated cutoff (`filter_env_amount` ±1 over attack/decay).
3. **Pitch envelope** — `pitch_env_amount_oct` ±2 octaves over attack/decay applied to all oscillator frequencies.
4. **LFO** — applied to one of `pitch | filter | amp` (or off).
5. **Amp ADSR** — full ADSR; release time bounds the total render length.
6. **Output gain** — final 0–1 scalar.

Base pitch is `TONAL_BASE_FREQ_HZ * 2^(base_pitch_semitones / 12)`.

### 4.3 Atmospheric

Real-time graph for live audition; offline render for export ([`src/dsp/atmospheric/realtime.ts`](src/dsp/atmospheric/realtime.ts), [`src/dsp/atmospheric/offline.ts`](src/dsp/atmospheric/offline.ts), [`src/dsp/atmospheric/graph.ts`](src/dsp/atmospheric/graph.ts)).

Graph topology:

```
[noise, osc_a, osc_b, osc_c]
         │
         ├─→ filter_a (mix_a)
         └─→ filter_b (mix_b)
                │
                ├─ slow_env  → amp / filter freqs
                ├─ rw1, rw2  → ModulationTarget
                ├─ lfo1, lfo2 → ModulationTarget
                └─ output_gain
```

Modulators are summed at their target. Live updates (`session.applyParams`) reconfigure the running graph in place — the user can sweep params while listening.

### 4.4 Pattern engine (percussive + tonal only)

For each step `i` in `[0, steps)` (or reversed / ping-pong), the source is rendered at `pitch_offset[i]` and scaled by `volume_decay^i` (relative to step 0), then summed at `i * interval_ms` into the output buffer. Pattern length adds `(steps - 1) * interval_ms` to the source's natural decay length.

Per-stack-layer patterns override the source's pattern. Stack-level patterns apply to the full rendered mix.

### 4.5 Stack render

Each layer is rendered through its (possibly overridden) pattern, then placed at `offset_ms` and summed into a stereo buffer with per-layer `gain`. Mute/solo are applied at mix time. Atmospheric layers honor `duration_ms` (required); other layers use their natural decay.

---

## 5. Foraging

Each preset declares `defaults` and a `ranges` map ([`src/presets.ts`](src/presets.ts), [`src/presets-tonal.ts`](src/presets-tonal.ts), [`src/presets-atmospheric.ts`](src/presets-atmospheric.ts)):

```ts
ranges: {
  [K in keyof Params]?: RangeFor<Params[K]>
}
type RangeFor<T> = [T] extends [number] ? [number, number] : readonly T[]
```

- Numeric param → `[min, max]`
- Categorical param → array of allowed values (length 1 = effectively fixed)
- Param absent from `ranges` → fixed at the preset's default (treated as part of the preset's identity, not variable)

**Randomize** ([`src/foraging.ts`](src/foraging.ts), `*-tonal.ts`, `*-atmospheric.ts`): uniform sample within ranges.

**Mutate**: Gaussian perturbation around current values with stddev = 5% / 15% / 30% of each numeric range's width for distance `S` / `M` / `L`. Categorical params are not mutated, preserving the preset's character.

A preset may also ship optional `pattern` and `fx` fields ([`TonalPresetDefinition`](src/presets-tonal.ts), [`PresetDefinition`](src/presets.ts), [`AtmosphericPresetDefinition`](src/presets-atmospheric.ts)). When defined, selecting the preset applies them; when absent, selection resets pattern/FX to defaults.

---

## 6. Persistence

Storage key: `sfx-tool:state:v2` ([`src/storage/persistence.ts`](src/storage/persistence.ts)). Writes are debounced (`DEBOUNCE_MS = 400`).

```ts
interface PersistedShape {
  version: '2.0'
  folders: Folder[]
  entries: PersistedEntry[]      // LibraryEntry minus waveformBuffer
  ui?: PersistedUiState
}

interface PersistedUiState {
  currentMode: 'percussive' | 'tonal' | 'atmospheric'
  autoPlayOnChange: boolean
  mutateDistance: 'S' | 'M' | 'L'
  jsonExportMode: 'reference' | 'flattened'
}
```

Per-mode current sound (preset/params/pattern/FX) is **not** persisted — first run starts each mode at its default preset.

---

## 7. UI semantics

- **TRIGGER PLAYS source/stack** — the trigger button either renders & plays the current parameter-panel sound or the current stack composition. Toggle: `⌘⇧T`.
- **Auto-play on change** — when on, parameter edits immediately re-render and play. Persisted.
- **Selection model** — the parameter panel and preset rail follow the "current sound" for the active mode. Selecting a library entry sets the current sound to that entry; selecting a preset replaces the current sound's params (and pattern/FX if the preset ships them).

Atmospheric mode plays continuously via a real-time graph; the TRIGGER button toggles play/stop instead of one-shot triggering. Saving an atmospheric sound currently bakes a fixed `DEFAULT_ATMO_DURATION_S = 5` render (export-dialog UI for variable duration is on the roadmap; the persisted spec already accepts `duration_ms`).

---

## 8. Versioning & compatibility

- Spec format **major** changes (`3.0 → 4.0`) imply breaking schema shifts and require an explicit migration in `parseSpec`.
- Spec format **minor** changes (e.g. `3.0 → 3.1`) add optional fields and are forward-compatible: older code ignores unknown fields.
- Tool version (`tool_version` in metadata) is informational and helps debug provenance issues.
- Library zip manifest version is independent of spec version; it currently sits at `2.0`.

v1 specs (no `kind`, `version` starts with `1.`) remain readable indefinitely. They are migrated to `3.0` on next save.

---

## 9. Source-of-truth pointers

| Topic                          | File                                                       |
| ------------------------------ | ---------------------------------------------------------- |
| Spec types & parsing           | [`src/spec.ts`](src/spec.ts)                               |
| Percussive params              | [`src/dsp/types.ts`](src/dsp/types.ts)                     |
| Tonal params                   | [`src/dsp/types.ts`](src/dsp/types.ts)                     |
| Atmospheric params             | [`src/dsp/atmospheric/types.ts`](src/dsp/atmospheric/types.ts) |
| Pattern types                  | [`src/dsp/pattern/types.ts`](src/dsp/pattern/types.ts)     |
| FX types                       | [`src/dsp/fx/types.ts`](src/dsp/fx/types.ts)               |
| Stack types                    | [`src/stack/types.ts`](src/stack/types.ts)                 |
| Library types                  | [`src/library/types.ts`](src/library/types.ts)             |
| Persistence                    | [`src/storage/persistence.ts`](src/storage/persistence.ts) |
| Library zip export/import      | [`src/library/zipExport.ts`](src/library/zipExport.ts), [`src/library/zipImport.ts`](src/library/zipImport.ts) |
| Percussive render              | [`src/dsp/render.ts`](src/dsp/render.ts)                   |
| Tonal render                   | [`src/dsp/tonal/render.ts`](src/dsp/tonal/render.ts)       |
| Atmospheric realtime / offline | [`src/dsp/atmospheric/realtime.ts`](src/dsp/atmospheric/realtime.ts), [`src/dsp/atmospheric/offline.ts`](src/dsp/atmospheric/offline.ts) |
| Stack render                   | [`src/stack/stackRender.ts`](src/stack/stackRender.ts)     |
| Preset definitions             | [`src/presets.ts`](src/presets.ts), [`src/presets-tonal.ts`](src/presets-tonal.ts), [`src/presets-atmospheric.ts`](src/presets-atmospheric.ts) |
| Pattern templates              | [`src/presets-pattern.ts`](src/presets-pattern.ts)         |
| Foraging logic                 | [`src/foraging.ts`](src/foraging.ts), [`src/foraging-tonal.ts`](src/foraging-tonal.ts), [`src/foraging-atmospheric.ts`](src/foraging-atmospheric.ts) |
| Keyboard shortcuts             | [`src/useKeyboardShortcuts.ts`](src/useKeyboardShortcuts.ts) |
