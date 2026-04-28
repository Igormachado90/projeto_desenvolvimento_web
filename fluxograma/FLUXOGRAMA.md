#  Fluxograma e Arquitetura do VínculoTEA

Este documento descreve o fluxo de navegação, funcionalidades principais e a lógica de operação da plataforma **VínculoTEA**.

---

##  1. Fluxo de Autenticação e Primeiros Passos

O acesso à plataforma é controlado pelo Supabase Auth. Novos usuários passam por um fluxo de Onboarding se for o primeiro acesso.

```mermaid
graph TD
    Start((Início)) --> CheckAuth{Autenticado?}
    CheckAuth -- Não --> Login[Página de Login]
    CheckAuth -- Sim --> Onboarding{Tutorial Concluído?}
    
    Onboarding -- Não --> Wizard[Onboarding Wizard]
    Onboarding -- Sim --> Dashboard[Painel Principal]
    Wizard --> Dashboard

    Login --> ForgotPass[Esqueci a Senha]
    ForgotPass --> ResetPass[Redefinir Senha]
    ResetPass --> Login
```

---

##  2. Hub do Dashboard e Recursos de UX

O Painel Central oferece ferramentas de acessibilidade e produtividade.

### ⌨️ Atalhos e Comandos
- **Busca Global**: `Ctrl/Cmd + K` ou `Alt + S`.
- **Controle de Voz**: `Alt + V` (Comandos como "Ir para Alunos", "Pesquisar...").
- **Offline Sync**: Sincronização automática de ações realizadas sem internet.

```mermaid
graph LR
    DashHub[Painel Central] --> Sidebar[Navegação Principal]
    DashHub --> TopBar[Barra Superior]
    
    TopBar --> Search[Busca Global]
    TopBar --> Theme[Troca de Tema: Dark/Light]
    TopBar --> Notifications[Central de Notificações]
    TopBar --> Voice[Controle de Voz]
```

---

## 🛡️ 3. Hierarquia de Acesso (RBAC)

A visibilidade dos módulos na Sidebar depende das permissões do usuário:

| Permissão | Módulos Acessíveis |
| :--- | :--- |
| **SuperAdmin** | Painel SaaS, Alunos, Gestão, Relatórios, Ajustes |
| **Admin** | Alunos, Gestão, Disciplinas, Relatórios, Ajustes |
| **Profissional** | Alunos (Vinculados), Agenda, Relatórios Básicos |
| **Visualizador** | Dashboards de Consulta, Relatórios de Progresso |

---

## 👨‍🎓 4. Gestão de Alunos, PEI e Disciplinas

### 📝 Cadastro e Acompanhamento
```mermaid
graph TD
    StudentList[Lista de Alunos] --> RegWizard[Cadastro em 3 Etapas]
    StudentList --> StudentDetail[Ficha Completa do Aluno]
    StudentDetail --> PEI[Gerenciador de PEI]
    StudentDetail --> History[Histórico de Evolução]
    
    RegWizard --> Step1[Dados e CID]
    RegWizard --> Step2[Família]
    RegWizard --> Step3[Escola e Saúde]
```

### 📋 Elaboração do PEI (Wizard)
```mermaid
graph TD
    InitPEI[Novo PEI] --> PEI1[Pontos Fortes/Barreiras]
    PEI1 --> PEI2[Metas de Curto/Longo Prazo]
    PEI2 --> PEI3[Estratégias Pedagógicas]
    PEI3 --> PEI4[Finalização e PDF]
```

---

## 🏢 5. Gestão de Rede e Especialidades

Módulos para controle da infraestrutura educacional e áreas de atendimento.

```mermaid
graph LR
    Gerenciamento[Gestão Administrativa] --> Schools[Escolas da Rede]
    Gerenciamento --> Classes[Turmas e Horários]
    Gerenciamento --> Teachers[Professores e Especialistas]
    
    Disciplines[Disciplinas/Especialidades] --> Spec[Áreas: Fono, Psicologia, etc.]
    Disciplines --> LinkProf[Vincular Especialistas]
```

---

## 🔐 6. Painel SuperAdmin (SaaS)

Gestão de nível global para administradores da plataforma.

```mermaid
graph TD
    SuperAdmin[Painel SaaS] --> GlobalUsers[Contas de Usuários Globais]
    SuperAdmin --> SaaSStats[Estatísticas de Uso e Crescimento]
    SuperAdmin --> GlobalSettings[Configurações Gerais do Sistema]
```

---

## ⚙️ 7. Configurações e Sistema

O módulo de Ajustes permite configurar o comportamento da plataforma para a organização (Multi-tenancy).

```mermaid
graph TD
    Settings[Ajustes] --> Inst[Dados da Instituição]
    Settings --> Sec[Segurança e Senha]
    Settings --> Users[Gestão de Usuários da Unidade]
    Settings --> Sys[Preferências do Sistema: Tema, Notificações]
```

---

## 🛠️ Stack Tecnológica de Fluxo
- **Auth**: Supabase Auth (JWT).
- **Database**: PostgreSQL + RLS (Segurança a nível de linha).
- **Frontend**: React + Vite (Lazy Loading para performance).
- **Acessibilidade**: Context API para estados globais de tutorial, tema e voz.
- **Offline**: Service Workers e lógica de sincronização em `offlineService.ts`.
