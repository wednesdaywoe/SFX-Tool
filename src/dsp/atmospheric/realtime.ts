import { buildAtmosphericGraph } from './graph'
import type { FXConfig } from '../fx/types'
import type { AtmosphericParams } from './types'

/* Atmospheric playback session. The session owns its AudioContext and the
 * current graph. Stop() tears down all sources and closes the context. */
export interface AtmosphericSession {
  ctx: AudioContext
  /* Replace the current graph with a fresh one (called on parameter changes). */
  applyParams(next: AtmosphericParams, fx?: FXConfig): void
  /* Get the current AnalyserNode for visualization. */
  analyser: AnalyserNode
  stop(): void
}

const REALTIME_BUFFER_DURATION_S = 60

/* Start continuous atmospheric playback. Returns a session that can swap
 * params live. Smooth-transition strategy is "rebuild the graph and crossfade
 * with a 60ms ramp" — fast enough to feel live, long enough to avoid clicks.
 */
export function startAtmosphericPlayback(
  params: AtmosphericParams,
  fx?: FXConfig,
): AtmosphericSession {
  const ctx = new AudioContext()
  // Resume immediately on user gesture. Caller is expected to invoke this
  // from a click/keydown handler.
  void ctx.resume()

  const masterGain = ctx.createGain()
  masterGain.gain.value = 1
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 2048
  masterGain.connect(analyser)
  analyser.connect(ctx.destination)

  let currentGraph = buildAtmosphericGraph(ctx, params, REALTIME_BUFFER_DURATION_S, {
    loopSource: true,
    fx,
  })
  currentGraph.output.connect(masterGain)
  for (const s of currentGraph.sources) s.start()

  const applyParams = (next: AtmosphericParams, nextFx?: FXConfig) => {
    const fadeMs = 60
    const fadeS = fadeMs / 1000
    const now = ctx.currentTime

    const newGraph = buildAtmosphericGraph(ctx, next, REALTIME_BUFFER_DURATION_S, {
      loopSource: true,
      fx: nextFx,
    })
    const newGain = ctx.createGain()
    newGain.gain.setValueAtTime(0, now)
    newGain.gain.linearRampToValueAtTime(1, now + fadeS)
    newGraph.output.connect(newGain)
    newGain.connect(masterGain)
    for (const s of newGraph.sources) s.start()

    // Fade out + tear down old graph
    const oldGraph = currentGraph
    const oldFadeGain = ctx.createGain()
    oldGraph.output.disconnect()
    oldGraph.output.connect(oldFadeGain)
    oldFadeGain.connect(masterGain)
    oldFadeGain.gain.setValueAtTime(1, now)
    oldFadeGain.gain.linearRampToValueAtTime(0, now + fadeS)
    setTimeout(() => {
      for (const s of oldGraph.sources) {
        try {
          s.stop()
        } catch {
          // already stopped
        }
        s.disconnect()
      }
      oldFadeGain.disconnect()
      oldGraph.output.disconnect()
    }, fadeMs + 30)

    currentGraph = newGraph
  }

  const stop = () => {
    for (const s of currentGraph.sources) {
      try {
        s.stop()
      } catch {
        // already stopped
      }
      s.disconnect()
    }
    void ctx.close()
  }

  return { ctx, applyParams, analyser, stop }
}
