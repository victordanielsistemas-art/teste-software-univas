import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, waitForElementToBeRemoved } from '@testing-library/react'
import Users from '../../src/components/Users'
import { api } from '../../src/services/api'

// Requisito RF01 (docs/especificacao.md): enquanto a lista é carregada,
// o texto "Carregando usuários..." é exibido.

const TEXTO_CARREGANDO = 'Carregando usuários...'

// Cria uma promessa controlada manualmente pelo teste, para manter a
// requisição "em andamento" pelo tempo necessário (sem setTimeout real).
function criarRequisicaoPendente() {
  let resolver!: (valor: unknown) => void
  let rejeitar!: (motivo: unknown) => void
  const promessa = new Promise((res, rej) => {
    resolver = res
    rejeitar = rej
  })
  return { promessa, resolver, rejeitar }
}

const usuarioExemplo = {
  id: '1',
  name: 'Ana Souza',
  email: 'ana@example.com',
  createdAt: '2026-01-15T10:00:00.000Z',
  tasks: []
}

describe('Users — indicador de carregamento (RF01)', () => {
  // O projeto não habilita `globals` no Vitest, então o cleanup automático do
  // Testing Library não é registrado: sem isto, cada render se acumula no DOM.
  afterEach(() => cleanup())

  it('exibe "Carregando usuários..." enquanto a requisição da lista está pendente', () => {
    // Arrange: a chamada GET não termina durante o teste
    const { promessa } = criarRequisicaoPendente()
    const get = vi.spyOn(api, 'get').mockReturnValue(promessa as never)

    // Act
    render(<Users />)

    // Assert: verificação síncrona — nenhuma resposta foi entregue ainda
    expect(get).toHaveBeenCalledTimes(1)
    expect(screen.getByText(TEXTO_CARREGANDO)).toBeInTheDocument()
  })

  it.each([
    ['com usuários', [usuarioExemplo]],
    ['vazia (valor-limite)', []]
  ])('remove o texto de carregamento quando a lista %s é recebida', async (_descricao, usuarios) => {
    // Arrange
    const { promessa, resolver } = criarRequisicaoPendente()
    vi.spyOn(api, 'get').mockReturnValue(promessa as never)
    render(<Users />)
    expect(screen.getByText(TEXTO_CARREGANDO)).toBeInTheDocument()

    // Act: a API responde com sucesso
    resolver({ data: { data: usuarios } })

    // Assert: o carregamento terminou, então o texto deixa de ser exibido
    await waitForElementToBeRemoved(() => screen.queryByText(TEXTO_CARREGANDO))
    expect(screen.queryByText(TEXTO_CARREGANDO)).not.toBeInTheDocument()
  })

  it('remove o texto de carregamento quando a requisição da lista falha', async () => {
    // Arrange
    const { promessa, rejeitar } = criarRequisicaoPendente()
    vi.spyOn(api, 'get').mockReturnValue(promessa as never)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<Users />)
    expect(screen.getByText(TEXTO_CARREGANDO)).toBeInTheDocument()

    // Act: a API falha (caso inválido)
    rejeitar(new Error('Network error'))

    // Assert: o carregamento também termina em caso de erro
    await waitForElementToBeRemoved(() => screen.queryByText(TEXTO_CARREGANDO))
    expect(screen.queryByText(TEXTO_CARREGANDO)).not.toBeInTheDocument()
  })
})
