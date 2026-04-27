import { buildAtmosphericGraph } from './graph'
import { SAMPLE_RATE } from '../types'
import type { FXConfig } from '../fx/types'
import type { AtmosphericParams } from './types'

/* Render an atmospheric sound to an AudioBuffer for a fixed duration.
 * Used for WAV export and for atmospheric layers within stacks. */
export async function renderAtmosphericOffline(
  params: AtmosphericParams,
  durationSeconds: number,
  fx?: FXConfig,
): Promise<AudioBuffer> {
  const numSamples = Math.max(1, Math.ceil(durationSeconds * SAMPLE_RATE))
  const ctx = new OfflineAudioContext(1, numSamples, SAMPLE_RATE)
  const graph = buildAtmosphericGraph(ctx, params, durationSeconds, {
    loopSource: false,
    fx,
  })
  graph.output.connect(ctx.destination)
  for (const s of graph.sources) s.start()
  return ctx.startRendering()
}
