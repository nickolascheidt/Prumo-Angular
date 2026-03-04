# 🚀 Guia de Instalação - BiomePampa ERP

## Requisitos do Sistema

- **Windows 10/11** (ou Windows Server 2016+)
- **Node.js 18+** (LTS recomendado)
- **npm 9+** (incluído com Node.js)

## Passo 1: Instalar Node.js

### Opção A: Download Direto (Recomendado)

1. Acesse [nodejs.org](https://nodejs.org/)
2. Baixe a versão **LTS** (Long Term Support) - recomendada
3. Execute o instalador
4. Mantenha as opções padrão selecionadas
5. **Importante**: Feche e reabra o PowerShell após a instalação

### Opção B: Usar Chocolatey (se instalado)

```powershell
choco install nodejs -y
```

### Verificar Instalação

Abra um novo PowerShell e execute:

```powershell
node --version
npm --version
```

Deve exibir as versões instaladas (ex: v18.12.1, 9.2.0)

## Passo 2: Instalar Dependências

Navegue até a pasta do projeto:

```powershell
cd d:\Backup\Angular\BiomePampa
```

Instale as dependências:

```powershell
npm install
```

Este processo pode levar 5-10 minutos na primeira vez.

## Passo 3: Iniciar a Aplicação

```powershell
npm start
```

A aplicação abrirá automaticamente em `http://localhost:4200`

## 🔐 Credenciais de Teste

- **Email**: `admin@biomepampa.com`
- **Senha**: `Admin@123`

## Comandos Úteis

```bash
# Iniciar em modo desenvolvimento
npm start

# Build para produção
npm run build

# Build otimizado para produção
npm run build:prod

# Executar testes
npm test

# Lint do código
npm run lint
```

## Solução de Problemas

### Erro: "npm não é reconhecido"

1. Certifique-se de ter instalado Node.js
2. **Feche e reabra o PowerShell/CMD** após a instalação
3. Tente novamente

### Erro: "Port 4200 already in use"

A porta 4200 já está em uso. Você pode:

1. Fechar a aplicação anterior que usa a porta
2. Ou usar uma porta diferente:

```powershell
ng serve --port 4201
```

### Erro de compilação TypeScript

Delete a pasta `node_modules` e reinstale:

```powershell
rm -r node_modules
npm install
npm start
```

### Erro de certificado HTTPS

Se encontrar erro de certificado ao acessar a API:

1. Para desenvolvimento, desabilite a verificação SSL:
   - Edite `src/main.ts`
   - Adicione: `process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';`

2. Ou obtenha um certificado válido da API backend

## 📝 Estrutura do Projeto

```
BiomePampa/
├── src/                    # Código-fonte
│   ├── app/               # Componentes e serviços
│   ├── assets/            # Imagens e recursos
│   ├── environments/       # Configurações por ambiente
│   └── styles.scss        # Estilos globais
├── package.json           # Dependências do projeto
├── angular.json           # Configuração Angular
├── tsconfig.json          # Configuração TypeScript
└── README.md              # Documentação
```

## 🔧 Configuração da API

A URL da API está configurada em `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7145/api'
};
```

**Altere conforme sua API backend!**

## 📚 Documentação

- [Angular Documentation](https://angular.io/docs)
- [Angular Material](https://material.angular.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Suporte

Para dúvidas ou problemas:

1. Verifique o console do navegador (F12)
2. Verifique o terminal PowerShell para erros
3. Consulte a documentação do Angular

---

**Versão**: 1.0.0  
**Última atualização**: Março 2026
