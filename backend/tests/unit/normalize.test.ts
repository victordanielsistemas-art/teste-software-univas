import { describe, it, expect } from 'vitest'
import { normalizeName } from '../../src/utils/normalize'

// RN03 — Normalização de nomes (normalizeName(name))
// Valores esperados derivados exclusivamente de docs/especificacao.md.
describe('normalizeName', () => {
  it('normaliza o exemplo da especificação ("  Trabalho   da  Faculdade " → "trabalho da faculdade")', () => {
    // Arrange
    const nome = '  Trabalho   da  Faculdade '

    // Act
    const resultado = normalizeName(nome)

    // Assert
    expect(resultado).toBe('trabalho da faculdade')
  })

  describe('passo 1 — remove espaços em branco no início e no fim', () => {
    it.each([
      ['espaços no início', '   trabalho', 'trabalho'],
      ['espaços no fim', 'trabalho   ', 'trabalho'],
      ['espaços no início e no fim', '  trabalho  ', 'trabalho'],
      ['tabulação e quebra de linha nas pontas', '\t\ntrabalho\n\t', 'trabalho'],
    ])('remove %s', (_descricao, entrada, esperado) => {
      // Act
      const resultado = normalizeName(entrada)

      // Assert
      expect(resultado).toBe(esperado)
    })
  })

  describe('passo 2 — substitui sequências de espaços internos por um único espaço', () => {
    it.each([
      ['vários espaços', 'trabalho    da   faculdade', 'trabalho da faculdade'],
      ['tabulação', 'trabalho\tda\tfaculdade', 'trabalho da faculdade'],
      ['quebra de linha', 'trabalho\nda\nfaculdade', 'trabalho da faculdade'],
      ['mistura de espaço, tabulação e quebra de linha', 'trabalho \t\n da', 'trabalho da'],
    ])('substitui %s por um único espaço', (_descricao, entrada, esperado) => {
      // Act
      const resultado = normalizeName(entrada)

      // Assert
      expect(resultado).toBe(esperado)
    })

    it('mantém um único espaço interno inalterado (valor-limite)', () => {
      // Act
      const resultado = normalizeName('trabalho da')

      // Assert
      expect(resultado).toBe('trabalho da')
    })
  })

  describe('passo 3 — converte para letras minúsculas', () => {
    it.each([
      ['tudo em maiúsculas', 'TRABALHO', 'trabalho'],
      ['maiúsculas e minúsculas misturadas', 'TrAbAlHo', 'trabalho'],
      ['letras acentuadas maiúsculas', 'AÇÃO', 'ação'],
    ])('converte %s', (_descricao, entrada, esperado) => {
      // Act
      const resultado = normalizeName(entrada)

      // Assert
      expect(resultado).toBe(esperado)
    })
  })

  describe('valores-limite', () => {
    it('retorna string vazia para entrada vazia', () => {
      // Act
      const resultado = normalizeName('')

      // Assert
      expect(resultado).toBe('')
    })

    it('retorna string vazia para entrada composta apenas por espaços em branco', () => {
      // Act
      const resultado = normalizeName(' \t\n ')

      // Assert
      expect(resultado).toBe('')
    })

    it('mantém inalterado um nome já normalizado', () => {
      // Act
      const resultado = normalizeName('trabalho da faculdade')

      // Assert
      expect(resultado).toBe('trabalho da faculdade')
    })

    it('mantém inalterado um nome de um único caractere minúsculo', () => {
      // Act
      const resultado = normalizeName('a')

      // Assert
      expect(resultado).toBe('a')
    })
  })

  describe('detecção de duplicados', () => {
    it('considera duplicados nomes que resultam no mesmo nome normalizado', () => {
      // Arrange
      const nomeA = 'Trabalho da Faculdade'
      const nomeB = '  TRABALHO\t da   faculdade\n'

      // Act
      const normalizadoA = normalizeName(nomeA)
      const normalizadoB = normalizeName(nomeB)

      // Assert
      expect(normalizadoA).toBe(normalizadoB)
    })

    it('não considera duplicados nomes que diferem após a normalização', () => {
      // Arrange
      const nomeA = 'Trabalho da Faculdade'
      const nomeB = 'Trabalho de Faculdade'

      // Act
      const normalizadoA = normalizeName(nomeA)
      const normalizadoB = normalizeName(nomeB)

      // Assert
      expect(normalizadoA).not.toBe(normalizadoB)
    })
  })
})
