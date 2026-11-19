import { describe, it, expect } from 'vitest'
import { canTransition } from '../../src/utils/taskRules'

describe('canTransition — RN01', () => {
  it.each([
    ['PENDING', 'IN_PROGRESS'],
    ['PENDING', 'CANCELLED'],
    ['IN_PROGRESS', 'COMPLETED'],
    ['IN_PROGRESS', 'CANCELLED'],
  ] as const)('permite a transição de %s para %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true)
  })

  it.each([
    ['PENDING', 'PENDING'],
    ['PENDING', 'COMPLETED'],
    ['IN_PROGRESS', 'PENDING'],
    ['IN_PROGRESS', 'IN_PROGRESS'],
    ['COMPLETED', 'PENDING'],
    ['COMPLETED', 'IN_PROGRESS'],
    ['COMPLETED', 'COMPLETED'],
    ['COMPLETED', 'CANCELLED'],
    ['CANCELLED', 'PENDING'],
    ['CANCELLED', 'IN_PROGRESS'],
    ['CANCELLED', 'COMPLETED'],
    ['CANCELLED', 'CANCELLED'],
  ] as const)('proíbe a transição de %s para %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false)
  })
})
