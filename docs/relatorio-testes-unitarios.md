# Relatório — Testes unitários com IA generativa

**Aluno(s):** (preencher)
**Ferramenta de IA utilizada:** Codex
**Unidade testada:** `frontend/src/components/Users.tsx` — RF01, RF02, RF04, RF05, RF06 e RF07 (RF03 é o teste de referência existente)

## 1. Tabela de casos (elaborada antes de usar a IA)

| # | Preparação | Ação do usuário | Resultado esperado | Técnica | Regra |
|---|---|---|---|---|---|
| 1 | Listagem pendente, resposta HTTP controlada | Abrir Users e aguardar a resposta | Exibe “Carregando usuários...” até concluir o carregamento | Partição temporal | RF01 |
| 2 | Resposta contém Ana com 2 tarefas e Bruno sem tarefas | Abrir Users | Linhas mostram nome, email e quantidades 2 e 0 | Partição válida / limite zero | RF02 |
| 3 | Lista carregada | Clicar em “Adicionar Usuário” | Formulário apresenta campos Nome e Email e botão Criar | Partição válida | RF04 |
| 4 | Formulário aberto e preenchido | Clicar em “Cancelar” e reabrir | Formulário fecha; ao reabrir, os campos estão vazios | Estado / valor inicial | RF05 |
| 5 | Lista carregada com Ana | Clicar em “Editar” na linha de Ana | Formulário mostra Ana e seu email, com botão Atualizar | Partição válida | RF06 |
| 6 | Formulário de inclusão aberto | Localizar os campos pelos respectivos rótulos | Nome e Email identificam os campos associados | Acessibilidade / caso inválido | RF07 |

## 2. Prompt utilizado

```text
ATIVIDADE PRÁTICA 15. Para o componente Users, criar testes para RF01, RF02,
RF04, RF05, RF06 e RF07. RF03 é o teste de referência existente. Derive os
resultados esperados de docs/especificacao.md, use Vitest, React Testing Library
e user-event; isole as chamadas HTTP; use nomes de testes em português e não
altere arquivos de src/. Atualize este relatório com os casos, resultados e
defeitos observados. Não corrija defeitos no código de produção.
```

## 3. Revisão do teste gerado

| Problema encontrado no teste gerado | Ajuste solicitado ou realizado |
|---|---|
| RF07 requer rótulos associados aos campos, e não somente rótulos visíveis. | RF07 usa `getByLabelText` para detectar associação ausente; os demais comportamentos do formulário são verificados por papel e texto visível para que essa falha não os oculte. Defeito registrado, sem alteração em `src/`. |
| A listagem deve estar isolada de rede e aguardar estado assíncrono. | Respostas de `api.get` controladas com spies e a resposta pendente do RF01 é liberada explicitamente pelo teste. |

## 4. Resultados

- Testes solicitados criados: 6 (RF01, RF02, RF04, RF05, RF06, RF07); o teste de referência RF03 já existia.
- Execução: não foi possível executar. `npm.cmd test -- --reporter=verbose` informa que `vitest` não é reconhecido; as dependências do frontend não estão instaladas. Nenhuma dependência foi instalada, conforme as instruções do projeto.
- A primeira tentativa com `npm test` foi bloqueada pela política de execução do PowerShell; a tentativa com `npm.cmd` chegou ao comando de teste, mas não encontrou Vitest.
- Também tentei o Vitest presente no backend, sem instalar pacotes. A execução não iniciou: faltam no frontend `vitest/config`, `vite` e `@vitejs/plugin-react`.
- A atividade menciona quatro sabotagens, mas não especifica quais mutações devem ser aplicadas. Não foram introduzidas mutações em `src/`, que é vedado pelas instruções do projeto. Resultado da sabotagem manual: pendente das quatro definições e da execução do ambiente de testes.
- Cobertura: não medida, pois a suíte não pôde ser executada.

## 5. Defeitos encontrados (divergências entre especificação e código)

| Regra | Comportamento especificado | Comportamento observado | Teste que evidencia |
|---|---|---|---|
| RF07 | Cada campo deve estar associado ao seu rótulo e ser localizável por `getByLabelText`. | No componente, os elementos `label` não têm `htmlFor` e os `input` não têm `id` nem estão aninhados nos rótulos. A associação exigida não está presente. | `Users.requirements.test.tsx` — “associa cada rótulo ao respectivo campo do formulário (RF07)”; as consultas `getByLabelText` não encontram os campos. |

## 6. Revisão das sabotagens

As quatro sabotagens não foram detalhadas no enunciado recebido (não há lista de alterações/mutações-alvo). Por isso, não é possível atribuir com precisão quais testes falhariam em cada uma. Assim que as quatro mutações forem fornecidas, devem ser aplicadas e revertidas apenas em ambiente temporário, sem integrar mudanças em `src/` na entrega; em seguida, registrar a mutação e o teste que falhou para cada caso.
