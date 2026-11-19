import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Users from '../../src/components/Users'
import { api } from '../../src/services/api'

const users = [
  { id: '1', name: 'Ana Silva', email: 'ana@example.com', createdAt: '2025-01-01T00:00:00.000Z', tasks: [{ id: 't1' }, { id: 't2' }] },
  { id: '2', name: 'Bruno Lima', email: 'bruno@example.com', createdAt: '2025-01-02T00:00:00.000Z' },
]

describe('Users — requisitos RF01, RF02 e RF04–RF07', () => {
  it('exibe o indicador enquanto a lista está sendo carregada (RF01)', async () => {
    let concluir!: (value: { data: { data: typeof users } }) => void
    vi.spyOn(api, 'get').mockImplementation(() => new Promise((resolve) => { concluir = resolve }) as never)

    render(<Users />)
    expect(screen.getByText('Carregando usuários...')).toBeInTheDocument()
    concluir({ data: { data: users } })
    expect(await screen.findByText('Ana Silva')).toBeInTheDocument()
  })

  it('mostra nome, email e total de tarefas, usando zero quando não há tarefas (RF02)', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: users } })
    render(<Users />)

    const ana = within(await screen.findByRole('row', { name: /Ana Silva/ }))
    const bruno = within(screen.getByRole('row', { name: /Bruno Lima/ }))
    expect(ana.getByText('ana@example.com')).toBeInTheDocument()
    expect(ana.getByText('2')).toBeInTheDocument()
    expect(bruno.getByText('bruno@example.com')).toBeInTheDocument()
    expect(bruno.getByText('0')).toBeInTheDocument()
  })

  it('abre formulário com Nome, Email e botão Criar (RF04)', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } })
    render(<Users />)
    await user.click(await screen.findByRole('button', { name: 'Adicionar Usuário' }))

    expect(screen.getByText('Nome:')).toBeInTheDocument()
    expect(screen.getByText('Email:')).toBeInTheDocument()
    expect(screen.getAllByRole('textbox')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Criar' })).toBeInTheDocument()
  })

  it('fecha o formulário e limpa os campos ao cancelar (RF05)', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } })
    render(<Users />)
    await user.click(await screen.findByRole('button', { name: 'Adicionar Usuário' }))
    const [nome, email] = screen.getAllByRole('textbox')
    await user.type(nome, 'Carla')
    await user.type(email, 'carla@example.com')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Adicionar Usuário' }))
    const [nomeLimpo, emailLimpo] = screen.getAllByRole('textbox')
    expect(nomeLimpo).toHaveValue('')
    expect(emailLimpo).toHaveValue('')
  })

  it('abre o formulário preenchido com os dados selecionados e mostra Atualizar (RF06)', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: users } })
    render(<Users />)
    await user.click(await screen.findByRole('button', { name: 'Editar' }))

    const [nome, email] = screen.getAllByRole('textbox')
    expect(nome).toHaveValue('Ana Silva')
    expect(email).toHaveValue('ana@example.com')
    expect(screen.getByRole('button', { name: 'Atualizar' })).toBeInTheDocument()
  })

  it('associa cada rótulo ao respectivo campo do formulário (RF07)', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } })
    render(<Users />)
    await user.click(await screen.findByRole('button', { name: 'Adicionar Usuário' }))

    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })
})
