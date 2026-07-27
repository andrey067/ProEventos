# Feature Specification: Eventos List UX, Pagination & Lotes Cards

**Feature Branch**: `006-eventos-list-ux`

**Created**: 2026-07-26

**Status**: Draft

**Input**: User description: "para os 3 projetos de frontend: coluna à esquerda de Tema com imagens de eventos do Unsplash (request free, sem passar JWT para o Unsplash) com botão hide/show; paginação de 10 itens por vez com seleção 10/20/30; backend com dados via Bogus; formatação de data dd/MM/yyyy em todos os projetos; em editar, cada lote em card próprio com data início e data fim e campos nomeados/validados; todas as datas em dd/MM/yyyy"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Listar eventos com imagem e paginação (Priority: P1)

Como organizador, quero ver a lista de eventos com uma coluna de imagem à esquerda de Tema, poder ocultar/mostrar essa imagem, e navegar a lista em páginas de 10, 20 ou 30 itens, para localizar eventos com conforto visual e sem carregar tudo de uma vez.

**Why this priority**: É a superfície principal de uso diário; sem lista paginada e legível o restante da UX não entrega valor completo nos três frontends.

**Independent Test**: Com volume suficiente de eventos, abrir a lista em qualquer frontend, confirmar coluna de imagem à esquerda de Tema, alternar hide/show, mudar tamanho de página e avançar/voltar páginas.

**Acceptance Scenarios**:

1. **Given** existem mais eventos do que o tamanho de página selecionado, **When** o usuário abre a lista de eventos, **Then** vê no máximo o número de itens da página atual (padrão 10) e controles de paginação claros.
2. **Given** a lista está visível, **When** o usuário escolhe 10, 20 ou 30 itens por página, **Then** a lista recarrega/exibe essa quantidade (ou menos na última página) e o total de páginas se ajusta.
3. **Given** a lista está visível, **When** o usuário olha as colunas, **Then** existe uma coluna de imagem imediatamente à esquerda da coluna Tema.
4. **Given** a coluna de imagem está visível, **When** o usuário aciona o botão de hide, **Then** as imagens (ou a coluna de imagem) deixam de ser exibidas sem perder os demais dados da linha.
5. **Given** a imagem está oculta, **When** o usuário aciona o botão de show, **Then** as imagens voltam a aparecer na mesma posição relativa à coluna Tema.
6. **Given** um evento na lista, **When** a imagem é carregada, **Then** ela é uma foto relacionada a eventos obtida do serviço gratuito Unsplash, e a credencial/JWT da aplicação ProEventos **não** é enviada ao Unsplash.

---

### User Story 2 - Datas sempre em dd/MM/yyyy (Priority: P1)

Como usuário dos três frontends, quero ver e informar todas as datas no formato dd/MM/yyyy (lista, detalhe, criação e edição de eventos e lotes), para ler e preencher datas de forma uniforme e sem ambiguidade.

**Why this priority**: Formato inconsistente gera erro de leitura e validação; é requisito transversal de todos os projetos.

**Independent Test**: Percorrer lista, formulário de evento e cards de lotes e verificar que qualquer data exibida ou editável está em dd/MM/yyyy.

**Acceptance Scenarios**:

1. **Given** um evento com data cadastrada, **When** o usuário vê a lista ou o formulário, **Then** a data do evento aparece como dd/MM/yyyy.
2. **Given** um lote com data início e data fim, **When** o usuário edita o evento, **Then** ambas as datas do lote aparecem e são editáveis em dd/MM/yyyy.
3. **Given** o usuário informa uma data inválida ou fora do padrão esperado, **When** tenta salvar, **Then** recebe feedback de validação claro no campo correspondente.

---

### User Story 3 - Editar lotes em cards com campos nomeados (Priority: P1)

Como organizador, ao editar um evento quero que cada lote apareça em um card distinto, com cada campo claramente nomeado (rótulo) e validado, incluindo data início e data fim, para preencher lotes sem confundir qual valor pertence a qual lote.

**Why this priority**: Lotes são parte central do domínio; formulário confuso ou sem datas início/fim impede manutenção correta.

**Independent Test**: Abrir edição de um evento com dois ou mais lotes e confirmar um card por lote, rótulos visíveis e validação por campo.

**Acceptance Scenarios**:

1. **Given** um evento com N lotes, **When** o usuário abre a edição, **Then** vê N cards de lote distintos (um por lote).
2. **Given** um card de lote, **When** o usuário observa os campos, **Then** cada campo possui rótulo legível (nome do lote, preço, quantidade, data início, data fim, e demais campos já exigidos pelo domínio).
3. **Given** campos obrigatórios vazios ou data fim anterior à data início, **When** o usuário tenta salvar, **Then** a validação impede o envio e indica o(s) campo(s) inválido(s) no card correspondente.
4. **Given** o usuário adiciona um novo lote na edição, **When** o lote é criado na tela, **Then** surge um novo card vazio/pré-preenchido com os mesmos campos nomeados e regras de validação.

---

### User Story 4 - Volume de dados de estudo no backend (Priority: P2)

Como aprendiz local, quero que a API já traga um conjunto rico de eventos e lotes gerados de forma realista, para exercitar paginação, imagens e edição sem cadastrar dezenas de registros manualmente.

**Why this priority**: Sem volume, paginação e lista com imagem não são demonstráveis de forma convincente.

**Independent Test**: Subir o backend com seeds e listar eventos; confirmar quantidade suficiente para múltiplas páginas nos tamanhos 10, 20 e 30.

**Acceptance Scenarios**:

1. **Given** o ambiente de estudo é iniciado com seeds, **When** o usuário lista eventos com 10 itens por página, **Then** existem páginas suficientes para navegar além da primeira.
2. **Given** os dados seedados, **When** o usuário abre a edição de um evento que possui lotes, **Then** encontra lotes com datas início/fim preenchidas de forma coerente.

---

### Edge Cases

- Última página com menos itens que o tamanho escolhido: lista mostra só os restantes e paginação permanece utilizável.
- Zero eventos: lista vazia com mensagem amigável; controles de paginação não sugerem páginas inválidas.
- Falha ao obter imagem do Unsplash: a linha do evento permanece utilizável (Tema e demais colunas); placeholder ou ausência de imagem sem quebrar a lista.
- Hide da imagem com página já carregada: não exige novo login nem perde filtros/página atual.
- Data fim do lote anterior à data início: validação bloqueia salvamento.
- Mudança de tamanho de página no meio da navegação: usuário permanece em uma página válida (ex.: volta para a primeira ou ajusta para a página equivalente sem índice inválido).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Os três frontends (Vue, React, Angular) MUST exibir na lista de eventos uma coluna de imagem imediatamente à esquerda da coluna Tema.
- **FR-002**: A coluna de imagem MUST exibir fotos de eventos obtidas do serviço gratuito Unsplash (fluxo free de desenvolvedor), sem enviar o JWT (ou token de autenticação) da aplicação ProEventos para o Unsplash.
- **FR-003**: A lista MUST oferecer um controle de hide/show da imagem (coluna/imagens), persistindo o estado apenas na sessão de tela (não é obrigatório lembrar após recarregar, salvo se já houver padrão local equivalente).
- **FR-004**: A lista de eventos MUST ser paginada com tamanho padrão de 10 itens por página.
- **FR-005**: O usuário MUST poder escolher o tamanho de página entre 10, 20 e 30 itens.
- **FR-006**: Controles de paginação MUST permitir navegar entre páginas (anterior/próxima e/ou numeração) sem exibir itens fora da página corrente.
- **FR-007**: Em todos os projetos frontend e em qualquer superfície de UI de eventos/lotes, datas MUST ser exibidas no formato dd/MM/yyyy.
- **FR-008**: Em formulários de criação/edição, campos de data MUST aceitar e apresentar dd/MM/yyyy de forma consistente com a validação.
- **FR-009**: Na edição de evento, cada lote MUST ser apresentado em um card distinto.
- **FR-010**: Cada card de lote MUST nomear (rótulo) cada campo preenchível, incluindo no mínimo: nome, preço, quantidade, data início e data fim (além de outros campos de lote já existentes no domínio).
- **FR-011**: Cada campo do card de lote MUST ser validado antes do salvamento, com mensagens associadas ao campo/card correspondente.
- **FR-012**: Data início e data fim de cada lote MUST ser editáveis na tela de edição do evento, no formato dd/MM/yyyy, e data fim MUST não ser anterior à data início.
- **FR-013**: O backend MUST disponibilizar um conjunto de dados de estudo realistas (eventos e lotes relacionados) em volume suficiente para demonstrar paginação nos três tamanhos de página (no mínimo mais de 30 eventos).
- **FR-014**: Comportamento de lista, paginação, formato de data e cards de lotes MUST ser equivalente nos três frontends (parity), consumindo o mesmo contrato HTTP da API compartilhada.
- **FR-015**: Quando a API retornar listas paginadas (ou o cliente paginar localmente sobre o contrato atual), o usuário MUST ver contagem/contexto suficiente para saber que há mais páginas (ex.: página atual e total ou equivalente claro).

### Key Entities

- **Evento**: Item da lista e formulário; possui tema, data (dd/MM/yyyy na UI), imagem de evento (referência visual Unsplash na lista) e coleção de lotes.
- **Lote**: Pertence a um evento; exibido em card próprio na edição; atributos nomeados incluem nome, preço, quantidade, data início e data fim.
- **Página de listagem**: Conjunto de eventos da página corrente, tamanho selecionado (10/20/30) e controles de navegação / hide-show de imagem.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em qualquer um dos três frontends, um usuário encontra a coluna de imagem à esquerda de Tema e consegue ocultar e reexibir as imagens em no máximo 2 cliques.
- **SC-002**: Com o volume seedado, o usuário completa navegação de pelo menos 3 páginas com tamanho 10, e consegue alternar para 20 e 30 itens por página sem erro de página inválida.
- **SC-003**: Em amostragem de lista + edição, 100% das datas visíveis de evento e lote estão no formato dd/MM/yyyy.
- **SC-004**: Na edição de um evento com 2+ lotes, cada lote aparece em card separado com campos rotulados; tentativa de salvar com data fim anterior à início é bloqueada com feedback no card afetado em 100% dos casos testados.
- **SC-005**: Após subir o ambiente de estudo, a lista já contém mais de 30 eventos sem cadastro manual, permitindo demonstrar os três tamanhos de página.
- **SC-006**: Em inspeção do tráfego da chamada ao Unsplash (ou equivalente de obtenção da imagem), o token JWT da aplicação ProEventos não aparece nas requisições ao Unsplash.
- **SC-007**: As mesmas jornadas (lista com imagem/paginação, formato de data, cards de lotes) são concluíveis com o mesmo resultado esperado nos três frontends.

## Out of Scope *(mandatory for ProEventos)*

- Página Contatos
- Premium / heavy UI redesign (clean didactic UI only; cards de lote e coluna de imagem são acréscimos funcionais, não redesign visual amplo)
- Identity/auth novo além do já exigido por features ativas anteriores (esta feature não introduz novo fluxo de login)
- Upload próprio de imagens de evento pelo usuário (fonte é Unsplash free)
- Persistência obrigatória da preferência hide/show entre sessões/dispositivos
- Paginação de outras entidades (palestrantes, redes sociais) salvo se já reutilizarem o mesmo padrão por acaso
- Integração Unsplash paga / JWT Unsplash / OAuth Unsplash avançado

## Cross-Frontend Parity *(when UI work is included)*

| Frontend              | In this feature? | Notes                                      |
|-----------------------|------------------|--------------------------------------------|
| Vue (`Front-Vue`)     | yes              | Lista, datas, cards de lotes, hide/show    |
| React (`Front-React`) | yes              | Mesmo comportamento e contrato             |
| Angular               | yes              | Mesmo comportamento e contrato             |

## Assumptions

- Todos os clientes consomem a mesma API HTTP ProEventos (sem backends por frontend).
- “Request free” do Unsplash significa uso do acesso gratuito de desenvolvedor; a aplicação **não** envia o JWT ProEventos ao Unsplash (Access Key / Client-ID do Unsplash, se necessário, é distinto e não é o JWT da API).
- Imagens são temáticas de eventos (busca/tema “event” ou equivalente); falha pontual de imagem não bloqueia a lista.
- O volume de dados de estudo no backend é gerado com **Bogus** (conforme pedido explícito), produzindo no mínimo mais de 30 eventos com lotes e datas coerentes.
- Se o contrato atual da API ainda devolver lista completa, a paginação pode ser aplicada no cliente de forma equivalente nos três frontends **ou** a API pode passar a expor paginação no contrato compartilhado — desde que a experiência do usuário (10/20/30 e navegação) seja a mesma; a escolha fica para o plano técnico, preservando o contrato único.
- Hide/show controla a exibição da coluna/imagens da lista inteira (não um toggle independente por linha), para manter a UI didática e simples.
- Campos de lote além de nome/preço/quantidade/datas seguem o modelo de domínio já existente (ex.: quantidade restante se já fizer parte do domínio).
- Formato dd/MM/yyyy aplica-se à UI; armazenamento interno na API pode permanecer em formato ISO/padrão de servidor, desde que a conversão na borda do cliente seja consistente.
