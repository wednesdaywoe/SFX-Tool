import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AuditionRow } from './components/regions/AuditionRow'
import type { TriggerSource } from './components/regions/AuditionRow'
import {
  startAtmosphericPlayback,
  type AtmosphericSession,
} from './dsp/atmospheric/realtime'
import { renderAtmosphericOffline } from './dsp/atmospheric/offline'
import type { AtmosphericParams } from './dsp/atmospheric/types'
import { applyFXToBuffer } from './dsp/fx/fxChain'
import { DEFAULT_FX_CONFIG, type FXConfig } from './dsp/fx/types'
import {
  ATMOSPHERIC_PRESETS,
  ATMOSPHERIC_PRESET_ORDER,
  type AtmosphericPresetKey,
} from './presets-atmospheric'
import {
  mutateAtmosphericPreset,
  randomizeAtmosphericPreset,
} from './foraging-atmospheric'
import { ParameterPanel } from './components/regions/ParameterPanel'
import { PresetRail } from './components/regions/PresetRail'
import type { PresetRailItem } from './components/regions/PresetRail'
import { Library } from './components/regions/Library'
import { StackRoster } from './components/regions/StackRoster'
import { TopBar } from './components/regions/TopBar'
import { AboutModal } from './components/regions/AboutModal'
import { SettingsModal } from './components/regions/SettingsModal'
import { renderFm } from './dsp/fm/render'
import { renderPercussive } from './dsp/render'
import { renderTonal } from './dsp/tonal/render'
import { applyPattern } from './dsp/pattern/applyPattern'
import { DEFAULT_PATTERN } from './dsp/pattern/types'
import type { PatternConfig } from './dsp/pattern/types'
import type { PercussiveParams, TonalParams } from './dsp/types'
import {
  mutateWithinPreset,
  randomizeWithinPreset,
} from './foraging'
import type { MutateDistance } from './foraging'
import {
  mutateTonalPreset,
  randomizeTonalPreset,
} from './foraging-tonal'
import { mutateFmPreset, randomizeFmPreset } from './foraging-fm'
import {
  addEntry,
  createFolder,
  deleteEntry,
  deleteFolder,
  moveEntryToFolder,
  renameEntry,
  renameFolder,
  toggleFolder,
  updateEntryBuffer,
} from './library/operations'
import type { LibraryEntry, LibraryState } from './library/types'
import { newId } from './library/types'
import { exportLibraryZip } from './library/zipExport'
import { importLibraryZip } from './library/zipImport'
import { PRESETS, PRESET_ORDER } from './presets'
import type { PresetKey } from './presets'
import { TONAL_PRESETS, TONAL_PRESET_ORDER } from './presets-tonal'
import type { TonalPresetKey } from './presets-tonal'
import { FM_PRESETS, FM_PRESET_ORDER } from './presets-fm'
import type { FmPresetKey } from './presets-fm'
import type { FmParams } from './dsp/fm/types'
import {
  serializeAtmosphericSpec,
  serializeFmSpec,
  serializePercussiveSpec,
  serializeStackSpec,
  serializeTonalSpec,
  type AtmosphericPreset as AtmosphericPresetSpec,
  type FmPreset as FmPresetSpec,
  type PercussivePreset,
  type Spec,
  type SoundSpec,
  type TonalPreset,
} from './spec'
import {
  addLayer,
  removeLayer,
  setLayerDuration,
  setLayerGain,
  setLayerOffset,
  setLayerPattern,
  setStackPattern,
  toggleMute,
  toggleSolo,
} from './stack/operations'
import { renderStack } from './stack/stackRender'
import type { Stack } from './stack/types'
import { EMPTY_STACK } from './stack/types'
import {
  clearState,
  loadState,
  scheduleSave,
  type JsonExportMode,
  type PersistedUiState,
} from './storage/persistence'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import { audioBufferToWav, downloadBlob } from './wav'

type Mode = 'percussive' | 'tonal' | 'fm' | 'atmospheric'

const AUTO_PLAY_DEBOUNCE_MS = 120
// Default duration when saving an atmospheric sound. Phase 6 will surface
// this in the export dialog and Settings; phase 5 just bakes the constant.
const DEFAULT_ATMO_DURATION_S = 5

const EMPTY_LIBRARY: LibraryState = { folders: [], entries: [] }

function App() {
  const initialState = useMemo(() => loadState(), [])

  const [mode, setMode] = useState<Mode>(
    initialState?.ui?.currentMode ?? 'tonal',
  )

  const [percussivePresetKey, setPercussivePresetKey] =
    useState<PresetKey>('click')
  const [percussiveParams, setPercussiveParams] = useState<PercussiveParams>(
    PRESETS.click.defaults,
  )
  const [tonalPresetKey, setTonalPresetKey] = useState<TonalPresetKey>('beep')
  const [tonalParams, setTonalParams] = useState<TonalParams>(
    TONAL_PRESETS.beep.defaults,
  )
  const [fmPresetKey, setFmPresetKey] = useState<FmPresetKey>('bell')
  const [fmParams, setFmParams] = useState<FmParams>(
    FM_PRESETS.bell.defaults,
  )
  const [percussivePattern, setPercussivePattern] =
    useState<PatternConfig>(DEFAULT_PATTERN)
  const [tonalPattern, setTonalPattern] = useState<PatternConfig>(
    DEFAULT_PATTERN,
  )
  const [atmosphericPresetKey, setAtmosphericPresetKey] =
    useState<AtmosphericPresetKey>('wind')
  const [atmosphericParams, setAtmosphericParams] = useState<AtmosphericParams>(
    ATMOSPHERIC_PRESETS.wind.defaults,
  )
  const [atmosphericPlaying, setAtmosphericPlaying] = useState(false)
  const atmosphericSessionRef = useRef<AtmosphericSession | null>(null)
  const [atmosphericAnalyser, setAtmosphericAnalyser] =
    useState<AnalyserNode | null>(null)

  // Per-mode FX state. Each mode owns its own FXConfig so switching modes
  // doesn't carry FX from one synth context into another (a heavy reverb
  // tuned for an atmospheric pad would clobber a percussive click).
  const [percussiveFX, setPercussiveFX] = useState<FXConfig>(DEFAULT_FX_CONFIG)
  const [tonalFX, setTonalFX] = useState<FXConfig>(DEFAULT_FX_CONFIG)
  const [fmFX, setFmFX] = useState<FXConfig>(DEFAULT_FX_CONFIG)
  const [atmosphericFX, setAtmosphericFX] = useState<FXConfig>(DEFAULT_FX_CONFIG)

  const [buffer, setBuffer] = useState<AudioBuffer | null>(null)
  const [bufferDurationMs, setBufferDurationMs] = useState<number>(0)
  const [bufferLabel, setBufferLabel] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [playheadProgress, setPlayheadProgress] = useState(0)
  const [mutateDistance, setMutateDistance] = useState<MutateDistance>(
    initialState?.ui?.mutateDistance ?? 'M',
  )

  const [library, setLibrary] = useState<LibraryState>(
    initialState?.library ?? EMPTY_LIBRARY,
  )
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)

  // Stack state. The active stack is session-only — saving creates a library
  // entry; the working stack persists in localStorage with the rest of state.
  const [stack, setStack] = useState<Stack>(EMPTY_STACK)
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [triggerSource, setTriggerSource] = useState<TriggerSource>('stack')

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [autoPlayOnChange, setAutoPlayOnChange] = useState(
    initialState?.ui?.autoPlayOnChange ?? true,
  )
  const [jsonExportMode, setJsonExportMode] = useState<JsonExportMode>(
    initialState?.ui?.jsonExportMode ?? 'reference',
  )

  const audioCtxRef = useRef<AudioContext | null>(null)
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const isFirstRenderRef = useRef(true)
  const rafRef = useRef<number | null>(null)

  function getAudioContext(): AudioContext {
    if (!audioCtxRef.current) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      audioCtxRef.current = new Ctor({ sampleRate: 44100 })
    }
    if (audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }

  function playBuffer(b: AudioBuffer) {
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop()
      } catch {
        // already stopped
      }
      activeSourceRef.current = null
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    const ctx = getAudioContext()
    const src = ctx.createBufferSource()
    src.buffer = b
    src.connect(ctx.destination)
    const startTime = ctx.currentTime
    src.start()
    activeSourceRef.current = src

    setIsPlaying(true)
    setPlayheadProgress(0)

    const tick = () => {
      if (activeSourceRef.current !== src) return
      const elapsed = ctx.currentTime - startTime
      const progress = Math.min(1, elapsed / b.duration)
      setPlayheadProgress(progress)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    src.onended = () => {
      if (activeSourceRef.current === src) {
        activeSourceRef.current = null
        setIsPlaying(false)
        setPlayheadProgress(0)
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
      }
    }
  }

  // Persistence (debounced). Stack state is session-only; not persisted in
  // phase 5 (could be added in phase 6).
  useEffect(() => {
    const ui: PersistedUiState = {
      currentMode: mode,
      autoPlayOnChange,
      mutateDistance,
      jsonExportMode,
    }
    scheduleSave(library, ui)
  }, [library, mode, autoPlayOnChange, mutateDistance, jsonExportMode])

  // Lazy buffer rendering for library entries (ports forward from phase 4)
  const renderEntryBuffer = useCallback(
    async (entry: LibraryEntry): Promise<AudioBuffer> => {
      let final: AudioBuffer
      if (entry.spec.kind === 'sound') {
        if (entry.spec.mode === 'atmospheric') {
          const dur =
            (entry.spec.duration_ms ?? DEFAULT_ATMO_DURATION_S * 1000) / 1000
          final = await renderAtmosphericOffline(entry.spec.params, dur)
        } else if (entry.spec.mode === 'fm') {
          // FM has no pattern field in v1 — render straight.
          final = await renderFm(entry.spec.params)
        } else {
          const synthesized =
            entry.spec.mode === 'percussive'
              ? await renderPercussive(entry.spec.params)
              : await renderTonal(entry.spec.params)
          final = entry.spec.pattern
            ? applyPattern(synthesized, entry.spec.pattern, getAudioContext())
            : synthesized
        }
      } else {
        // For stack entries, build a transient stack from layers and render.
        const transientStack: Stack = {
          layers: entry.spec.layers.map((l, i) => ({
            id: `tmp_${i}`,
            ref: l.ref,
            offset_ms: l.offset_ms,
            gain: l.gain,
            mute: l.mute,
            ...(l.pattern ? { pattern: l.pattern } : {}),
          })),
          ...(entry.spec.pattern ? { pattern: entry.spec.pattern } : {}),
        }
        final = await renderStack(
          transientStack,
          library.entries,
          getAudioContext(),
        )
      }
      setLibrary((prev) => updateEntryBuffer(prev, entry.id, final))
      return final
    },
    [library.entries],
  )

  useEffect(() => {
    const missing = library.entries.filter((e) => e.waveformBuffer === null)
    if (missing.length === 0) return
    let cancelled = false
    const next = missing[0]
    const id = window.setTimeout(() => {
      if (cancelled) return
      void renderEntryBuffer(next)
    }, 80)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [library.entries, renderEntryBuffer])

  // ----- Preset selection -----

  const handleSelectPreset = useCallback(
    (key: string) => {
      if (mode === 'percussive') {
        const k = key as PresetKey
        const def = PRESETS[k]
        if (!def) return
        setPercussivePresetKey(k)
        setPercussiveParams(def.defaults)
        setPercussivePattern(
          def.pattern
            ? { ...def.pattern, pitch_offsets: [...def.pattern.pitch_offsets], enabled: true }
            : DEFAULT_PATTERN,
        )
        setPercussiveFX(def.fx ?? DEFAULT_FX_CONFIG)
      } else if (mode === 'tonal') {
        const k = key as TonalPresetKey
        const def = TONAL_PRESETS[k]
        if (!def) return
        setTonalPresetKey(k)
        setTonalParams(def.defaults)
        setTonalPattern(
          def.pattern
            ? { ...def.pattern, pitch_offsets: [...def.pattern.pitch_offsets], enabled: true }
            : DEFAULT_PATTERN,
        )
        setTonalFX(def.fx ?? DEFAULT_FX_CONFIG)
      } else if (mode === 'fm') {
        const k = key as FmPresetKey
        const def = FM_PRESETS[k]
        if (!def) return
        setFmPresetKey(k)
        setFmParams(def.defaults)
        setFmFX(def.fx ?? DEFAULT_FX_CONFIG)
      } else {
        const k = key as AtmosphericPresetKey
        const def = ATMOSPHERIC_PRESETS[k]
        if (!def) return
        setAtmosphericPresetKey(k)
        setAtmosphericParams(def.defaults)
        setAtmosphericFX(def.fx ?? DEFAULT_FX_CONFIG)
      }
      setSelectedEntryId(null)
    },
    [mode],
  )

  const handleSelectPresetByIndex = useCallback(
    (oneBased: number) => {
      const idx = oneBased - 1
      const order =
        mode === 'percussive'
          ? PRESET_ORDER
          : mode === 'tonal'
            ? TONAL_PRESET_ORDER
            : mode === 'fm'
              ? FM_PRESET_ORDER
              : ATMOSPHERIC_PRESET_ORDER
      const key = order[idx]
      if (!key) return
      handleSelectPreset(key as string)
    },
    [mode, handleSelectPreset],
  )

  // ----- Param changes -----

  const handlePercussiveParamChange = useCallback(
    <K extends keyof PercussiveParams>(key: K, value: PercussiveParams[K]) => {
      setPercussiveParams((prev) => ({ ...prev, [key]: value }))
      setSelectedEntryId(null)
    },
    [],
  )

  const handleTonalParamChange = useCallback(
    <K extends keyof TonalParams>(key: K, value: TonalParams[K]) => {
      setTonalParams((prev) => ({ ...prev, [key]: value }))
      setSelectedEntryId(null)
    },
    [],
  )

  const handleFmParamChange = useCallback(
    <K extends keyof FmParams>(key: K, value: FmParams[K]) => {
      setFmParams((prev) => ({ ...prev, [key]: value }))
      setSelectedEntryId(null)
    },
    [],
  )

  const handleAtmosphericParamChange = useCallback(
    <K extends keyof AtmosphericParams>(
      key: K,
      value: AtmosphericParams[K],
    ) => {
      setAtmosphericParams((prev) => ({ ...prev, [key]: value }))
      setSelectedEntryId(null)
    },
    [],
  )

  // ----- Foraging -----

  const handleRandomize = useCallback(() => {
    if (mode === 'percussive') {
      setPercussiveParams(randomizeWithinPreset(PRESETS[percussivePresetKey]))
    } else if (mode === 'tonal') {
      setTonalParams(randomizeTonalPreset(TONAL_PRESETS[tonalPresetKey]))
    } else if (mode === 'fm') {
      setFmParams(randomizeFmPreset(FM_PRESETS[fmPresetKey]))
    } else {
      setAtmosphericParams(
        randomizeAtmosphericPreset(ATMOSPHERIC_PRESETS[atmosphericPresetKey]),
      )
    }
    setSelectedEntryId(null)
  }, [mode, percussivePresetKey, tonalPresetKey, fmPresetKey, atmosphericPresetKey])

  const handleMutate = useCallback(() => {
    if (mode === 'percussive') {
      setPercussiveParams((prev) =>
        mutateWithinPreset(PRESETS[percussivePresetKey], prev, mutateDistance),
      )
    } else if (mode === 'tonal') {
      setTonalParams((prev) =>
        mutateTonalPreset(TONAL_PRESETS[tonalPresetKey], prev, mutateDistance),
      )
    } else if (mode === 'fm') {
      setFmParams((prev) =>
        mutateFmPreset(FM_PRESETS[fmPresetKey], prev, mutateDistance),
      )
    } else {
      setAtmosphericParams((prev) =>
        mutateAtmosphericPreset(
          ATMOSPHERIC_PRESETS[atmosphericPresetKey],
          prev,
          mutateDistance,
        ),
      )
    }
    setSelectedEntryId(null)
  }, [
    mode,
    percussivePresetKey,
    tonalPresetKey,
    fmPresetKey,
    atmosphericPresetKey,
    mutateDistance,
  ])

  // ----- Trigger / playback -----

  const renderSourceSound = useCallback(async (): Promise<{
    buffer: AudioBuffer
    label: string
  }> => {
    if (mode === 'percussive') {
      const synthesized = await renderPercussive(percussiveParams)
      const patterned = applyPattern(synthesized, percussivePattern, getAudioContext())
      const final = await applyFXToBuffer(patterned, percussiveFX)
      return { buffer: final, label: PRESETS[percussivePresetKey].name }
    } else if (mode === 'tonal') {
      const synthesized = await renderTonal(tonalParams)
      const patterned = applyPattern(synthesized, tonalPattern, getAudioContext())
      const final = await applyFXToBuffer(patterned, tonalFX)
      return { buffer: final, label: TONAL_PRESETS[tonalPresetKey].name }
    } else {
      // mode === 'fm' (atmospheric is gated upstream by handleAtmosphericToggle).
      const synthesized = await renderFm(fmParams)
      const final = await applyFXToBuffer(synthesized, fmFX)
      return { buffer: final, label: FM_PRESETS[fmPresetKey].name }
    }
  }, [
    mode,
    percussiveParams,
    percussivePresetKey,
    percussivePattern,
    percussiveFX,
    tonalParams,
    tonalPresetKey,
    tonalPattern,
    tonalFX,
    fmParams,
    fmPresetKey,
    fmFX,
  ])

  const handleAtmosphericToggle = useCallback(() => {
    if (atmosphericSessionRef.current) {
      atmosphericSessionRef.current.stop()
      atmosphericSessionRef.current = null
      setAtmosphericPlaying(false)
      setAtmosphericAnalyser(null)
      return
    }
    const session = startAtmosphericPlayback(atmosphericParams, atmosphericFX)
    atmosphericSessionRef.current = session
    setAtmosphericAnalyser(session.analyser)
    setAtmosphericPlaying(true)
  }, [atmosphericParams, atmosphericFX])

  const handleTrigger = useCallback(async () => {
    if (triggerSource === 'stack' && stack.layers.length > 0) {
      const rendered = await renderStack(stack, library.entries, getAudioContext())
      setBuffer(rendered)
      setBufferDurationMs(rendered.duration * 1000)
      setBufferLabel('STACK')
      playBuffer(rendered)
      return
    }
    if (mode === 'atmospheric') {
      // SPACE in atmospheric mode toggles continuous playback.
      handleAtmosphericToggle()
      return
    }
    const { buffer: rendered, label } = await renderSourceSound()
    setBuffer(rendered)
    setBufferDurationMs(rendered.duration * 1000)
    setBufferLabel(label)
    playBuffer(rendered)
  }, [
    triggerSource,
    stack,
    library.entries,
    renderSourceSound,
    mode,
    handleAtmosphericToggle,
  ])

  // Live parameter updates: when atmospheric is playing, push param changes
  // through the session's crossfade. When stopped, params just stage.
  useEffect(() => {
    if (atmosphericSessionRef.current && atmosphericPlaying) {
      atmosphericSessionRef.current.applyParams(atmosphericParams, atmosphericFX)
    }
  }, [atmosphericParams, atmosphericFX, atmosphericPlaying])

  // Mode switch tears down atmospheric playback (per spec — switching modes
  // is deliberate; preserving live audio across modes is ambiguous UX).
  useEffect(() => {
    if (mode !== 'atmospheric' && atmosphericSessionRef.current) {
      atmosphericSessionRef.current.stop()
      atmosphericSessionRef.current = null
      setAtmosphericPlaying(false)
      setAtmosphericAnalyser(null)
    }
  }, [mode])

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (atmosphericSessionRef.current) {
        atmosphericSessionRef.current.stop()
        atmosphericSessionRef.current = null
      }
    }
  }, [])

  // Auto-play on parameter / pattern / mode change.
  //
  // Behavior is decoupled from triggerSource: adjusting a slider plays the
  // source-mode sound the panel authors, even when triggerSource === 'stack'
  // (which became the default in v3.5). The TRIGGER button still respects
  // triggerSource for explicit playback; auto-play is the "I'm tweaking a
  // value, let me hear the change" affordance for the parameter panel only.
  //
  // Skipped for atmospheric — params already apply live during continuous
  // playback, and one-shot rendering of a continuous sound is meaningless.
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }
    if (!autoPlayOnChange) return
    if (mode === 'atmospheric') return
    const timer = window.setTimeout(() => {
      void (async () => {
        const { buffer: rendered, label } = await renderSourceSound()
        setBuffer(rendered)
        setBufferDurationMs(rendered.duration * 1000)
        setBufferLabel(label)
        playBuffer(rendered)
      })()
    }, AUTO_PLAY_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [
    percussiveParams,
    tonalParams,
    fmParams,
    percussivePattern,
    tonalPattern,
    mode,
    renderSourceSound,
    autoPlayOnChange,
  ])

  // ----- Library: save / recall / audition / rename / delete -----

  const handleSave = useCallback(async () => {
    // Stack save
    if (triggerSource === 'stack' && stack.layers.length > 0) {
      let rendered = buffer
      if (!rendered) {
        rendered = await renderStack(stack, library.entries, getAudioContext())
      }
      const name = nextNameForPreset(
        'stack',
        library.entries.map((e) => e.name),
      )
      const spec = serializeStackSpec({
        layers: stack.layers.map((l) => ({
          ref: l.ref,
          offset_ms: l.offset_ms,
          gain: l.gain,
          mute: l.mute,
          ...(l.pattern ? { pattern: l.pattern } : {}),
        })),
        name,
        ...(stack.pattern ? { pattern: stack.pattern } : {}),
      })
      const now = new Date().toISOString()
      const entry: LibraryEntry = {
        id: newId(),
        name,
        preset: 'stack',
        spec,
        waveformBuffer: rendered,
        folderId: undefined,
        createdAt: now,
        modifiedAt: now,
      }
      setLibrary((prev) => addEntry(prev, entry))
      setSelectedEntryId(entry.id)
      if (!buffer) {
        setBuffer(rendered)
        setBufferDurationMs(rendered.duration * 1000)
        setBufferLabel('STACK')
      }
      return
    }

    // Atmospheric save: render the bounded preview at DEFAULT_ATMO_DURATION_S
    // (5s). Phase 6 will replace this with a per-export duration picker.
    if (mode === 'atmospheric') {
      const duration_ms = DEFAULT_ATMO_DURATION_S * 1000
      const renderedBuf = await renderAtmosphericOffline(
        atmosphericParams,
        DEFAULT_ATMO_DURATION_S,
      )
      const presetKey = atmosphericPresetKey
      const name = nextNameForPreset(
        presetKey,
        library.entries.map((e) => e.name),
      )
      const spec = serializeAtmosphericSpec({
        preset: presetKey as AtmosphericPresetSpec,
        params: atmosphericParams,
        duration_ms,
        name,
      })
      const now = new Date().toISOString()
      const entry: LibraryEntry = {
        id: newId(),
        name,
        preset: presetKey,
        spec,
        waveformBuffer: renderedBuf,
        folderId: undefined,
        createdAt: now,
        modifiedAt: now,
      }
      setLibrary((prev) => addEntry(prev, entry))
      setSelectedEntryId(entry.id)
      setBuffer(renderedBuf)
      setBufferDurationMs(renderedBuf.duration * 1000)
      setBufferLabel(ATMOSPHERIC_PRESETS[atmosphericPresetKey].name)
      return
    }

    // Sound save (existing flow)
    let rendered = buffer
    let preset: string
    let spec: SoundSpec

    if (mode === 'percussive') {
      preset = percussivePresetKey
      if (!rendered) {
        const synthesized = await renderPercussive(percussiveParams)
        rendered = applyPattern(synthesized, percussivePattern, getAudioContext())
      }
      spec = serializePercussiveSpec({
        preset: percussivePresetKey as PercussivePreset,
        params: percussiveParams,
        pattern: percussivePattern.enabled ? percussivePattern : undefined,
      })
    } else if (mode === 'tonal') {
      preset = tonalPresetKey
      if (!rendered) {
        const synthesized = await renderTonal(tonalParams)
        rendered = applyPattern(synthesized, tonalPattern, getAudioContext())
      }
      spec = serializeTonalSpec({
        preset: tonalPresetKey as TonalPreset,
        params: tonalParams,
        pattern: tonalPattern.enabled ? tonalPattern : undefined,
      })
    } else {
      // mode === 'fm'
      preset = fmPresetKey
      if (!rendered) {
        rendered = await renderFm(fmParams)
      }
      spec = serializeFmSpec({
        preset: fmPresetKey as FmPresetSpec,
        params: fmParams,
      })
    }

    const name = nextNameForPreset(preset, library.entries.map((e) => e.name))
    const now = new Date().toISOString()
    const entry: LibraryEntry = {
      id: newId(),
      name,
      preset,
      spec,
      waveformBuffer: rendered,
      folderId: undefined,
      createdAt: now,
      modifiedAt: now,
    }
    setLibrary((prev) => addEntry(prev, entry))
    setSelectedEntryId(entry.id)

    if (!buffer) {
      setBuffer(rendered)
      setBufferDurationMs(rendered.duration * 1000)
      setBufferLabel(
        mode === 'percussive'
          ? PRESETS[percussivePresetKey].name
          : mode === 'tonal'
            ? TONAL_PRESETS[tonalPresetKey].name
            : FM_PRESETS[fmPresetKey].name,
      )
    }
  }, [
    buffer,
    triggerSource,
    stack,
    mode,
    percussiveParams,
    percussivePresetKey,
    percussivePattern,
    tonalParams,
    tonalPresetKey,
    tonalPattern,
    fmParams,
    fmPresetKey,
    library.entries,
  ])

  const handleRecallEntry = useCallback((entry: LibraryEntry) => {
    if (entry.spec.kind === 'stack') {
      // Recall a stack into the working stack
      setStack({
        layers: entry.spec.layers.map((l, i) => ({
          id: `${entry.id}_layer_${i}`,
          ref: l.ref,
          offset_ms: l.offset_ms,
          gain: l.gain,
          mute: l.mute,
          ...(l.pattern ? { pattern: l.pattern } : {}),
        })),
        ...(entry.spec.pattern ? { pattern: entry.spec.pattern } : {}),
      })
      setTriggerSource('stack')
      setSelectedEntryId(entry.id)
      return
    }
    if (entry.spec.mode === 'percussive') {
      setMode('percussive')
      setPercussiveParams({ ...entry.spec.params })
      if (entry.preset !== 'custom' && PRESETS[entry.preset as PresetKey]) {
        setPercussivePresetKey(entry.preset as PresetKey)
      }
      setPercussivePattern(entry.spec.pattern ?? DEFAULT_PATTERN)
    } else if (entry.spec.mode === 'tonal') {
      setMode('tonal')
      setTonalParams({ ...entry.spec.params })
      if (
        entry.preset !== 'custom' &&
        TONAL_PRESETS[entry.preset as TonalPresetKey]
      ) {
        setTonalPresetKey(entry.preset as TonalPresetKey)
      }
      setTonalPattern(entry.spec.pattern ?? DEFAULT_PATTERN)
    } else if (entry.spec.mode === 'fm') {
      setMode('fm')
      setFmParams({
        ...entry.spec.params,
        op1: { ...entry.spec.params.op1 },
        op2: { ...entry.spec.params.op2 },
        op3: { ...entry.spec.params.op3 },
        op4: { ...entry.spec.params.op4 },
      })
      if (entry.preset !== 'custom' && FM_PRESETS[entry.preset as FmPresetKey]) {
        setFmPresetKey(entry.preset as FmPresetKey)
      }
    } else {
      // atmospheric
      setMode('atmospheric')
      setAtmosphericParams({ ...entry.spec.params })
      if (
        entry.preset !== 'custom' &&
        ATMOSPHERIC_PRESETS[entry.preset as AtmosphericPresetKey]
      ) {
        setAtmosphericPresetKey(entry.preset as AtmosphericPresetKey)
      }
    }
    setSelectedEntryId(entry.id)
  }, [])

  const handleAuditionEntry = useCallback(
    async (entry: LibraryEntry) => {
      const buf = entry.waveformBuffer ?? (await renderEntryBuffer(entry))
      playBuffer(buf)
      setBuffer(buf)
      setBufferDurationMs(buf.duration * 1000)
      setBufferLabel(entry.preset.toUpperCase())
    },
    [renderEntryBuffer],
  )

  const handleExportEntryJson = useCallback((entry: LibraryEntry) => {
    // Direct entry-level export: serializes the entry's stored spec without
    // touching the parameter panel. Keeps `entry.spec` as the source of truth
    // — no recall round-trip, so what's saved on disk matches the entry
    // verbatim (same param values, same metadata).
    downloadBlob(
      JSON.stringify(entry.spec, null, 2),
      `${entry.name}.sfx.json`,
      'application/json',
    )
  }, [])

  const handleRenameEntry = useCallback(
    (entryId: string, newName: string) => {
      setLibrary((prev) => renameEntry(prev, entryId, newName))
    },
    [],
  )

  const handleDeleteEntry = useCallback((entryId: string) => {
    setLibrary((prev) => deleteEntry(prev, entryId))
    setSelectedEntryId((cur) => (cur === entryId ? null : cur))
  }, [])

  // ----- Library: folder operations -----

  const handleCreateFolder = useCallback((name: string) => {
    setLibrary((prev) => createFolder(prev, name))
  }, [])

  const handleRenameFolder = useCallback(
    (folderId: string, newName: string) => {
      setLibrary((prev) => renameFolder(prev, folderId, newName))
    },
    [],
  )

  const handleDeleteFolder = useCallback((folderId: string) => {
    setLibrary((prev) => deleteFolder(prev, folderId))
  }, [])

  const handleToggleFolder = useCallback((folderId: string) => {
    setLibrary((prev) => toggleFolder(prev, folderId))
  }, [])

  const handleMoveEntryToFolder = useCallback(
    (entryId: string, folderId: string | undefined) => {
      setLibrary((prev) => moveEntryToFolder(prev, entryId, folderId))
    },
    [],
  )

  // ----- Library zip -----

  const handleExportLibrary = useCallback(async () => {
    if (library.entries.length === 0) {
      window.alert('Library is empty — nothing to export.')
      return
    }
    await exportLibraryZip(library)
  }, [library])

  const handleImportLibrary = useCallback(
    async (file: File) => {
      try {
        const result = await importLibraryZip(file, library)
        if (result.added.length === 0 && result.newFolders.length === 0) {
          window.alert('Nothing to import.')
          return
        }
        setLibrary((prev) => ({
          folders: [...prev.folders, ...result.newFolders],
          entries: [...prev.entries, ...result.added],
        }))
        if (result.warnings.length > 0) {
          console.warn('Library import warnings:', result.warnings)
        }
      } catch (err) {
        window.alert(`Import failed: ${err instanceof Error ? err.message : err}`)
      }
    },
    [library],
  )

  // ----- Stack operations -----

  const handleAddLayerFromLibrary = useCallback(
    (entryId: string, offsetMs?: number) => {
      const entry = library.entries.find((e) => e.id === entryId)
      if (!entry) return
      if (entry.spec.kind !== 'sound') {
        // Stacks can't be layered into other stacks (no nesting in v2)
        window.alert('Stacks cannot be added as layers — only sounds.')
        return
      }
      // For atmospheric layers, seed the layer's duration_ms from the entry's
      // saved spec hint (or fall back to 5s). Keeps the UI value honest from
      // the moment the layer appears rather than showing a placeholder until
      // the user touches it.
      const initial: Parameters<typeof addLayer>[2] = {
        ...(offsetMs !== undefined ? { offset_ms: offsetMs } : {}),
      }
      if (entry.spec.mode === 'atmospheric') {
        initial.duration_ms =
          entry.spec.duration_ms ?? DEFAULT_ATMO_DURATION_S * 1000
      }
      setStack((prev) => addLayer(prev, entryId, initial))
    },
    [library.entries],
  )

  const handleSelectLayer = useCallback((layerId: string) => {
    setSelectedLayerId(layerId)
  }, [])

  const handleLayerOffsetChange = useCallback(
    (layerId: string, offsetMs: number) => {
      setStack((prev) => setLayerOffset(prev, layerId, offsetMs))
    },
    [],
  )

  const handleLayerGainChange = useCallback(
    (layerId: string, gain: number) => {
      setStack((prev) => setLayerGain(prev, layerId, gain))
    },
    [],
  )

  const handleToggleMute = useCallback((layerId: string) => {
    setStack((prev) => toggleMute(prev, layerId))
  }, [])

  const handleToggleSolo = useCallback((layerId: string) => {
    setStack((prev) => toggleSolo(prev, layerId))
  }, [])

  const handleDeleteLayer = useCallback((layerId: string) => {
    setStack((prev) => removeLayer(prev, layerId))
    setSelectedLayerId((cur) => (cur === layerId ? null : cur))
  }, [])

  const handleLayerPatternChange = useCallback(
    (layerId: string, pattern: PatternConfig | undefined) => {
      setStack((prev) => setLayerPattern(prev, layerId, pattern))
    },
    [],
  )

  const handleLayerDurationChange = useCallback(
    (layerId: string, durationMs: number | undefined) => {
      setStack((prev) => setLayerDuration(prev, layerId, durationMs))
    },
    [],
  )

  const handleStackPatternChange = useCallback(
    (pattern: PatternConfig | undefined) => {
      setStack((prev) => setStackPattern(prev, pattern))
    },
    [],
  )

  // Trigger source is fully user-controlled. We previously auto-flipped back
  // to 'source' when the stack emptied, but that fought users who clicked
  // STACK intending to start composing — the flip would revert them
  // immediately, then SPACE would play the source sound, looking like the
  // toggle didn't work. Empty stack shows the empty-state prompt instead.

  // ----- Single-sound exports (for source mode) -----

  const handleExportWav = useCallback(async () => {
    if (mode === 'atmospheric' && triggerSource === 'source') {
      window.alert(
        'Exporting atmospheric sounds requires a duration choice — coming in v3.6.',
      )
      return
    }
    let b: AudioBuffer
    let nameBase: string
    if (triggerSource === 'stack' && stack.layers.length > 0) {
      b = await renderStack(stack, library.entries, getAudioContext())
      nameBase = nextNameForPreset('stack', library.entries.map((e) => e.name))
    } else {
      b = (await renderSourceSound()).buffer
      const presetName =
        mode === 'percussive'
          ? percussivePresetKey
          : mode === 'tonal'
            ? tonalPresetKey
            : fmPresetKey
      nameBase = nextNameForPreset(
        presetName,
        library.entries.map((e) => e.name),
      )
    }
    const wav = audioBufferToWav(b)
    downloadBlob(wav, `${nameBase}.wav`, 'audio/wav')
  }, [
    triggerSource,
    stack,
    library.entries,
    renderSourceSound,
    mode,
    percussivePresetKey,
    tonalPresetKey,
    fmPresetKey,
  ])

  const handleExportJson = useCallback(() => {
    let spec: Spec
    let name: string
    const existingNames = library.entries.map((e) => e.name)
    if (triggerSource === 'stack' && stack.layers.length > 0) {
      name = nextNameForPreset('stack', existingNames)
      // Honor JSON export mode: flattened resolves string refs to inline
      // SoundSpecs from the library; reference keeps the string IDs.
      const flatten = jsonExportMode === 'flattened'
      spec = serializeStackSpec({
        layers: stack.layers.map((l) => {
          let ref = l.ref
          if (flatten && typeof ref === 'string') {
            const sourceEntry = library.entries.find((e) => e.id === ref)
            if (
              sourceEntry &&
              sourceEntry.spec.kind === 'sound'
            ) {
              ref = sourceEntry.spec
            }
          }
          return {
            ref,
            offset_ms: l.offset_ms,
            gain: l.gain,
            mute: l.mute,
            ...(l.pattern ? { pattern: l.pattern } : {}),
          }
        }),
        name,
        ...(stack.pattern ? { pattern: stack.pattern } : {}),
      })
    } else if (mode === 'percussive') {
      name = nextNameForPreset(percussivePresetKey, existingNames)
      spec = serializePercussiveSpec({
        preset: percussivePresetKey as PercussivePreset,
        params: percussiveParams,
        pattern: percussivePattern.enabled ? percussivePattern : undefined,
        name,
      })
    } else if (mode === 'tonal') {
      name = nextNameForPreset(tonalPresetKey, existingNames)
      spec = serializeTonalSpec({
        preset: tonalPresetKey as TonalPreset,
        params: tonalParams,
        pattern: tonalPattern.enabled ? tonalPattern : undefined,
        name,
      })
    } else if (mode === 'fm') {
      name = nextNameForPreset(fmPresetKey, existingNames)
      spec = serializeFmSpec({
        preset: fmPresetKey as FmPresetSpec,
        params: fmParams,
        name,
      })
    } else {
      // atmospheric
      name = nextNameForPreset(atmosphericPresetKey, existingNames)
      spec = serializeAtmosphericSpec({
        preset: atmosphericPresetKey as AtmosphericPresetSpec,
        params: atmosphericParams,
        duration_ms: DEFAULT_ATMO_DURATION_S * 1000,
        name,
      })
    }
    downloadBlob(
      JSON.stringify(spec, null, 2),
      `${name}.sfx.json`,
      'application/json',
    )
  }, [
    triggerSource,
    stack,
    mode,
    percussiveParams,
    percussivePresetKey,
    percussivePattern,
    tonalParams,
    tonalPresetKey,
    tonalPattern,
    fmParams,
    fmPresetKey,
    atmosphericParams,
    atmosphericPresetKey,
    library.entries,
    jsonExportMode,
  ])

  // ----- Keyboard shortcuts -----

  const handleSwitchMode = useCallback((m: Mode) => {
    setMode(m)
  }, [])

  const handleTogglePattern = useCallback(() => {
    if (mode === 'percussive') {
      setPercussivePattern((p) => ({ ...p, enabled: !p.enabled }))
    } else if (mode === 'tonal') {
      setTonalPattern((p) => ({ ...p, enabled: !p.enabled }))
    }
    // Atmospheric has no pattern (per spec — atmospheric is continuous, not
    // trigger-based, so pattern's "trigger N times" semantic doesn't apply).
  }, [mode])

  const handleToggleTriggerSource = useCallback(() => {
    setTriggerSource((s) => (s === 'source' ? 'stack' : 'source'))
  }, [])

  // Layer-context shortcuts. These target the currently-selected layer.
  const handleLayerOffsetNudge = useCallback(
    (deltaMs: number) => {
      if (!selectedLayerId) return
      const layer = stack.layers.find((l) => l.id === selectedLayerId)
      if (!layer) return
      setStack((prev) =>
        setLayerOffset(prev, selectedLayerId, layer.offset_ms + deltaMs),
      )
    },
    [selectedLayerId, stack.layers],
  )

  const handleLayerGainNudge = useCallback(
    (delta: number) => {
      if (!selectedLayerId) return
      const layer = stack.layers.find((l) => l.id === selectedLayerId)
      if (!layer) return
      setStack((prev) =>
        setLayerGain(prev, selectedLayerId, layer.gain + delta),
      )
    },
    [selectedLayerId, stack.layers],
  )

  const handleLayerToggleMute = useCallback(() => {
    if (!selectedLayerId) return
    setStack((prev) => toggleMute(prev, selectedLayerId))
  }, [selectedLayerId])

  const handleLayerToggleSolo = useCallback(() => {
    if (!selectedLayerId) return
    setStack((prev) => toggleSolo(prev, selectedLayerId))
  }, [selectedLayerId])

  const handleLayerDelete = useCallback(() => {
    if (!selectedLayerId) return
    setStack((prev) => removeLayer(prev, selectedLayerId))
    setSelectedLayerId(null)
  }, [selectedLayerId])

  const shortcutHandlers = useMemo(
    () => ({
      onTrigger: () => void handleTrigger(),
      onRandomize: handleRandomize,
      onMutate: handleMutate,
      onSave: () => void handleSave(),
      onSelectPresetByIndex: handleSelectPresetByIndex,
      onExportWav: () => void handleExportWav(),
      onExportJson: handleExportJson,
      onSwitchMode: handleSwitchMode,
      onTogglePattern: handleTogglePattern,
      onToggleTriggerSource: handleToggleTriggerSource,
      onLayerOffsetNudge: handleLayerOffsetNudge,
      onLayerGainNudge: handleLayerGainNudge,
      onLayerToggleMute: handleLayerToggleMute,
      onLayerToggleSolo: handleLayerToggleSolo,
      onLayerDelete: handleLayerDelete,
    }),
    [
      handleTrigger,
      handleRandomize,
      handleMutate,
      handleSave,
      handleSelectPresetByIndex,
      handleExportWav,
      handleExportJson,
      handleSwitchMode,
      handleTogglePattern,
      handleToggleTriggerSource,
      handleLayerOffsetNudge,
      handleLayerGainNudge,
      handleLayerToggleMute,
      handleLayerToggleSolo,
      handleLayerDelete,
    ],
  )

  useKeyboardShortcuts(
    shortcutHandlers,
    !settingsOpen && !aboutOpen,
    selectedLayerId !== null,
  )

  // ----- Settings actions -----

  const handleClearAllData = useCallback(() => {
    if (
      !window.confirm(
        'Clear all library entries and settings from this browser? This cannot be undone.',
      )
    ) {
      return
    }
    clearState()
    window.location.reload()
  }, [])

  // ----- Derived for child components -----

  const presetItems: PresetRailItem[] =
    mode === 'percussive'
      ? PRESET_ORDER.map((k) => ({
          key: k,
          name: PRESETS[k].name,
          description: PRESETS[k].description,
        }))
      : mode === 'tonal'
        ? TONAL_PRESET_ORDER.map((k) => ({
            key: k,
            name: TONAL_PRESETS[k].name,
            description: TONAL_PRESETS[k].description,
          }))
        : mode === 'fm'
          ? FM_PRESET_ORDER.map((k) => ({
              key: k,
              name: FM_PRESETS[k].name,
              description: FM_PRESETS[k].description,
            }))
          : ATMOSPHERIC_PRESET_ORDER.map((k) => ({
              key: k,
              name: ATMOSPHERIC_PRESETS[k].name,
              description: ATMOSPHERIC_PRESETS[k].description,
            }))

  const selectedPresetKey =
    mode === 'percussive'
      ? percussivePresetKey
      : mode === 'tonal'
        ? tonalPresetKey
        : mode === 'fm'
          ? fmPresetKey
          : atmosphericPresetKey

  return (
    <div className="crt-overlay h-full flex flex-col" style={{ background: '#06080a', color: '#d4ecdc' }}>
      <TopBar
        mode={mode}
        onModeChange={setMode}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAbout={() => setAboutOpen(true)}
      />

      <AuditionRow
        triggerSource={triggerSource}
        onTriggerSourceChange={setTriggerSource}
        stack={stack}
        library={library.entries}
        selectedLayerId={selectedLayerId}
        onSelectLayer={handleSelectLayer}
        onLayerOffsetChange={handleLayerOffsetChange}
        onLayerGainChange={handleLayerGainChange}
        onAddLayerFromLibrary={handleAddLayerFromLibrary}
        onToggleLayerMute={handleToggleMute}
        onToggleLayerSolo={handleToggleSolo}
        buffer={buffer}
        durationLabel={`${Math.round(bufferDurationMs)} ms`}
        presetLabel={
          mode === 'atmospheric'
            ? ATMOSPHERIC_PRESETS[atmosphericPresetKey].name
            : bufferLabel
        }
        playheadProgress={playheadProgress}
        isPlaying={isPlaying}
        mode={mode}
        atmosphericPlaying={atmosphericPlaying}
        atmosphericAnalyser={atmosphericAnalyser}
        onAtmosphericToggle={handleAtmosphericToggle}
        stackPattern={stack.pattern}
        onStackPatternChange={handleStackPatternChange}
        onTrigger={() => void handleTrigger()}
        onSave={() => void handleSave()}
        onExportWav={() => void handleExportWav()}
        onExportJson={handleExportJson}
      />

      <main className="flex-1 grid grid-cols-[220px_1fr_290px] min-h-0" style={{ borderColor: '#122418' }}>
        <PresetRail
          items={presetItems}
          selected={selectedPresetKey}
          onSelect={handleSelectPreset}
          mutateDistance={mutateDistance}
          onMutateDistanceChange={setMutateDistance}
          onRandomize={handleRandomize}
          onMutate={handleMutate}
          headerLabel={
            mode === 'tonal'
              ? 'TONAL PRESETS'
              : mode === 'fm'
                ? 'FM PRESETS'
                : mode === 'atmospheric'
                  ? 'ATMOSPHERIC PRESETS'
                  : 'PERCUSSIVE PRESETS'
          }
        />
        <ParameterPanel
          mode={mode}
          percussiveParams={percussiveParams}
          tonalParams={tonalParams}
          fmParams={fmParams}
          atmosphericParams={atmosphericParams}
          onPercussiveChange={handlePercussiveParamChange}
          onTonalChange={handleTonalParamChange}
          onFmChange={handleFmParamChange}
          onAtmosphericChange={handleAtmosphericParamChange}
          percussivePattern={percussivePattern}
          tonalPattern={tonalPattern}
          onPercussivePatternChange={setPercussivePattern}
          onTonalPatternChange={setTonalPattern}
          fx={
            mode === 'percussive'
              ? percussiveFX
              : mode === 'tonal'
                ? tonalFX
                : mode === 'fm'
                  ? fmFX
                  : atmosphericFX
          }
          onFXChange={
            mode === 'percussive'
              ? setPercussiveFX
              : mode === 'tonal'
                ? setTonalFX
                : mode === 'fm'
                  ? setFmFX
                  : setAtmosphericFX
          }
        />
        <div className="flex flex-col min-h-0" style={{ borderLeft: '1px solid #122418' }}>
          <div className="flex-[2] min-h-0">
            <StackRoster
              stack={stack}
              library={library.entries}
              selectedLayerId={selectedLayerId}
              onSelectLayer={handleSelectLayer}
              onToggleMute={handleToggleMute}
              onToggleSolo={handleToggleSolo}
              onDeleteLayer={handleDeleteLayer}
              onLayerOffsetChange={handleLayerOffsetChange}
              onLayerGainChange={handleLayerGainChange}
              onAddLayerFromLibrary={(id) => handleAddLayerFromLibrary(id)}
              onLayerPatternChange={handleLayerPatternChange}
              onLayerDurationChange={(id, ms) =>
                handleLayerDurationChange(id, ms)
              }
            />
          </div>
          <div className="flex-[3] min-h-0">
            <Library
              state={library}
              selectedEntryId={selectedEntryId}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              onToggleFolder={handleToggleFolder}
              onMoveEntryToFolder={handleMoveEntryToFolder}
              onRecallEntry={handleRecallEntry}
              onAuditionEntry={handleAuditionEntry}
              onExportEntryJson={handleExportEntryJson}
              onRenameEntry={handleRenameEntry}
              onDeleteEntry={handleDeleteEntry}
              onExportLibrary={() => void handleExportLibrary()}
              onImportLibrary={(file) => void handleImportLibrary(file)}
            />
          </div>
        </div>
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        autoPlayOnChange={autoPlayOnChange}
        onAutoPlayOnChangeToggle={setAutoPlayOnChange}
        jsonExportMode={jsonExportMode}
        onJsonExportModeChange={setJsonExportMode}
        onExportLibrary={() => void handleExportLibrary()}
        onImportLibrary={(file) => void handleImportLibrary(file)}
        onClearAllData={handleClearAllData}
      />
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  )
}

function nextNameForPreset(preset: string, existingNames: string[]): string {
  let max = 0
  const re = new RegExp(`^${preset}_(\\d+)$`)
  for (const name of existingNames) {
    const m = re.exec(name)
    if (m) {
      const n = parseInt(m[1], 10)
      if (n > max) max = n
    }
  }
  return `${preset}_${String(max + 1).padStart(2, '0')}`
}

export default App
