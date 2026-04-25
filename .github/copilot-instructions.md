# SaaS_BasePlatform ERP - Instruções de Desenvolvimento

## Estrutura do Projeto

Este é um projeto Angular 18 para o sistema ERP da SaaS_BasePlatform.

### Diretórios Principais

- **src/app/core**: Serviços, guards e interceptadores
- **src/app/modules**: Módulos de features (autenticação, dashboard, funcionários, etc)
- **src/app/shared**: Componentes compartilhados (layout, pipes)
- **src/environments**: Configurações por ambiente

### Componentes Principais

- **LoginComponent**: Autenticação com JWT
- **DashboardComponent**: Painel principal
- **EmployeesComponent**: Gestão de funcionários
- **WorklogsComponent**: Registro de horas
- **PaymentsComponent**: Gestão de pagamentos
- **ProductsComponent**: Catálogo de produtos
- **CustomersComponent**: Gestão de clientes

## Serviços

### AuthService
Gerencia autenticação, tokens e usuário atual.

### ApiService
Comunica com a API backend. Endpoints configurados de acordo com o guia da API.

## Rotas Protegidas

Todas as rotas exceto `/auth/login` são protegidas pelo `authGuard` que verifica se o usuário está autenticado.

## Desenvolvimento

```bash
npm install
npm start
```

A aplicação estará disponível em `http://localhost:4200`

## API

A API é configurada em `src/environments/environment.ts`

Base URL: `https://localhost:7145/api` (desenvolvimento)

## Autenticação

O token JWT é armazenado em `localStorage` com a chave `saas_baseplatform_token`.

O interceptador `JwtInterceptor` adiciona automaticamente o token a todas as requisições.

## Temas e Estilos

O projeto usa Angular Material para componentes e estilos globais em `src/styles.scss`.

Cores principais:
- Primary: #673ab7 (Purple)
- Accent: #f5576c (Red)
- Warn: #ff6f00 (Orange)
