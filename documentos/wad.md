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

<img src="/assets/modelo-banco.png" width="100%">

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
*Descreva aqui os Models implementados no sistema web*

### 3.2. Arquitetura (Semana 5)

*Posicione aqui o diagrama de arquitetura da sua solução de aplicação web. Atualize sempre que necessário.*

**Instruções para criação do diagrama de arquitetura**  
- **Model**: A camada que lida com a lógica de negócios e interage com o banco de dados.
- **View**: A camada responsável pela interface de usuário.
- **Controller**: A camada que recebe as requisições, processa as ações e atualiza o modelo e a visualização.
  
*Adicione as setas e explicações sobre como os dados fluem entre o Model, Controller e View.*

### 3.3. Wireframes (Semana 03 - opcional)

*Posicione aqui as imagens do wireframe construído para sua solução e, opcionalmente, o link para acesso (mantenha o link sempre público para visualização).*

### 3.4. Guia de estilos (Semana 05 - opcional)

*Descreva aqui orientações gerais para o leitor sobre como utilizar os componentes do guia de estilos de sua solução.*


### 3.5. Protótipo de alta fidelidade (Semana 05 - opcional)

*Posicione aqui algumas imagens demonstrativas de seu protótipo de alta fidelidade e o link para acesso ao protótipo completo (mantenha o link sempre público para visualização).*

### 3.6. WebAPI e endpoints (Semana 05)

*Utilize um link para outra página de documentação contendo a descrição completa de cada endpoint. Ou descreva aqui cada endpoint criado para seu sistema.*  

### 3.7 Interface e Navegação (Semana 07)

*Descreva e ilustre aqui o desenvolvimento do frontend do sistema web, explicando brevemente o que foi entregue em termos de código e sistema. Utilize prints de tela para ilustrar.*

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