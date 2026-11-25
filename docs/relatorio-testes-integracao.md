# Relatório — Testes de integração com IA generativa

**Aluno(s): Guilherme Henrique**
**Ferramenta de IA utilizada:** Claude Code
**Requisitos testados:** backend — API03, API04 e API05 (`backend/src/controllers`, via Supertest e banco de teste real `teste_software_test_db`); frontend — RF08 e RF09 (`frontend/src/components/Users.tsx`, com a API simulada pelo MSW)

# Backend — API03, API04 e API05

Arquivos: `backend/tests/integration/categories.int.test.ts` (API03 e API04) e
`backend/tests/integration/tasks.int.test.ts` (API05). Os testes usam Supertest sobre `app`
e o banco de teste real `teste_software_test_db` (sem `vi.mock` no Prisma), com `resetDb()`
no `beforeEach` e `prisma.$disconnect()` no `afterAll`.

## 1. Tabela de casos

### API03 — `DELETE /api/categories/:id` (aplica a RN02)

| # | Entrada (estado do banco → requisição) | Resposta esperada | Efeito no banco | Técnica | Regra |
|---|----------------------------------------|-------------------|-----------------|---------|-------|
| 1 | Categoria sem tarefas → `DELETE` dessa categoria | `200`, `success: true` | A categoria deixa de existir | Partição válida | API03 / RN02 (`tasksCount === 0`) |
| 2 | Duas categorias sem tarefas → `DELETE` de uma | `200` | Só a categoria indicada é removida; a outra permanece (total = 1) | Partição válida (isolamento do efeito) | API03 |
| 3 | Categoria com **1** tarefa → `DELETE` | `400`, `success: false`, `error` texto | Categoria e tarefa permanecem | Valor-limite (menor quantidade proibida) | API03 / RN02 |
| 4 | Categoria com 3 tarefas → `DELETE` | `400`, `success: false` | Categoria e as 3 tarefas permanecem | Partição inválida ("uma ou mais") | API03 / RN02 |
| 5 | Id inexistente → `DELETE` | `404`, `success: false`, `error` texto | Categorias existentes permanecem (total = 1) | Inválido (recurso inexistente) | API03 |

### API04 — `POST /api/categories` (aplica a RN03)

| # | Entrada (estado do banco → corpo enviado) | Resposta esperada | Efeito no banco | Técnica | Regra |
|---|-------------------------------------------|-------------------|-----------------|---------|-------|
| 6 | Banco vazio → `{ name: "Trabalho" }` | `201`, `success: true` | 1 categoria criada | Partição válida (nome inédito) | API04 |
| 7 | Existe `"trabalho"` → `{ name: "Trabalhos" }` | `201` | 2 categorias | Valor-limite (difere por 1 caractere após normalizar) | API04 / RN03 |
| 8 | Existe `" trabalho "` → `{ name: "Trabalho" }` | `409`, `success: false`, `error` texto | Nenhuma categoria criada (total = 1) | Inválido (exemplo da especificação) | API04 / RN03 |
| 9 | Existe `"trabalho"` → `{ name: "trabalho" }` | `409` | Total = 1 | Inválido (nome idêntico) | API04 / RN03 |
| 10 | Existe `"trabalho"` → `{ name: "TRABALHO" }` | `409` | Total = 1 | Inválido (difere só no passo 3) | API04 / RN03 passo 3 |
| 11 | Existe `"trabalho"` → `{ name: "   trabalho   " }` | `409` | Total = 1 | Inválido (difere só no passo 1) | API04 / RN03 passo 1 |
| 12 | Existe `"Trabalho da Faculdade"` → `{ name: "  trabalho   da\tFACULDADE\n" }` | `409` | Total = 1 | Inválido (passos 1, 2 e 3 combinados) | API04 / RN03 |

### API05 — `PUT /api/tasks/:id` (aplica a RN01 e a RN04)

| # | Entrada (status atual → corpo enviado) | Resposta esperada | Efeito no banco | Técnica | Regra |
|---|----------------------------------------|-------------------|-----------------|---------|-------|
| 13 | `PENDING` → `{ status: "IN_PROGRESS" }` | `200`, `data.status = IN_PROGRESS` | Status gravado `IN_PROGRESS` | Partição válida | API05 / RN01 |
| 14 | `PENDING` → `{ status: "CANCELLED" }` | `200` | Status gravado `CANCELLED` | Partição válida | API05 / RN01 ("pendente pode ser cancelada") |
| 15 | `IN_PROGRESS` → `{ status: "COMPLETED" }` | `200` | Status gravado `COMPLETED` | Partição válida | API05 / RN01 |
| 16 | `IN_PROGRESS` → `{ status: "CANCELLED" }` | `200` | Status gravado `CANCELLED` | Partição válida | API05 / RN01 |
| 17 | `PENDING` → `COMPLETED` | `400`, `success: false`, `error` texto | Registro idêntico ao anterior (inclusive `updatedAt`) | Inválido (pula etapa) | API05 / RN04 |
| 18 | `IN_PROGRESS` → `PENDING` | `400` | Registro inalterado | Inválido (retrocesso) | API05 / RN04 |
| 19 | `COMPLETED` → `PENDING` | `400` | Registro inalterado | Inválido (exemplo da especificação) | API05 / RN04 |
| 20 | `COMPLETED` → `IN_PROGRESS` | `400` | Registro inalterado | Inválido (status final) | API05 / RN04 |
| 21 | `COMPLETED` → `CANCELLED` | `400` | Registro inalterado | Inválido (status final) | API05 / RN04 |
| 22 | `CANCELLED` → `PENDING` | `400` | Registro inalterado | Inválido (status final) | API05 / RN04 |
| 23 | `CANCELLED` → `IN_PROGRESS` | `400` | Registro inalterado | Inválido (status final) | API05 / RN04 |
| 24 | `CANCELLED` → `COMPLETED` | `400` | Registro inalterado | Inválido (status final) | API05 / RN04 |
| 25 | `COMPLETED` → `{ title: "Título novo", status: "PENDING" }` | `400` | Registro inalterado (nem o título muda) | Inválido (transição proibida + outro campo) | API05 / RN04 ("sem alterar a tarefa") |
| 26 | Id inexistente → `{ status: "IN_PROGRESS" }` | `404`, `success: false`, `error` texto | Tarefa existente permanece inalterada | Inválido (recurso inexistente) | API05 |

## 2. Prompt utilizado

```
precisamos fazer agora a api03, api04, api05 e o rf08 e rf09 com base no oráculo e nessa especificação Backend: API03, API04 e API05. Frontend: RF08 e RF09 (componente Users). Registro em docs/relatorio-testes-unitarios.md, com a coluna "Efeito no banco".
```

## 3. Revisão do teste gerado

| Problema encontrado no teste gerado | Ajuste solicitado ou realizado |
|-------------------------------------|--------------------------------|
| `npm run test:integration` no terminal do Windows falhou antes de qualquer teste com `P1000: Authentication failed`. Causa: há um PostgreSQL instalado no Windows escutando na porta 5432 ao mesmo tempo que o container; a conexão `localhost:5432` chega ao PostgreSQL local, que não tem a senha `postgres123`. Não é defeito do código nem dos testes. | Os testes foram executados **dentro do container do backend**: `docker compose exec backend npm run test:integration`. Lá a variável `TEST_DATABASE_URL` aponta para o host `postgres` (banco `teste_software_test_db`), caminho previsto em `helpers/testDatabase.ts`. Nenhum helper nem configuração foi alterado. Os testes de integração do backend devem ser executados dentro do container. |
| O caso 9 (nome idêntico) passa, mas só por causa da restrição `@unique` da coluna `name` no banco, não por normalização. | Mantido: o resultado esperado (`409`) vem da especificação. Os casos 8, 10, 11 e 12 são os que de fato verificam a normalização. |
| A especificação da API04 não define o formato do nome gravado (normalizado ou como digitado) nem o conteúdo de `data` no `201`. | Os casos 6 e 7 verificam só o status, `success` e a quantidade de registros no banco; nenhum valor foi tirado do código. |
| A API05 não diz o que acontece ao enviar o **mesmo** status (ex.: `PENDING` → `PENDING`). A RN01 diz que isso "não é uma transição", mas a RN04 fala em "alteração de status"; enviar o mesmo status pode ser lido como "sem alteração" (aceito) ou como transição proibida (`400`). | Não foi criado teste para esse caso: não há oráculo inequívoco. Lacuna registrada no tópico 5. |
| Para verificar que a "tarefa permanece inalterada no banco", o teste compara o registro inteiro lido depois da requisição com o registro criado no *Arrange* (`toEqual(tarefa)`), o que também detecta mudança de `updatedAt` e de outros campos. | Mantido. |
| Para o caso "inexistente", foi usado um id fixo com formato de cuid que nunca é gravado. | Mantido; não depende de dados aleatórios. |

## 4. Resultados

Comando: `docker compose exec backend npm run test:integration`, com os containers `backend` e `postgres` ativos (inclui o exemplo `users.int.test.ts`). Banco usado: `teste_software_test_db` em `postgres:5432`, recriado pelo `prisma db push --force-reset` no início da execução.

- Testes criados: 26 (API03: 5, API04: 7, API05: 14) | aprovados: 11 | reprovados: 15
  - API03: 4 aprovados, 1 reprovado (caso 5)
  - API04: 3 aprovados, 4 reprovados (casos 8, 10, 11 e 12)
  - API05: 4 aprovados, 10 reprovados (casos 17 a 26)
- Suíte de integração completa: 28 testes, 13 aprovados, 15 reprovados.

## 5. Defeitos encontrados (divergências entre especificação e código)

| Regra | Comportamento especificado | Comportamento observado | Teste que evidencia |
|-------|----------------------------|-------------------------|---------------------|
| API03 | Categoria inexistente: `404`. | `500` (`Failed to delete category`). O Prisma 6.19 lança `P2025` com a mensagem *"No record was found for a delete."*, e o controller só reconhece o texto antigo *"Record to delete does not exist"*, então o erro cai no tratamento genérico. | `DELETE /api/categories/:id (API03 / RN02) > responde 404 ao excluir categoria inexistente` |
| API04 / RN03 | Nome que, após a normalização, coincide com um existente: `409`, e nenhuma categoria é criada. | `201`, e a categoria duplicada é gravada no banco. O nome não é normalizado antes da comparação; só nomes idênticos são barrados (pela restrição `@unique` do banco). | `POST /api/categories (API04 / RN03) > responde 409 e não cria categoria quando já existe ...` (casos 8, 10, 11 e 12) |
| API05 / RN04 | Transição proibida pela RN01: `400`, e a tarefa permanece inalterada. | `200`, e o novo status (e os demais campos enviados) é gravado. A API não aplica a RN01 na atualização. | `PUT /api/tasks/:id (API05 / RN01 / RN04) > rejeita a transição de ...` (casos 17 a 24) e `> rejeita transição proibida enviada junto com outros campos, sem alterar nenhum deles` (caso 25) |
| API05 | Tarefa inexistente: `404`. | `500` (`Failed to update task`). Mesma causa da API03: a mensagem do Prisma 6.19 é *"No record was found for an update."*, e o controller procura *"Record to update not found"*. | `PUT /api/tasks/:id (API05 / RN01 / RN04) > responde 404 ao atualizar tarefa inexistente` |
| API05 (lacuna da especificação, não defeito do código) | Não define a resposta para o envio do mesmo status atual (`PENDING` → `PENDING`). | Não verificável sem oráculo. | — |

Observação: o defeito da RN01 já registrado nos testes unitários (`PENDING` → `CANCELLED` proibido) **não** aparece aqui, porque o `PUT` não chama `canTransition`; o caso 14 passa justamente porque nenhuma validação é feita.

---

# Frontend — RF08 e RF09 (`frontend/src/components/Users.tsx`)

Arquivo: `frontend/tests/integration/Users.create.int.test.tsx`. A API é simulada com MSW
(`server.use(http.get(...), http.post(...))`); a requisição real do Axios acontece, e os
handlers respondem no formato do contrato (`{ success, data }` / `{ success: false, error }`).
Não há banco no frontend: a coluna "Efeito no banco" registra o efeito na API simulada
(requisição recebida pelo handler).

## 1. Tabela de casos

| # | Entrada (ação do usuário / resposta simulada) | Resultado esperado na tela | Efeito no banco (API simulada) | Técnica | Regra |
|---|-----------------------------------------------|----------------------------|--------------------------------|---------|-------|
| 1 | Preenche Nome "Bruno Lima" e Email "bruno@email.com" e clica "Criar"; `POST` → `201` | — | O handler de `POST /api/users` recebe exatamente `{ name: "Bruno Lima", email: "bruno@email.com" }`, uma única vez | Partição válida | RF08 ("os dados digitados são enviados à API") / API01 |
| 2 | Mesmo fluxo; `POST` → `201` | Formulário fechado: sem botão "Criar" e sem campos Nome/Email | `POST` recebido | Partição válida | RF08 ("o formulário é fechado") |
| 3 | Mesmo fluxo; `GET` inicial → lista vazia; `GET` após o `POST` → lista com o novo usuário | Linha com "Bruno Lima", "bruno@email.com" e `0` tarefas | `GET /api/users` chamado 2 vezes (carga inicial + recarga) | Partição válida (lista vazia → 1 usuário) | RF08 ("a lista, recarregada, passa a exibir o novo usuário") / API02 |
| 4 | Mesmo fluxo; `POST` → `409` `{ success: false, error: "Email already exists" }` | Mensagem "Email já cadastrado" exibida | `POST` recebido; nenhum usuário adicionado | Inválido (email duplicado) | RF09 |
| 5 | Mesmo fluxo; `POST` → `409` | Formulário aberto (botão "Criar" visível), Nome = "Bruno Lima", Email = "bruno@email.com" | `POST` recebido com os dados digitados | Inválido (email duplicado) | RF09 ("o formulário permanece aberto com os dados digitados") |

## 2. Prompt utilizado

Mesmo prompt da seção anterior (backend e frontend pedidos juntos).

## 3. Revisão do teste gerado

| Problema encontrado no teste gerado | Ajuste solicitado ou realizado |
|-------------------------------------|--------------------------------|
| Como na RF01, o `vitest.config.ts` não habilita `globals`, então não há `cleanup` automático entre testes. | O arquivo já foi gerado com `afterEach(() => cleanup())`. |
| A mensagem `error` do `409` simulado ("Email already exists") não está na especificação, que só define o formato `{ success: false, error: "<mensagem>" }`. | Mantido: é só o *Arrange*. O caso 4 espera o texto da RF09 ("Email já cadastrado"), que é responsabilidade do componente, seja qual for a mensagem da API. |
| No caso 5, era preciso garantir que a requisição já tivesse acontecido antes de verificar o formulário, sem `setTimeout` real. | Usado `expect.poll` sobre os corpos recebidos pelo handler; depois as asserções sobre os campos (`toHaveValue`). |
| Os campos são localizados com `getByLabelText(/nome/i)` e `getByLabelText(/email/i)`, porque os rótulos são "Nome:" e "Email:" (com dois-pontos). | Mantido; segue a RF07 (localizar pelo rótulo). |

## 4. Resultados

Comando: `npm test` dentro de `frontend/`.

- Testes criados: 5 | aprovados: 4 | reprovados: 1 (caso 4)
- Suíte do frontend completa: 11 testes, 10 aprovados, 1 reprovado.

## 5. Defeitos encontrados (divergências entre especificação e código)

| Regra | Comportamento especificado | Comportamento observado | Teste que evidencia |
|-------|----------------------------|-------------------------|---------------------|
| RF08 | — | Nenhuma divergência encontrada. | — |
| RF09 | Resposta `409` ao criar: exibir "Email já cadastrado". | Exibe a mensagem genérica "Erro ao salvar usuário" para qualquer falha; o status `409` não é tratado de forma específica. O formulário permanece aberto com os dados digitados (essa parte está conforme). | `Users + API — email já cadastrado (RF09 / API01) > exibe a mensagem "Email já cadastrado"` |
