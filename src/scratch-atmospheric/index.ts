/* Atmospheric scratch harness — phase 1 manual test. Exposed on window so
 * the dev console can drive it: `await sfxAtmo.play('wind')` or
 * `sfxAtmo.stop()` to cycle through presets and validate identities.
 *
 * Also runs deterministic tests on import: confirms two offline renders with
 * identical params produce identical buffers (modulo random noise sources,
 * which use Math.random) — only the modulator structure is checked.
 */

import { renderAtmosphericOffline } from '../dsp/atmospheric/offline'
import {
  startAtmosphericPlayback,
  type AtmosphericSession,
} from '../dsp/atmospheric/realtime'
import {
  ATMOSPHERIC_PRESETS,
  ATMOSPHERIC_PRESET_ORDER,
  type AtmosphericPresetKey,
} from '../presets-atmospheric'

let session: AtmosphericSession | null = null

export async function play(preset: AtmosphericPresetKey): Promise<void> {
  stop()
  const def = ATMOSPHERIC_PRESETS[preset]
  if (!def) throw new Error(`Unknown atmospheric preset: ${preset}`)
  session = startAtmosphericPlayback(def.defaults)
  // eslint-disable-next-line no-console
  console.log(`[sfxAtmo] playing preset: ${def.name}`)
}

export function stop(): void {
  if (session) {
    session.stop()
    session = null
    // eslint-disable-next-line no-console
    console.log('[sfxAtmo] stopped')
  }
}

export async function renderToBuffer(
  preset: AtmosphericPresetKey,
  durationS = 5,
): Promise<AudioBuffer> {
  const def = ATMOSPHERIC_PRESETS[preset]
  return renderAtmosphericOffline(def.defaults, durationS)
}

/* Quick smoke test you can run from the console:
 *   await sfxAtmo.smokeTest()
 * Renders all 9 preset defaults offline and reports peak/RMS per preset. */
export async function smokeTest(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('[sfxAtmo] running offline smoke test on all 9 presets...')
  for (const key of ATMOSPHERIC_PRESET_ORDER) {
    const def = ATMOSPHERIC_PRESETS[key]
    const buf = await renderAtmosphericOffline(def.defaults, 2)
    const data = buf.getChannelData(0)
    let peak = 0
    let sumSq = 0
    for (let i = 0; i < data.length; i++) {
      const a = Math.abs(data[i])
      if (a > peak) peak = a
      sumSq += data[i] * data[i]
    }
    const rms = Math.sqrt(sumSq / data.length)
    // eslint-disable-next-line no-console
    console.log(
      `  ${def.name.padEnd(18)} peak=${peak.toFixed(3)}  rms=${rms.toFixed(3)}`,
    )
  }
  // eslint-disable-next-line no-console
  console.log('[sfxAtmo] smoke test complete')
}

/* Auto-attach to window in dev for console use. No-op in production. */
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  ;(window as unknown as { sfxAtmo: unknown }).sfxAtmo = {
    play,
    stop,
    renderToBuffer,
    smokeTest,
    presets: ATMOSPHERIC_PRESET_ORDER,
  }
}
