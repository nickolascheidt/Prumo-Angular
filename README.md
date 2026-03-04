# BiomePampa ERP - Frontend Angular

Sistema de Gestão de Recursos Humanos (Folha de Pagamento) para a empresa BiomePampa.

## Funcionalidades

- **Autenticação**: Login com JWT
- **Dashboard**: Visualização geral de dados
- **Gestão de Funcionários**: CRUD de funcionários
- **Registro de Horas**: Controle de horas trabalhadas
- **Pagamentos**: Gestão de pagamentos aos funcionários
- **Produtos**: Catálogo de produtos
- **Clientes**: Gestão de clientes

## Tecnologias

- Angular 18
- Angular Material
- RxJS
- TypeScript

## Requisitos

- Node.js 18+
- npm ou yarn

## Instalação

```bash
npm install
```

## Execução

```bash
# Desenvolvimento
npm start

# Build para produção
npm run build:prod
```

## Configuração

A API base está configurada em `src/environments/environment.ts`. Altere conforme necessário:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7145/api'
};
```

## Credenciais Padrão

- Email: `admin@biomepampa.com`
- Senha: `Admin@123`

## Estrutura do Projeto

```
src/
├── app/
│   ├── core/              # Serviços, guards, interceptadores
│   ├── modules/           # Módulos de features (Auth, Dashboard, etc)
│   ├── shared/            # Componentes compartilhados
│   └── app.routes.ts      # Rotas principais
├── assets/                # Imagens e arquivos estáticos
├── environments/          # Configurações por ambiente
└── styles.scss           # Estilos globais
```

## Rotas

- `/auth/login` - Login
- `/dashboard` - Painel principal
- `/employees` - Gestão de funcionários
- `/worklogs` - Registro de horas
- `/payments` - Gestão de pagamentos
- `/products` - Catálogo de produtos
- `/customers` - Gestão de clientes

## Licença

MIT
