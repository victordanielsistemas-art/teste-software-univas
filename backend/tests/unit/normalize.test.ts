import { describe, it, expect } from 'vitest'
import { normalizeName } from '../../src/utils/normalize'

describe('normalizeName — RN03', () => {
  it.each([
    ['  Trabalho   da  Faculdade ', 'trabalho da faculdade'],
    ['Categoria', 'categoria'],
    ['  Categoria  ', 'categoria'],
    ['Nome   com    espaços', 'nome com espaços'],
    ['Nome\tcom\ttab', 'nome com tab'],
    ['Nome\ncom\nquebra', 'nome com quebra'],
    ['  Nome \t\n com   espaços  ', 'nome com espaços'],
  ])('normaliza %j para %j', (entrada, esperado) => {
    expect(normalizeName(entrada)).toBe(esperado)
  })

  it('produz nomes iguais para categorias que normalizam ao mesmo valor', () => {
    const primeiroNome = normalizeName(' Categoria ')
    const segundoNome = normalizeName('categoria')

    expect(primeiroNome).toBe(segundoNome)
  })
})
