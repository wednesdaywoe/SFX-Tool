import type { FmAlgorithm } from './types'

// Algorithm topology for 4-op FM.
//
// Convention: operators are computed in order 1→2→3→4 each sample. A
// modulator must always have a lower index than the operator it modulates,
// so a single forward pass is correct (no DAG sort needed).
//
// Feedback is fixed on op1 in every algorithm (see types.ts). Op1 is a pure
// modulator in algorithms 1–7 and a carrier in algorithm 8 (additive).

export interface AlgorithmSpec {
  id: FmAlgorithm
  name: string
  // modulatorsOf[i] = list of 1-based op indices that add to op (i+1)'s phase.
  // Length is always 4 (one entry per operator).
  modulatorsOf: readonly [
    readonly number[],
    readonly number[],
    readonly number[],
    readonly number[],
  ]
  // 1-based op indices whose output is summed to the audio buffer.
  carriers: readonly number[]
}

export const ALGORITHMS: Record<FmAlgorithm, AlgorithmSpec> = {
  1: {
    id: 1,
    name: '1▸2▸3▸4',
    modulatorsOf: [[], [1], [2], [3]],
    carriers: [4],
  },
  2: {
    id: 2,
    name: '1▸2 + 3▸4',
    modulatorsOf: [[], [1], [], [3]],
    carriers: [2, 4],
  },
  3: {
    id: 3,
    name: '1▸(2+3+4)',
    modulatorsOf: [[], [1], [1], [1]],
    carriers: [2, 3, 4],
  },
  4: {
    id: 4,
    name: '1▸2 + 3 + 4',
    modulatorsOf: [[], [1], [], []],
    carriers: [2, 3, 4],
  },
  5: {
    id: 5,
    name: '(1+2)▸3▸4',
    modulatorsOf: [[], [], [1, 2], [3]],
    carriers: [4],
  },
  6: {
    id: 6,
    name: '1▸2▸3 + 4',
    modulatorsOf: [[], [1], [2], []],
    carriers: [3, 4],
  },
  7: {
    id: 7,
    name: '(1+2+3)▸4',
    modulatorsOf: [[], [], [], [1, 2, 3]],
    carriers: [4],
  },
  8: {
    id: 8,
    name: '1+2+3+4',
    modulatorsOf: [[], [], [], []],
    carriers: [1, 2, 3, 4],
  },
}

export const ALGORITHM_ORDER: readonly FmAlgorithm[] = [1, 2, 3, 4, 5, 6, 7, 8]

// Convenience for UI: is op (1-based) a carrier under the current algorithm?
export function isCarrier(algo: FmAlgorithm, opIndex: number): boolean {
  return ALGORITHMS[algo].carriers.includes(opIndex)
}
