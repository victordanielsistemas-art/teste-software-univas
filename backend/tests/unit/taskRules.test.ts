import { describe, it, expect } from 'vitest'
import { canTransition, type Status } from '../../src/utils/taskRules'

// RN01 — Transição de status de tarefa (canTransition(from, to))
// Valores esperados derivados exclusivamente de docs/especificacao.md.
describe('canTransition', () => {
  describe('transições permitidas pela tabela da RN01', () => {
    it.each<[Status, Status]>([
      ['PENDING', 'IN_PROGRESS'],
      ['PENDING', 'CANCELLED'],
      ['IN_PROGRESS', 'COMPLETED'],
      ['IN_PROGRESS', 'CANCELLED'],
    ])('permite transição de %s para %s', (from, to) => {
      // Act
      const resultado = canTransition(from, to)

      // Assert
      expect(resultado).toBe(true)
    })
  })

  describe('transições não listadas na tabela são proibidas', () => {
    it.each<[Status, Status]>([
      ['PENDING', 'COMPLETED'],
      ['IN_PROGRESS', 'PENDING'],
    ])('impede transição de %s para %s', (from, to) => {
      // Act
      const resultado = canTransition(from, to)

      // Assert
      expect(resultado).toBe(false)
    })
  })

  describe('status finais (COMPLETED e CANCELLED) não permitem nenhuma transição', () => {
    it.each<[Status, Status]>([
      ['COMPLETED', 'PENDING'],
      ['COMPLETED', 'IN_PROGRESS'],
      ['COMPLETED', 'CANCELLED'],
      ['CANCELLED', 'PENDING'],
      ['CANCELLED', 'IN_PROGRESS'],
      ['CANCELLED', 'COMPLETED'],
    ])('impede transição de %s para %s', (from, to) => {
      // Act
      const resultado = canTransition(from, to)

      // Assert
      expect(resultado).toBe(false)
    })
  })

  describe('manter o mesmo status não é uma transição', () => {
    it.each<Status>(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])(
      'retorna false ao manter o status %s',
      (status) => {
        // Act
        const resultado = canTransition(status, status)

        // Assert
        expect(resultado).toBe(false)
      },
    )
  })

  it('permite cancelar uma tarefa pendente antes de ser iniciada', () => {
    // Arrange
    const from: Status = 'PENDING'
    const to: Status = 'CANCELLED'

    // Act
    const resultado = canTransition(from, to)

    // Assert
    expect(resultado).toBe(true)
  })
})
