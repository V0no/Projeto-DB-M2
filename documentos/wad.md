# Web Application Document - Projeto Individual - Módulo 2 - Inteli

**_Os trechos em itálico servem apenas como guia para o preenchimento da seção. Por esse motivo, não devem fazer parte da documentação final._**

## RoomWise

#### Autor do projeto
- Samuel Vono Godoi Chiovato

## Sumário

1. [Introdução](#c1)  
2. [Visão Geral da Aplicação Web](#c2)  
3. [Projeto Técnico da Aplicação Web](#c3)  
4. [Desenvolvimento da Aplicação Web](#c4)  
5. [Referências](#c5)  

<br>

## <a name="c1"></a>1. Introdução (Semana 01)

# 1. Introdução

O RoomWise foi concebido para atender à crescente necessidade de gerenciamento eficiente de espaços compartilhados em ambientes corporativos, educacionais e institucionais. Em um cenário onde a otimização de recursos físicos se torna cada vez mais importante, este sistema propõe uma solução digital intuitiva e robusta para administrar a utilização de salas de reunião, auditórios, laboratórios e outros espaços coletivos.

O objetivo principal é eliminar conflitos de agendamento e maximizar a utilização dos espaços disponíveis, proporcionando uma plataforma centralizada onde os usuários podem visualizar a disponibilidade em tempo real, fazer reservas e gerenciar seus compromissos sem a necessidade de processos manuais ou comunicação intermediária.

Este sistema oferece funcionalidades essenciais como cadastro de usuários com diferentes níveis de permissão, categorização de salas por tipo e capacidade, agendamento com verificação automática de disponibilidade, e um painel intuitivo para visualização das reservas. A arquitetura foi projetada considerando aspectos de escalabilidade, permitindo a fácil inclusão de novas salas ou unidades conforme a expansão da organização.

Diferenciando-se de soluções genéricas de calendário, o sistema foi especialmente desenvolvido para o contexto de reserva de espaços físicos, contemplando particularidades como capacidade das salas, localização, equipamentos disponíveis e políticas de utilização específicas. A interface amigável permite que usuários de diferentes níveis técnicos possam facilmente navegar e utilizar as funcionalidades oferecidas.

O desenvolvimento seguiu princípios de design centrado no usuário, priorizando a experiência de uso e a eficiência nas operações mais frequentes. A implementação técnica utiliza tecnologias modernas e boas práticas de desenvolvimento web, garantindo segurança, desempenho e adaptabilidade a diferentes dispositivos.

Em síntese, o RoomWise representa uma solução tecnológica para um desafio organizacional comum, promovendo maior produtividade através da gestão otimizada de recursos compartilhados.

---

## <a name="c2"></a>2. Visão Geral da Aplicação Web

### 2.1. Personas (Semana 01 - opcional)

*Posicione aqui sua(s) Persona(s) em forma de texto markdown com imagens, ou como imagem de template preenchido. Atualize esta seção ao longo do módulo se necessário.*

### 2.2. User Stories (Semana 01 - opcional)

*Posicione aqui a lista de User Stories levantadas para o projeto. Siga o template de User Stories e utilize a referência USXX para numeração (US01, US02, US03, ...). Indique todas as User Stories mapeadas, mesmo aquelas que não forem implementadas ao longo do projeto. Não se esqueça de explicar o INVEST de 1 User Storie prioritária.*

---

## <a name="c3"></a>3. Projeto da Aplicação Web

### 3.1. Modelagem do banco de dados  (Semana 3)

#### **Diagrama Entidade-Relacionamento (ER)**
O sistema de Reserva de Salas utiliza um modelo relacional composto por quatro entidades principais: Usuários, Tipos de Sala, Salas e Reservas. Abaixo está representado o diagrama ER que ilustra essas entidades e seus relacionamentos com suas respectivas cardinalidades:


<div align="center">


<img src="/assets/modelo-banco.png" width="100%">

<sub>Figura 1 - Modelagem do Banco de Dados</sub>

<sub>Fonte: Autoria própria (2025)</sub>

</div>

#### **Legenda de Cardinalidade:**
* (1): Um lado da relação com exatamente uma entidade
* (N): Lado da relação com muitas entidades (zero ou mais)

#### **Descrição das Entidades**

**→ Users (Usuários)**
Armazena informações dos usuários que podem realizar reservas de salas.

* **user_id**: Identificador único do usuário (chave primária)
* **name**: Nome completo do usuário
* **email**: Email do usuário (único)
* **password**: Senha criptografada do usuário
* **phone**: Número de telefone para contato
* **role**: Papel do usuário no sistema (administrador ou usuário comum)
* **created_at**: Data e hora de criação do registro
* **updated_at**: Data e hora da última atualização do registro

**→ Room_Types (Tipos de Sala)**
Categoriza os diferentes tipos de salas disponíveis no sistema.

* **room_type_id**: Identificador único do tipo de sala (chave primária)
* **name**: Nome do tipo de sala (ex: Reunião, Conferência, Treinamento)
* **description**: Descrição detalhada do tipo de sala
* **created_at**: Data e hora de criação do registro
* **updated_at**: Data e hora da última atualização do registro

**→ Rooms (Salas)**
Armazena informações sobre as salas disponíveis para reserva.

* **room_id**: Identificador único da sala (chave primária)
* **name**: Nome ou número da sala
* **capacity**: Capacidade máxima de pessoas
* **location**: Localização física da sala (prédio, andar, etc.)
* **room_type_id**: Chave estrangeira referenciando o tipo da sala
* **status**: Status atual da sala (disponível ou em manutenção)
* **created_at**: Data e hora de criação do registro
* **updated_at**: Data e hora da última atualização do registro

**→ Bookings (Reservas)**
Registra as reservas de salas realizadas pelos usuários.

* **booking_id**: Identificador único da reserva (chave primária)
* **room_id**: Chave estrangeira referenciando a sala reservada
* **user_id**: Chave estrangeira referenciando o usuário que fez a reserva
* **title**: Título ou propósito da reserva
* **description**: Descrição detalhada do evento ou reunião
* **start_time**: Data e hora de início da reserva
* **end_time**: Data e hora de término da reserva
* **status**: Status da reserva (confirmada, cancelada, em andamento)
* **created_at**: Data e hora de criação do registro
* **updated_at**: Data e hora da última atualização do registro

#### **Relacionamentos e Cardinalidades**

1. **Rooms → Room_Types (N:1)**:
   * Uma sala pertence a exatamente um tipo de sala (1..1)
   * Um tipo de sala pode estar associado a várias salas (0..N)
   * Cardinalidade: N:1 (Muitas salas para um tipo)
   * Implementação: Chave estrangeira `room_type_id` na tabela `Rooms` referenciando `Room_Types`

2. **Bookings → Rooms (N:1)**:
   * Uma reserva está associada a exatamente uma sala (1..1)
   * Uma sala pode ter várias reservas ao longo do tempo (0..N)
   * Cardinalidade: N:1 (Muitas reservas para uma sala)
   * Implementação: Chave estrangeira `room_id` na tabela `Bookings` referenciando `Rooms`

3. **Bookings → Users (N:1)**:
   * Uma reserva é feita por exatamente um usuário (1..1)
   * Um usuário pode fazer várias reservas (0..N)
   * Cardinalidade: N:1 (Muitas reservas para um usuário)
   * Implementação: Chave estrangeira `user_id` na tabela `Bookings` referenciando `Users`

#### **Índices**

Para otimizar o desempenho das consultas mais frequentes, foram criados os seguintes índices:

* **idx_room_time**: Índice composto nas colunas (room_id, start_time, end_time) para agilizar a verificação de disponibilidade de salas
* **idx_user**: Índice na coluna user_id para rápida recuperação das reservas de um usuário
* **idx_start_time**: Índice na coluna start_time para eficiente filtragem de reservas por data/hora


#### **Código SQL**

```
-- 1) Criação dos tipos ENUM
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE room_status AS ENUM ('available', 'maintenance');
CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled', 'in_progress');

-- 2) Tabelas

CREATE TABLE Users (
  user_id     INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name        VARCHAR(100)      NOT NULL,
  email       VARCHAR(100) UNIQUE NOT NULL,
  password    VARCHAR(255)      NOT NULL,
  phone       VARCHAR(20),
  role        user_role         NOT NULL DEFAULT 'user',
  created_at  TIMESTAMP         NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP         NOT NULL DEFAULT now()
);

CREATE TABLE Room_Types (
  room_type_id  INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name          VARCHAR(50)      NOT NULL,
  description   TEXT,
  created_at    TIMESTAMP        NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP        NOT NULL DEFAULT now()
);

CREATE TABLE Rooms (
  room_id       INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name          VARCHAR(100)     NOT NULL,
  capacity      INT              NOT NULL,
  location      VARCHAR(100),
  room_type_id  INT,
  status        room_status      NOT NULL DEFAULT 'available',
  created_at    TIMESTAMP        NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP        NOT NULL DEFAULT now(),
  CONSTRAINT fk_room_type FOREIGN KEY(room_type_id) REFERENCES Room_Types(room_type_id)
);

CREATE TABLE Bookings (
  booking_id   INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  room_id      INT              NOT NULL,
  user_id      INT              NOT NULL,
  title        VARCHAR(100)     NOT NULL,
  description  TEXT,
  start_time   TIMESTAMP        NOT NULL,
  end_time     TIMESTAMP        NOT NULL,
  status       booking_status   NOT NULL DEFAULT 'confirmed',
  created_at   TIMESTAMP        NOT NULL DEFAULT now(),
  updated_at   TIMESTAMP        NOT NULL DEFAULT now(),
  CONSTRAINT fk_booking_room FOREIGN KEY(room_id) REFERENCES Rooms(room_id),
  CONSTRAINT fk_booking_user FOREIGN KEY(user_id) REFERENCES Users(user_id)
);

-- 3) Índices para otimização de consultas
CREATE INDEX idx_room_time    ON Bookings(room_id, start_time, end_time);
CREATE INDEX idx_user         ON Bookings(user_id);
CREATE INDEX idx_start_time   ON Bookings(start_time);


```


### 3.1.1 BD e Models (Semana 5)
O sistema de reserva de salas implementa quatro models principais que encapsulam a lógica de negócio e interação com o banco de dados, seguindo o padrão MVC (Model-View-Controller).

### **UserController Model**
Responsável pela gestão completa de usuários do sistema.

**Funcionalidades Implementadas:**
- **Criação de usuários** com validação de email único e criptografia de senha usando bcrypt
- **Listagem de usuários** excluindo informações sensíveis como senhas
- **Busca individual** por ID com validação de existência
- **Atualização de dados** com verificação de email duplicado
- **Alteração segura de senhas** verificando a senha atual antes da alteração
- **Desativação/Reativação** de usuários usando soft delete para preservar histórico
- **Listagem de reservas** específicas por usuário com dados relacionados de salas

### **RoomController Model**
Gerencia o cadastro e manutenção das salas físicas disponíveis.

**Funcionalidades Implementadas:**
- **Cadastro de salas** com validação de dados obrigatórios (nome, capacidade, localização)
- **Listagem completa** incluindo informações do tipo de sala através de JOIN
- **Atualização de informações** da sala (capacidade, localização, tipo, status)
- **Controle de status operacional** específico (disponível/manutenção)
- **Verificação de disponibilidade** em períodos específicos com detecção de conflitos
- **Exclusão protegida** impedindo remoção de salas com reservas associadas
- **Listagem de reservas futuras** por sala específica

### **RoomTypeController Model**
Administra as categorias e tipos de salas do sistema.

**Funcionalidades Implementadas:**
- **Cadastro de tipos personalizados** (Sala de Reunião, Auditório, Laboratório, etc.)
- **Listagem com estatísticas** mostrando quantidade de salas por tipo
- **Busca individual** com contagem de salas associadas
- **Atualização de informações** do tipo (nome e descrição)
- **Exclusão com proteção referencial** impedindo remoção de tipos em uso
- **Listagem de salas agrupadas** por tipo específico

### **BookingController Model**
Núcleo principal do sistema, gerencia todas as operações de reserva.

**Funcionalidades Implementadas:**
- **Criação de reservas** com validação de existência de sala e usuário
- **Detecção automática de conflitos** de horário para evitar dupla reserva
- **Listagem completa** com dados relacionados de salas e usuários via JOIN
- **Busca individual** com informações detalhadas da reserva
- **Atualização completa** de reservas com revalidação de conflitos
- **Cancelamento de reservas** alterando apenas o status sem exclusão
- **Exclusão física** para remoção definitiva quando necessário
- **Verificação de disponibilidade** geral para períodos específicos

### **DashboardController Model**
Fornece dados estatísticos e relatórios gerenciais do sistema.

**Funcionalidades Implementadas:**
- **Estatísticas gerais** com contadores de usuários, salas, tipos e reservas
- **Distribuição por status** de reservas e salas
- **Relatório de reservas diárias** para controle operacional
- **Cálculo de ocupação** de salas por período (semana, mês, ano)
- **Ranking de usuários** mais ativos do sistema
- **Métricas de utilização** com horas totais de reserva por usuário


### 3.2. Arquitetura (Semana 5)

<div align="center">


<img src="/assets/diagrama-arquitetura.png" width="100%">

<sub>Figura 2 - Diagrama de Arquitetura</sub>

<sub>Fonte: Autoria própria (2025)</sub>

</div>

Fluxo de Dados:
1. Usuário interage com VIEW (clica, preenche)
2. VIEW envia requisição para CONTROLLER
3. CONTROLLER processa lógica de negócio
4. CONTROLLER chama MODEL para acessar dados
5. MODEL executa queries no BANCO DE DADOS
6. BANCO retorna dados para MODEL
7. MODEL retorna dados para CONTROLLER
8. CONTROLLER formata resposta para VIEW
9. VIEW exibe resultado para usuário

### 3.3. Wireframes (Semana 03 - opcional)

*Posicione aqui as imagens do wireframe construído para sua solução e, opcionalmente, o link para acesso (mantenha o link sempre público para visualização).*

### 3.4. Guia de estilos (Semana 05 - opcional)

*Descreva aqui orientações gerais para o leitor sobre como utilizar os componentes do guia de estilos de sua solução.*


### 3.5. Protótipo de alta fidelidade (Semana 05 - opcional)

*Posicione aqui algumas imagens demonstrativas de seu protótipo de alta fidelidade e o link para acesso ao protótipo completo (mantenha o link sempre público para visualização).*

### 3.6. WebAPI e endpoints (Semana 05)

*Utilize um link para outra página de documentação contendo a descrição completa de cada endpoint. Ou descreva aqui cada endpoint criado para seu sistema.*  

### 3.7 Interface e Navegação (Semana 07)

O frontend do sistema foi desenvolvido utilizando uma arquitetura modular de CSS, dividida em componentes reutilizáveis que garantem consistência visual e facilidade de manutenção.

**Estrutura dos Estilos**

A organização dos estilos segue uma arquitetura componentizada:

```
public/css/
├── main.css              # Arquivo principal que importa todos os componentes
├── base.css             # Reset, variáveis CSS e estilos fundamentais
└── components/
    ├── buttons.css      # Sistema de botões padronizados
    ├── forms.css        # Formulários e elementos de entrada
    ├── alerts.css       # Alertas, notificações e badges
    └── layout.css       # Componentes de layout (header, nav, cards)
```

**Sistema de Variáveis CSS**

Implementou-se um sistema robusto de variáveis CSS para garantir consistência:

**Paleta de Cores:**
- Cores primárias: Verde (#28a745) com variações
- Cores de status: Sucesso, perigo, aviso e informação
- Escala de cinzas: 10 tons padronizados
- Cores administrativas: Diferenciação visual para área admin

**Espaçamentos e Dimensões:**
- Sistema de espaçamento: xs, sm, md, lg, xl, xxl
- Bordas e raios: Padronização de border-radius
- Sombras: 4 níveis de elevação (sm, md, lg, xl)
- Transições: Velocidades padronizadas (fast, normal, slow)

**Interfaces Desenvolvidas**

1. **Área de Autenticação**
   - **Login:** Interface limpa com gradiente verde, suporte a sessões ativas
   - **Registro:** Formulário expansivo com validação em tempo real
   - **Características:** Responsiva, com credenciais de demonstração visíveis

2. **Dashboard do Usuário**
   - **Layout:** Design em cards com estatísticas pessoais
   - **Componentes:** Ações rápidas, próximas reservas, salas disponíveis
   - **Funcionalidades:** Verificação de disponibilidade em tempo real

3. **Gerenciamento de Reservas**
   - **Lista de Reservas:** Tabela responsiva com filtros avançados
   - **Nova Reserva:** Formulário multi-etapa com verificação de disponibilidade
   - **Características:** Validação de horários, seleção visual de salas

4. **Perfil do Usuário**
   - **Informações Pessoais:** Avatar com iniciais, estatísticas de uso
   - **Edição:** Formulários separados para dados e senha
   - **Histórico:** Resumo de atividades com dados reais do banco

5. **Área Administrativa**
   - **Dashboard Admin:** Estatísticas gerais do sistema
   - **Gestão de Usuários:** CRUD completo com interface simplificada
   - **Gestão de Salas:** Controle de disponibilidade e tipos

**Sistema de Navegação**

*Navegação Principal*
- **Header responsivo** com informações do usuário
- **Barra de navegação** com destaque da página atual
- **Breadcrumbs** para orientação hierárquica

*Navegação Contextual*
- **Menus laterais** para configurações avançadas
- **Ações rápidas** em cards e botões flutuantes
- **Modal overlays** para ações secundárias

**Componentes Reutilizáveis**

*Sistema de Botões*
- **Variantes:** Primary, secondary, success, danger, warning, info
- **Tamanhos:** Small, normal, large, extra-large
- **Estados:** Normal, hover, disabled, loading
- **Tipos especiais:** Outline, floating action buttons (FAB), admin

*Sistema de Formulários*
- **Campos padronizados** com validação visual
- **Estados de validação** com ícones e cores
- **Componentes especiais:** File upload, switches, range inputs
- **Layouts responsivos** com grid system

*Sistema de Alertas*
- **Tipos:** Info, success, warning, danger
- **Formatos:** Inline, floating, toast notifications
- **Características:** Auto-dismiss, ícones, progress bars

*Cards e Layout*
- **Cards padronizados** com header, body e footer
- **Grid system** flexível e responsivo
- **Stat cards** para métricas e estatísticas
- **Seções organizadas** com títulos e ações

**Responsividade e Acessibilidade**

*Breakpoints Responsivos*
- **Mobile-first approach** com breakpoints em 576px, 768px, 992px, 1200px
- **Grid flexível** que se adapta a diferentes tamanhos de tela
- **Navegação adaptativa** com menus colapsáveis em mobile

*Características de Acessibilidade*
- **Contraste adequado** seguindo diretrizes WCAG
- **Focus visível** em todos os elementos interativos
- **Semântica HTML** apropriada para screen readers
- **Indicadores de estado** claros e consistentes

**Funcionalidades JavaScript Integradas**

*Validação em Tempo Real*
- **Formulários interativos** com feedback imediato
- **Verificação de disponibilidade** antes da submissão
- **Cálculo automático** de durações e horários

*Estado da Aplicação*
- **Gerenciamento de sessão** via localStorage
- **Estados de loading** com spinners animados
- **Alertas contextuais** com auto-dismiss

*Integração com API*
- **Chamadas assíncronas** para verificação de dados
- **Tratamento de erros** com mensagens amigáveis
- **Atualização dinâmica** de conteúdo sem reload

**Padrões de Design Implementados**

*Consistência Visual*
- **Tipografia padronizada** com hierarquia clara
- **Espaçamentos consistentes** usando sistema de grid
- **Cores semânticas** para diferentes tipos de ação e estado

*Experiência do Usuário*
- **Feedback visual** para todas as interações
- **Estados de carregamento** para operações assíncronas
- **Navegação intuitiva** com breadcrumbs e indicadores

*Performance e Otimização*
- **CSS modular** para carregamento eficiente
- **Transições suaves** sem comprometer performance
- **Sprites de ícones** SVG embutidos para rapidez

**Entregáveis da Semana 07**

**Código Desenvolvido:**
- Sistema completo de estilos CSS modulares (5 arquivos)
- 5 páginas principais do usuário totalmente funcionais
- 3 páginas administrativas com interfaces simplificadas
- Sistema de componentes reutilizáveis

**Funcionalidades Frontend:**
- Autenticação visual com persistência de sessão
- Dashboard interativo com dados em tempo real
- Formulários avançados com validação multi-etapa
- Sistema de filtros e busca dinâmica
- Interfaces responsivas para mobile e desktop

**Integração:**
- Conectividade completa com API REST desenvolvida
- Sincronização de dados entre frontend e backend
- Gerenciamento de estado da aplicação
- Tratamento robusto de erros e edge cases


<div align="center">


<img src="/assets/login.png" width="100%">

<sub>Figura 3 - Login</sub>

<sub>Fonte: Autoria própria (2025)</sub>

</div>

<div align="center">


<img src="/assets/cadastro.png" width="100%">

<sub>Figura 4 - Cadastro</sub>

<sub>Fonte: Autoria própria (2025)</sub>

</div>

<div align="center">


<img src="/assets/loadin-adm.png" width="100%">

<sub>Figura 5 - Loading do Administrador</sub>

<sub>Fonte: Autoria própria (2025)</sub>

</div>

<div align="center">


<img src="/assets/home-adm.png" width="100%">

<sub>Figura 6 - Dashboard do Administrador</sub>

<sub>Fonte: Autoria própria (2025)</sub>

</div>

<div align="center">


<img src="/assets/room-type-adm.png" width="100%">

<sub>Figura 7 - Tipo de Sala do Administrador</sub>

<sub>Fonte: Autoria própria (2025)</sub>

</div>

<div align="center">


<img src="/assets/user-adm.png" width="100%">

<sub>Figura 8 - Usuários do Administrador</sub>

<sub>Fonte: Autoria própria (2025)</sub>

</div>

<div align="center">


<img src="/assets/loading-user.png" width="100%">

<sub>Figura 9 - Loading do Usuário</sub>

<sub>Fonte: Autoria própria (2025)</sub>

</div>

<div align="center">


<img src="/assets/home-user.png" width="100%">

<sub>Figura 10 - Dashboard do Usuário</sub>

<sub>Fonte: Autoria própria (2025)</sub>

</div>

<div align="center">


<img src="/assets/bookings-user.png" width="100%">

<sub>Figura 11 - Reservas do Usuário</sub>

<sub>Fonte: Autoria própria (2025)</sub>

</div>

<div align="center">


<img src="/assets/new-booking-user.png" width="100%">

<sub>Figura 12 - Nova Reserva do Usuário</sub>

<sub>Fonte: Autoria própria (2025)</sub>

</div>

<div align="center">


---

## <a name="c4"></a>4. Desenvolvimento da Aplicação Web (Semana 8)

### 4.1 Demonstração do Sistema Web (Semana 8)

*VIDEO: Insira o link do vídeo demonstrativo nesta seção*
*Descreva e ilustre aqui o desenvolvimento do sistema web completo, explicando brevemente o que foi entregue em termos de código e sistema. Utilize prints de tela para ilustrar.*

### 4.2 Conclusões e Trabalhos Futuros (Semana 8)

*Indique pontos fortes e pontos a melhorar de maneira geral.*
*Relacione também quaisquer outras ideias que você tenha para melhorias futuras.*



## <a name="c5"></a>5. Referências

_Incluir as principais referências de seu projeto, para que o leitor possa consultar caso ele se interessar em aprofundar._<br>

---
---
