import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, within, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import Users from '../../src/components/Users'
import { server } from '../msw/server'

// Requisitos RF08 e RF09 + contratos API01/API02 (docs/especificacao.md).
// A requisição HTTP real do Axios acontece e é interceptada pelo MSW.

// O vitest.config.ts não habilita `globals`, então o cleanup automático do
// Testing Library não é registrado: sem isto, os renders se acumulam no DOM.
afterEach(() => cleanup())

const NOVO_USUARIO = { name: 'Bruno Lima', email: 'bruno@email.com' }

async function preencherEEnviar() {
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Adicionar Usuário' }))
  await user.type(screen.getByLabelText(/nome/i), NOVO_USUARIO.name)
  await user.type(screen.getByLabelText(/email/i), NOVO_USUARIO.email)
  await user.click(screen.getByRole('button', { name: 'Criar' }))
}

describe('Users + API — criação de usuário com sucesso (RF08 / API01)', () => {
  // Arrange comum: a lista começa vazia e, depois do POST, passa a conter o novo usuário
  function prepararApi() {
    const corposRecebidos: unknown[] = []
    let usuarios: object[] = []
    let chamadasGet = 0

    server.use(
      http.get('*/api/users', () => {
        chamadasGet++
        return HttpResponse.json({ success: true, count: usuarios.length, data: usuarios })
      }),
      http.post('*/api/users', async ({ request }) => {
        const corpo = (await request.json()) as typeof NOVO_USUARIO
        corposRecebidos.push(corpo)
        const criado = { id: 'u2', ...corpo }
        usuarios = [{ ...criado, createdAt: '2026-11-20T10:00:00.000Z', tasks: [] }]
        return HttpResponse.json({ success: true, data: criado }, { status: 201 })
      })
    )

    return { corposRecebidos, getChamadasGet: () => chamadasGet }
  }

  it('envia à API exatamente o nome e o email digitados', async () => {
    // Arrange
    const { corposRecebidos } = prepararApi()
    render(<Users />)

    // Act
    await preencherEEnviar()
    await screen.findByText(NOVO_USUARIO.name)

    // Assert: corpo recebido pelo handler de POST /api/users
    expect(corposRecebidos).toEqual([NOVO_USUARIO])
  })

  it('fecha o formulário após a criação', async () => {
    // Arrange
    prepararApi()
    render(<Users />)

    // Act
    await preencherEEnviar()
    await screen.findByText(NOVO_USUARIO.name)

    // Assert
    expect(screen.queryByRole('button', { name: 'Criar' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/nome/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
  })

  it('recarrega a lista, que passa a exibir o novo usuário', async () => {
    // Arrange
    const { getChamadasGet } = prepararApi()
    render(<Users />)

    // Act
    await preencherEEnviar()

    // Assert: a linha do novo usuário aparece com nome, email e 0 tarefas
    const linha = (await screen.findByText(NOVO_USUARIO.name)).closest('tr')!
    expect(within(linha).getByText(NOVO_USUARIO.email)).toBeInTheDocument()
    expect(within(linha).getByText('0')).toBeInTheDocument()
    // carregamento inicial + recarga após a criação
    expect(getChamadasGet()).toBe(2)
  })
})

describe('Users + API — email já cadastrado (RF09 / API01)', () => {
  // Arrange comum: a API responde 409 no formato de erro do contrato
  function prepararApi() {
    const corposRecebidos: unknown[] = []
    server.use(
      http.get('*/api/users', () => HttpResponse.json({ success: true, count: 0, data: [] })),
      http.post('*/api/users', async ({ request }) => {
        corposRecebidos.push(await request.json())
        return HttpResponse.json(
          { success: false, error: 'Email already exists' },
          { status: 409 }
        )
      })
    )
    return { corposRecebidos }
  }

  it('exibe a mensagem "Email já cadastrado"', async () => {
    // Arrange
    prepararApi()
    render(<Users />)

    // Act
    await preencherEEnviar()

    // Assert
    expect(await screen.findByText('Email já cadastrado')).toBeInTheDocument()
  })

  it('mantém o formulário aberto com os dados digitados', async () => {
    // Arrange
    const { corposRecebidos } = prepararApi()
    render(<Users />)

    // Act
    await preencherEEnviar()

    // Assert: a requisição foi feita com os dados digitados...
    await expect.poll(() => corposRecebidos).toEqual([NOVO_USUARIO])
    // ...e o formulário continua aberto e preenchido
    expect(screen.getByRole('button', { name: 'Criar' })).toBeInTheDocument()
    expect(screen.getByLabelText(/nome/i)).toHaveValue(NOVO_USUARIO.name)
    expect(screen.getByLabelText(/email/i)).toHaveValue(NOVO_USUARIO.email)
  })
})
