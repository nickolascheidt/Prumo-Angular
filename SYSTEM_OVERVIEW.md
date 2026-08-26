# Prumo ERP — Visão Geral do Sistema

Este documento descreve a arquitetura, regras de negócio e os endpoints da API REST do
backend. Ele existe para orientar o desenvolvimento do **frontend**.

> **Revisado em 2026-08-26.** Nesta revisão foram removidas seções que descreviam coisas
> que já não existiam: os endpoints `/api/permissions/*` (aposentados no item 3B) e as
> API keys (removidas em maio). Documentação que descreve um endpoint morto é pior que
> documentação faltando — manda escrever código contra o que não responde.
>
> **A fonte da verdade continua sendo o código**, em `Prumo.Api/Controllers`. Ao mexer em
> autorização, confira também `docs/MVP-BACKLOG.md` no repo do backend, seção
> "Onde o projeto está".

---

## Stack & Tecnologias

| Camada | Tecnologia |
|---|---|
| Runtime | .NET 10 |
| Framework Web | ASP.NET Core |
| Autenticação | JWT Bearer |
| Autorização | ASP.NET Core Identity + Políticas customizadas |
| ORM / Banco | Entity Framework Core |
| Rate Limiting | ASP.NET Core Rate Limiter (built-in) |

---

## Arquitetura de Projetos

```
SaaSBasePlatform/
├── Prumo.Domain          # Entidades, Enums, DTOs de domínio, catálogo de permissões
├── Prumo.Application     # Serviços de aplicação, DTOs de aplicação, interfaces
├── Prumo.Infrastructure  # Implementações (EF Core, JWT, Identity)
├── Prumo.Api             # Controllers, Middlewares, Program.cs
└── Prumo.Tests           # Testes automatizados
```

---

## Autenticação (JWT)

- Todas as rotas protegidas exigem o header:
  ```
  Authorization: Bearer <token>
  ```
- O token é obtido via `POST /api/auth/login`.
- O token contém claims de `NameIdentifier` (userId), `Name`, `Email` e `Role`.
- Expiração configurada em `appsettings.json` → `Jwt:ExpiresInMinutes`.
- **Clock skew = zero** (o token expira exatamente no tempo configurado).

---

## Roles do Sistema

| Role | Descrição |
|---|---|
| `Administrador` | Acesso total ao sistema |
| `Usuario` | Acesso padrão, restrito pelas permissões atribuídas |

---

## Sistema de Permissões

Existe **um** sistema de autorização: **`ResourcePermission`** — (role × recurso) → nível.

> Até 2026-08-26 havia um segundo, de permissões em string (`employees.view` e afins).
> Ele foi **aposentado no item 3B do backlog** porque não gateava nada: nenhum endpoint
> usava `[Authorize(Policy=…)]` e o frontend nunca lia os claims. Os endpoints
> `/api/permissions/*` **não existem mais**.

Cada recurso representa uma **tela ou seção do frontend**. Roles recebem um nível de
acesso por recurso.

| PermissionLevel | Valor | Significado |
|---|---|---|
| `None` | 0 | Usuário não vê nem sabe que o recurso existe |
| `Read` | 1 | Pode visualizar |
| `Write` | 2 | Pode visualizar e editar |
| `Full` | 3 | Acesso total (incluindo exclusão) |

**O nível exigido vem do verbo HTTP.** O atributo `[TenantModule]` no backend infere:

| Verbo | Nível exigido |
|---|---|
| `GET`, `HEAD`, `OPTIONS` | `Read` |
| `POST`, `PUT`, `PATCH` | `Write` |
| `DELETE` | `Full` |

É assim que se expressa **"vê mas não edita"**: nível `Read` num recurso abre a tela e
devolve **403** em qualquer escrita.

> ⚠️ **A API serializa enums como string.** `PermissionLevel` chega `"Read"`, não `1`, e
> `TenantRole` chega `"Owner"`, não `2`. Comparar o valor cru com o enum numérico é sempre
> falso, e a falha é **silenciosa** — os controles simplesmente somem da tela. Já aconteceu
> quatro vezes neste projeto. Normalize na fronteira (`toPermissionLevel`, `toTenantRole`).

**Como o frontend usa isso:**
1. Chamar `GET /api/resources/my-permissions` logo após o login.
2. A resposta traz `allowedResources` e `resourcePermissions` (mapa `resourceCode → nível`).
3. Esses dados montam o menu e habilitam/desabilitam os botões de ação.

> ⚠️ **O master admin não passa por nenhuma checagem.** A role global `Administrador` e o
> cargo Owner/Admin do tenant devolvem `Full` direto. Testar gating com uma conta dessas
> não prova nada.

**Recursos semeados** (`TenantBootstrapSeeder`, 16 por tenant): `Dashboard.Main`,
`Dashboard.Accounting`, `Dashboard.Finance`, `Dashboard.HR`, `Dashboard.Admin`,
`User.Management`, `Role.Management`, `Permission.Management`, `System.Configuration`,
`ChartOfAccounts.Management`, `GeneralLedger.Management`, `HR.Employees`, `HR.WorkLogs`,
`HR.Payments`, `HR.PaymentPeriods`, `AccountsPayable.Entries`.

**Auditoria:** toda mudança de nível é registrada em `ResourcePermissionAuditLog` (role,
recurso, de que nível para qual, por quem). O acesso de suporte do master admin vai para
`SupportAccessLog`.

---

## Rate Limiting

| Política | Aplicada em | Limite |
|---|---|---|
| `public` | Login, Register | 10 req / minuto |
| `authenticated` | Endpoints autenticados | 100 req / 60s (configurável) |

Retorna `429 Too Many Requests` quando excedido.

---

## Endpoints da API

> **Base URL:** `http://localhost:<porta>/api`

---

### Auth — `/api/auth`

#### `POST /api/auth/login`
Login do usuário.

- **Auth:** Não requerida
- **Rate Limit:** `public` (10/min)
- **Body:**
  ```json
  {
    "email": "string",
    "password": "string",
    "tenantSlug": "string (opcional)"
  }
  ```
- **Respostas:**
  - `200 OK` → `LoginResponseDto`
  - `401 Unauthorized`
  - `429 Too Many Requests`

**`LoginResponseDto`:**
```json
{
  "token": "string (JWT)",
  "expiresAt": "datetime",
  "tenantId": "guid (null quando o login não foi vinculado a um tenant)",
  "user": {
    "id": "guid",
    "email": "string",
    "fullName": "string",
    "phoneNumber": "string",
    "roles": ["string"],
    "createdAt": "datetime",
    "lastLoginAt": "datetime"
  }
}
```

---

#### `POST /api/auth/register`
Registra um novo usuário com role `Usuario`.

- **Auth:** Não requerida
- **Rate Limit:** `public` (10/min)
- **Body:**
  ```json
  {
    "email": "string",
    "password": "string",
    "fullName": "string",
    "phoneNumber": "string (opcional)"
  }
  ```
- **Respostas:**
  - `201 Created` → `LoginResponseDto`
  - `400 Bad Request`
  - `429 Too Many Requests`

---

#### `POST /api/auth/register/admin`
Registra um novo usuário com role `Administrador`.

- **Auth:** Requerida — role `Administrador`
- **Body:** igual ao `/register`
- **Respostas:**
  - `201 Created` → `LoginResponseDto`
  - `400 Bad Request`
  - `401 Unauthorized`
  - `403 Forbidden`

---

#### `GET /api/auth/me`
Retorna os dados do usuário autenticado, incluindo suas roles e permissões.

- **Auth:** Requerida
- **Rate Limit:** `authenticated`
- **Respostas:**
  - `200 OK` → `CurrentUserDto`
  - `401 Unauthorized`

**`CurrentUserDto`:**
```json
{
  "userId": "guid",
  "email": "string",
  "fullName": "string",
  "roles": ["string"],
  "permissions": ["string"],
  "createdAt": "datetime",
  "lastLoginAt": "datetime"
}
```

---

#### `GET /api/auth/users`
Lista todos os usuários do sistema.

- **Auth:** Requerida — role `Administrador`
- **Respostas:**
  - `200 OK` → `UserDto[]`
  - `401 Unauthorized`
  - `403 Forbidden`

---

#### `POST /api/auth/change-password`
Altera a senha do usuário autenticado.

- **Auth:** Requerida
- **Body:**
  ```json
  {
    "currentPassword": "string",
    "newPassword": "string"
  }
  ```
- **Respostas:**
  - `200 OK`
  - `400 Bad Request`
  - `401 Unauthorized`

---

#### `POST /api/auth/users/{userId}/roles`
Atribui uma role a um usuário.

- **Auth:** Requerida — role `Administrador`
- **Params:** `userId` (guid)
- **Body:**
  ```json
  { "roleName": "string" }
  ```
- **Respostas:**
  - `200 OK`
  - `400 Bad Request`
  - `404 Not Found`
  - `401/403`

---

#### `DELETE /api/auth/users/{userId}/roles/{roleName}`
Remove uma role de um usuário.

- **Auth:** Requerida — role `Administrador`
- **Params:** `userId` (guid), `roleName` (string)
- **Respostas:**
  - `200 OK`
  - `404 Not Found`
  - `401/403`

---

#### `GET /api/auth/users/{userId}/roles`
Retorna as roles de um usuário específico.

- **Auth:** Requerida — role `Administrador`
- **Respostas:**
  - `200 OK` → `UserRolesDto`
  - `404 Not Found`
  - `401/403`

---

#### `DELETE /api/auth/users/{userId}`
Desativa (soft delete) um usuário.

- **Auth:** Requerida — role `Administrador`
- **Respostas:**
  - `204 No Content`
  - `400 Bad Request`
  - `404 Not Found`
  - `401/403`

---

### Resources — `/api/resources`

> Controla recursos de UI e as permissões por nível de acesso.

#### `GET /api/resources/my-permissions`
⭐ **Endpoint principal para o frontend.** Retorna todos os recursos que o usuário autenticado tem acesso.

- **Auth:** Requerida
- **Respostas:**
  - `200 OK` → `UserPermissionsDto`
  - `401 Unauthorized`

**`UserPermissionsDto`:**
```json
{
  "userId": "guid",
  "email": "string",
  "fullName": "string",
  "roles": ["string"],
  "allowedResources": [
    {
      "id": "guid",
      "code": "string",
      "name": "string",
      "description": "string",
      "module": "string",
      "frontendRoute": "string",
      "icon": "string",
      "displayOrder": 0,
      "userPermissionLevel": 1
    }
  ],
  "resourcePermissions": {
    "resourceCode": 1
  }
}
```

---

#### `GET /api/resources/check-access/{resourceCode}`
Verifica se o usuário tem acesso a um recurso específico.

- **Auth:** Requerida
- **Params:** `resourceCode` (string)
- **Query:** `minimumLevel` (int, default: 1 = Read)
- **Respostas:**
  - `200 OK`:
    ```json
    {
      "resourceCode": "string",
      "hasAccess": true,
      "userLevel": "Write",
      "minimumLevel": "Read",
      "canRead": true,
      "canWrite": true,
      "hasFull": false
    }
    ```

---

#### `GET /api/resources/user/{userId}`
Retorna permissões de recursos de um usuário específico.

- **Auth:** Requerida — role `Administrador`
- **Respostas:**
  - `200 OK` → `UserPermissionsDto`
  - `404 Not Found`

---

#### `GET /api/resources`
Lista todos os recursos cadastrados no sistema.

- **Auth:** Requerida — role `Administrador`
- **Respostas:**
  - `200 OK` → `ResourceDto[]`

---

#### `GET /api/resources/{id}`
Retorna um recurso pelo ID.

- **Auth:** Requerida — role `Administrador`
- **Respostas:**
  - `200 OK` → `ResourceDto`
  - `404 Not Found`

---

#### `POST /api/resources`
Cria um novo recurso de UI.

- **Auth:** Requerida — role `Administrador`
- **Body:**
  ```json
  {
    "code": "string (único)",
    "name": "string",
    "description": "string",
    "module": "string",
    "frontendRoute": "string",
    "icon": "string",
    "displayOrder": 0
  }
  ```
- **Respostas:**
  - `201 Created` → `ResourceDto`
  - `409 Conflict` (code duplicado)

---

#### `PUT /api/resources/{id}`
Atualiza um recurso existente.

- **Auth:** Requerida — role `Administrador`
- **Body:**
  ```json
  {
    "name": "string",
    "description": "string",
    "module": "string",
    "frontendRoute": "string",
    "icon": "string",
    "displayOrder": 0
  }
  ```
- **Respostas:**
  - `200 OK` → `ResourceDto`
  - `404 Not Found`

---

#### `DELETE /api/resources/{id}`
Deleta (soft delete) um recurso.

- **Auth:** Requerida — role `Administrador`
- **Respostas:**
  - `204 No Content`
  - `404 Not Found`

---

#### `POST /api/resources/assign`
Atribui ou atualiza o nível de permissão de uma role sobre um recurso.

- **Auth:** Requerida — role `Administrador`
- **Body:**
  ```json
  {
    "roleId": "guid",
    "resourceId": "guid",
    "level": 2
  }
  ```
  > `level`: 0=None, 1=Read, 2=Write, 3=Full
- **Respostas:**
  - `200 OK`
  - `400 Bad Request`

---

### Roles do tenant — `/api/tenants/{tenantId}/roles`

Substitui `/api/permissions/*`, removido no item 3B. É o que a tela **Roles**
(`/admin/roles`) consome.

Todos exigem o recurso `Role.Management`, com o nível inferido do verbo.

#### `GET /api/tenants/{tenantId}/roles`
Roles visíveis para o tenant: as canônicas do sistema **mais** as que ele criou.

- **Auth:** requerida + `Role.Management` nível `Read`
- **200:**
```json
[
  {
    "id": "guid",
    "name": "Leitura",
    "description": "string | null",
    "isCanonical": false,
    "memberCount": 2
  }
]
```
`isCanonical: true` = role do sistema: visível em todo tenant e **não pode ser excluída**.
`memberCount` conta só os membros **deste** tenant.

#### `POST /api/tenants/{tenantId}/roles`
Cria uma role pertencente ao tenant.

- **Auth:** requerida + `Role.Management` nível `Write`
- **Body:** `{ "name": "string (máx 64)", "description": "string | null" }`
- **201:** o `TenantRoleDto` criado
- **400:** nome vazio, nome já usado **neste** tenant, ou nome de role canônica
  (`"RH"`, `"Financeiro"`… são reservados)

> A role **nasce sem acesso nenhum** — zero `ResourcePermission`. É fail-closed de
> propósito: quem cria concede os níveis depois, na grade.

> Dois tenants **podem** ter roles de mesmo nome. A unicidade vale dentro do tenant.

#### `DELETE /api/tenants/{tenantId}/roles/{roleId}`
Exclui uma role do tenant.

- **Auth:** requerida + `Role.Management` nível `Full`
- **204:** excluída, junto de todos os níveis de acesso dela
- **400:** é role do sistema, ou ainda está atribuída a algum membro
- **404:** não existe, ou pertence a outro tenant

---

## Multi-tenancy

O backend é multi-tenant. Cada usuário pode pertencer a múltiplos tenants com um papel (`TenantRole`: `Member=0`, `Admin=1`, `Owner=2`). Permissões de módulo e recursos são **escopadas ao tenant ativo** — o token JWT só inclui claims `permission` quando há um tenant selecionado.

### Selecionando o tenant

Há duas formas de associar uma sessão a um tenant:

1. **Login direto com `tenantSlug`** — `POST /api/auth/login` com `tenantSlug` no body retorna um token já vinculado.
2. **Pós-login** — quando o login não fornece `tenantSlug`, a resposta vem com `tenantId: null`. O frontend deve então:
   - Listar memberships: `GET /api/tenants/me`
   - Selecionar: `POST /api/tenants/select` (retorna novo token com `tenant_id` claim)

### Header `X-Tenant-Id`

Como fallback, o middleware aceita o header `X-Tenant-Id` para resolver o tenant da requisição (apenas se o usuário for membro). Útil para alternar de tenant sem reemitir o token.

### Endpoints de Tenants — `/api/tenants`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/tenants` | JWT | Cria novo tenant; usuário vira Owner |
| GET  | `/api/tenants/me` | JWT | Lista memberships do usuário |
| GET  | `/api/tenants/{tenantId}` | JWT + membro | Detalhe do tenant |
| POST | `/api/tenants/select` | JWT | Body: `{ tenantId }` → retorna novo `LoginResponseDto` |
| GET  | `/api/tenants/{tenantId}/members` | JWT + membro | Lista membros |
| POST | `/api/tenants/{tenantId}/members` | JWT + Owner/Admin | Body: `{ userId, role }` |
| DELETE | `/api/tenants/{tenantId}/members/{userId}` | JWT + Owner/Admin | Remove membro |

### Endpoints de roles de membro — `/api/tenants/{tenantId}/members/{userId}/roles`

As "chaves de módulo" que o membro carrega naquele tenant.

| Método | Rota | Auth |
|---|---|---|
| GET | `/members/{userId}/roles` | JWT + Owner/Admin |
| POST | `/members/{userId}/roles` | JWT + Owner/Admin — body `{ roleName }` |
| DELETE | `/members/{userId}/roles/{roleName}` | JWT + Owner/Admin |
| GET | `/assignable-roles` | JWT + membro — canônicas **mais** as criadas por este tenant |

> **API keys foram removidas** (migration `RemoveApiKeys`, 2026-05-28). Não existe mais
> `/api/tenants/{tenantId}/api-keys` — este documento as descrevia muito depois de elas
> terem sumido.

---

## Fluxo Recomendado para o Frontend

```
1. POST /api/auth/login   (opcionalmente com tenantSlug)
   → Salvar token JWT no storage
   → Se response.tenantId estiver presente, ir para o passo 3
   → Caso contrário, ir para o passo 2

2. GET /api/tenants/me  +  POST /api/tenants/select
   → Mostrar tela de seleção de tenant
   → Salvar novo token e tenantId

3. GET /api/auth/me
   → Obter dados do usuário logado (roles + permissões de módulo do tenant ativo)

4. GET /api/resources/my-permissions
   → Obter recursos de UI com nível de acesso
   → Construir menu de navegação com base em `allowedResources`
   → Usar `resourcePermissions[code]` para controlar botões (editar, deletar, etc.)

5. Para verificar acesso pontual:
   GET /api/resources/check-access/{resourceCode}?minimumLevel=2
```

---

## Tratamento de Erros

Todos os erros são padronizados pelo middleware `ExceptionHandlingMiddleware`. Respostas de erro seguem o formato:

```json
{
  "message": "string descritiva do erro"
}
```

| Status | Situação |
|---|---|
| `400` | Dados inválidos ou regra de negócio violada |
| `401` | Token ausente, inválido ou expirado |
| `403` | Usuário autenticado, mas sem permissão suficiente |
| `404` | Recurso não encontrado |
| `409` | Conflito (ex: código de recurso duplicado) |
| `429` | Rate limit excedido |
| `500` | Erro interno (ver logs do servidor) |
