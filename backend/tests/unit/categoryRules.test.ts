import { describe, it, expect } from 'vitest'
import { canDeleteCategory } from '../../src/utils/categoryRules'

// RN02 — Uma categoria só pode ser excluída quando não possui tarefas associadas.
describe('canDeleteCategory', () => {
  it('permite excluir categoria sem tarefas associadas (tasksCount = 0, valor-limite)', () => {
    // Arrange
    const tasksCount = 0

    // Act
    const resultado = canDeleteCategory(tasksCount)

    // Assert
    expect(resultado).toBe(true)
  })

  it('impede excluir categoria com exatamente uma tarefa associada (tasksCount = 1, valor-limite)', () => {
    // Arrange
    const tasksCount = 1

    // Act
    const resultado = canDeleteCategory(tasksCount)

    // Assert
    expect(resultado).toBe(false)
  })

  it('impede excluir categoria com várias tarefas associadas (tasksCount = 10, partição)', () => {
    // Arrange
    const tasksCount = 10

    // Act
    const resultado = canDeleteCategory(tasksCount)

    // Assert
    expect(resultado).toBe(false)
  })
})
