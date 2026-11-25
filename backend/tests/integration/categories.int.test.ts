import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { prisma, resetDb, seedUserAndCategory } from './helpers/db'

// Contratos API03 e API04 (docs/especificacao.md).
// Os valores esperados vêm da especificação, não da implementação.

// Id com formato válido de cuid, mas que nunca é gravado no banco.
const ID_INEXISTENTE = 'cl0000000000000000000000'

describe('DELETE /api/categories/:id (API03 / RN02)', () => {
  beforeEach(async () => {
    await resetDb()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('exclui uma categoria sem tarefas, responde 200 e remove do banco', async () => {
    // Arrange
    const categoria = await prisma.category.create({ data: { name: 'estudos' } })

    // Act
    const res = await request(app).delete(`/api/categories/${categoria.id}`)

    // Assert: resposta
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    // Assert: efeito no banco
    expect(await prisma.category.findUnique({ where: { id: categoria.id } })).toBeNull()
  })

  it('exclui apenas a categoria indicada, mantendo as demais no banco', async () => {
    // Arrange
    const alvo = await prisma.category.create({ data: { name: 'estudos' } })
    const outra = await prisma.category.create({ data: { name: 'lazer' } })

    // Act
    const res = await request(app).delete(`/api/categories/${alvo.id}`)

    // Assert
    expect(res.status).toBe(200)
    expect(await prisma.category.findUnique({ where: { id: outra.id } })).not.toBeNull()
    expect(await prisma.category.count()).toBe(1)
  })

  it('responde 400 ao excluir categoria com uma tarefa (valor-limite) e mantém categoria e tarefa', async () => {
    // Arrange
    const { user, category } = await seedUserAndCategory()
    const tarefa = await prisma.task.create({
      data: { title: 'Prova', userId: user.id, categoryId: category.id }
    })

    // Act
    const res = await request(app).delete(`/api/categories/${category.id}`)

    // Assert: resposta de erro no formato do contrato
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(typeof res.body.error).toBe('string')

    // Assert: nada foi removido do banco
    expect(await prisma.category.findUnique({ where: { id: category.id } })).not.toBeNull()
    expect(await prisma.task.findUnique({ where: { id: tarefa.id } })).not.toBeNull()
  })

  it('responde 400 ao excluir categoria com várias tarefas e mantém todas no banco', async () => {
    // Arrange
    const { user, category } = await seedUserAndCategory()
    await prisma.task.createMany({
      data: [
        { title: 'Prova', userId: user.id, categoryId: category.id },
        { title: 'Trabalho', userId: user.id, categoryId: category.id },
        { title: 'Seminário', userId: user.id, categoryId: category.id }
      ]
    })

    // Act
    const res = await request(app).delete(`/api/categories/${category.id}`)

    // Assert
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(await prisma.category.count()).toBe(1)
    expect(await prisma.task.count({ where: { categoryId: category.id } })).toBe(3)
  })

  it('responde 404 ao excluir categoria inexistente', async () => {
    // Arrange: uma categoria existente que não deve ser afetada
    await prisma.category.create({ data: { name: 'estudos' } })

    // Act
    const res = await request(app).delete(`/api/categories/${ID_INEXISTENTE}`)

    // Assert
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    expect(typeof res.body.error).toBe('string')
    expect(await prisma.category.count()).toBe(1)
  })
})

describe('POST /api/categories (API04 / RN03)', () => {
  beforeEach(async () => {
    await resetDb()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('cria categoria com nome inédito, responde 201 e grava no banco', async () => {
    // Act
    const res = await request(app).post('/api/categories').send({ name: 'Trabalho' })

    // Assert: resposta
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)

    // Assert: efeito no banco
    expect(await prisma.category.count()).toBe(1)
  })

  it('cria categoria cujo nome normalizado difere de um existente por um caractere (valor-limite)', async () => {
    // Arrange
    await prisma.category.create({ data: { name: 'trabalho' } })

    // Act
    const res = await request(app).post('/api/categories').send({ name: 'Trabalhos' })

    // Assert
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(await prisma.category.count()).toBe(2)
  })

  it.each([
    // [nome existente no banco, nome enviado]
    [' trabalho ', 'Trabalho'], // exemplo da especificação
    ['trabalho', 'trabalho'], // nome idêntico
    ['trabalho', 'TRABALHO'], // só maiúsculas/minúsculas (passo 3)
    ['trabalho', '   trabalho   '], // só espaços nas pontas (passo 1)
    ['Trabalho da Faculdade', '  trabalho   da\tFACULDADE\n'] // todos os passos
  ])(
    'responde 409 e não cria categoria quando já existe %j e é enviado %j',
    async (existente, enviado) => {
      // Arrange
      await prisma.category.create({ data: { name: existente } })

      // Act
      const res = await request(app).post('/api/categories').send({ name: enviado })

      // Assert: resposta de conflito no formato do contrato
      expect(res.status).toBe(409)
      expect(res.body.success).toBe(false)
      expect(typeof res.body.error).toBe('string')

      // Assert: nenhuma categoria nova no banco
      expect(await prisma.category.count()).toBe(1)
    }
  )
})
