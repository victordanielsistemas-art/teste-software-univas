import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { prisma, resetDb, seedUserAndCategory } from './helpers/db'

// Contrato API05 (docs/especificacao.md), que aplica a RN01 e a RN04.
// Os valores esperados vêm da especificação, não da implementação.

type Status = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

// Id com formato válido de cuid, mas que nunca é gravado no banco.
const ID_INEXISTENTE = 'cl0000000000000000000000'

async function criarTarefa(status: Status) {
  const { user, category } = await seedUserAndCategory()
  return prisma.task.create({
    data: { title: 'Prova', status, userId: user.id, categoryId: category.id }
  })
}

describe('PUT /api/tasks/:id (API05 / RN01 / RN04)', () => {
  beforeEach(async () => {
    await resetDb()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  // Transições permitidas pela tabela da RN01
  it.each<[Status, Status]>([
    ['PENDING', 'IN_PROGRESS'],
    ['PENDING', 'CANCELLED'],
    ['IN_PROGRESS', 'COMPLETED'],
    ['IN_PROGRESS', 'CANCELLED']
  ])('aceita a transição de %s para %s, responde 200 e grava o novo status', async (de, para) => {
    // Arrange
    const tarefa = await criarTarefa(de)

    // Act
    const res = await request(app).put(`/api/tasks/${tarefa.id}`).send({ status: para })

    // Assert: resposta
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe(para)

    // Assert: efeito no banco
    const noBanco = await prisma.task.findUnique({ where: { id: tarefa.id } })
    expect(noBanco?.status).toBe(para)
  })

  // Transições não listadas na tabela da RN01 (proibidas)
  it.each<[Status, Status]>([
    ['PENDING', 'COMPLETED'],
    ['IN_PROGRESS', 'PENDING'],
    ['COMPLETED', 'PENDING'], // exemplo da especificação
    ['COMPLETED', 'IN_PROGRESS'],
    ['COMPLETED', 'CANCELLED'],
    ['CANCELLED', 'PENDING'],
    ['CANCELLED', 'IN_PROGRESS'],
    ['CANCELLED', 'COMPLETED']
  ])(
    'rejeita a transição de %s para %s com 400 e mantém a tarefa inalterada no banco',
    async (de, para) => {
      // Arrange
      const tarefa = await criarTarefa(de)

      // Act
      const res = await request(app).put(`/api/tasks/${tarefa.id}`).send({ status: para })

      // Assert: resposta de erro no formato do contrato
      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(typeof res.body.error).toBe('string')

      // Assert: o registro no banco é idêntico ao anterior (status e updatedAt)
      const noBanco = await prisma.task.findUnique({ where: { id: tarefa.id } })
      expect(noBanco).toEqual(tarefa)
    }
  )

  it('rejeita transição proibida enviada junto com outros campos, sem alterar nenhum deles', async () => {
    // Arrange
    const tarefa = await criarTarefa('COMPLETED')

    // Act
    const res = await request(app)
      .put(`/api/tasks/${tarefa.id}`)
      .send({ title: 'Título novo', status: 'PENDING' })

    // Assert
    expect(res.status).toBe(400)
    expect(await prisma.task.findUnique({ where: { id: tarefa.id } })).toEqual(tarefa)
  })

  it('responde 404 ao atualizar tarefa inexistente', async () => {
    // Arrange: uma tarefa existente que não deve ser afetada
    const tarefa = await criarTarefa('PENDING')

    // Act
    const res = await request(app)
      .put(`/api/tasks/${ID_INEXISTENTE}`)
      .send({ status: 'IN_PROGRESS' })

    // Assert
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    expect(typeof res.body.error).toBe('string')
    expect(await prisma.task.findUnique({ where: { id: tarefa.id } })).toEqual(tarefa)
  })
})
