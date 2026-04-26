# SaaS Base Platform — Visão Geral do Sistema

Este documento descreve a arquitetura, regras de negócio e todos os endpoints da API REST do backend. Ele foi criado para orientar o desenvolvimento do **frontend**.

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
├── SaaS_BasePlatform.Domain          # Entidades, Enums, DTOs de domínio, catálogo de permissões
├── SaaS_BasePlatform.Application     # Serviços de aplicação, DTOs de aplicação, interfaces
├── SaaS_BasePlatform.Infrastructure  # Implementações (EF Core, JWT, Identity)
├── SaaS_BasePlatform.Api             # Controllers, Middlewares, Program.cs
└── SaaS_BasePlatform.Tests           # Testes automatizados
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

Existem **dois sistemas de autorização** que funcionam em conjunto:

### 1. Permissões por Módulo (string-based)

Permissões seguem o padrão `[módulo].[ação]`. Suportam **wildcard**: `employees.*` concede todas as permissões do módulo `employees`.

| Módulo | Permissões disponíveis |
|---|---|
| `employees` | `employees.view`, `employees.create`, `employees.edit`, `employees.delete`, `employees.manage_payments` |
| `worklogs` | `worklogs.view`, `worklogs.create`, `worklogs.edit`, `worklogs.delete` |
| `payments` | `payments.view`, `payments.create`, `payments.delete`, `payments.view_reports` |
| `products` | `products.view`, `products.create`, `products.edit`, `products.delete` |
| `customers` | `customers.view`, `customers.create`, `customers.edit`, `customers.delete` |
| `stock` | `stock.view`, `stock.manage`, `stock.view_reports` |

### 2. Permissões por Recurso de UI (ResourcePermission)

Cada recurso representa uma **tela ou seção do frontend**. Roles recebem um nível de acesso (`PermissionLevel`) por recurso.

| PermissionLevel | Valor | Significado |
|---|---|---|
| `None` | 0 | Usuário não vê nem sabe que o recurso existe |
| `Read` | 1 | Pode visualizar |
| `Write` | 2 | Pode visualizar e editar |
| `Full` | 3 | Acesso total (incluindo exclusão e configurações) |

**Como o frontend deve usar isso:**
1. Chamar `GET /api/resources/my-permissions` logo após o login.
2. A resposta contém `allowedResources` (lista de recursos que o usuário pode ver) e `resourcePermissions` (mapa `resourceCode → PermissionLevel`).
3. Usar esses dados para construir o menu de navegação e habilitar/desabilitar botões de ação.

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
    "password": "string"
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

### Permissions — `/api/permissions`

> Gerencia permissões de módulo (string-based) associadas às roles.
> Todos os endpoints requerem autenticação e permissão de recurso `permissions`.

#### `GET /api/permissions`
Lista todas as permissões disponíveis no sistema.

- **Auth:** Requerida + recurso `permissions` com nível `Read`
- **Respostas:**
  - `200 OK` → `PermissionDto[]`

**`PermissionDto`:**
```json
{
  "id": "guid",
  "name": "string (ex: employees.view)",
  "description": "string"
}
```

---

#### `GET /api/permissions/roles/{roleName}`
Retorna as permissões atribuídas a uma role específica.

- **Auth:** Requerida + recurso `permissions` com nível `Read`
- **Respostas:**
  - `200 OK` → `RolePermissionsDto`
  - `404 Not Found`

**`RolePermissionsDto`:**
```json
{
  "roleName": "string",
  "permissions": [{ "id": "guid", "name": "string", "description": "string" }]
}
```

---

#### `POST /api/permissions/roles/{roleName}/grant`
Concede uma permissão a uma role.

- **Auth:** Requerida + recurso `permissions` com nível `Full`
- **Body:**
  ```json
  {
    "permissionName": "employees.view",
    "reason": "string (opcional)"
  }
  ```
- **Respostas:**
  - `200 OK`
  - `400 Bad Request`
  - `404 Not Found`

---

#### `DELETE /api/permissions/roles/{roleName}/revoke/{permissionName}`
Revoga uma permissão de uma role.

- **Auth:** Requerida + recurso `permissions` com nível `Full`
- **Query:** `reason` (string, opcional)
- **Respostas:**
  - `200 OK`
  - `400 Bad Request`
  - `404 Not Found`

---

#### `GET /api/permissions/audit`
Retorna o histórico de auditoria de mudanças em permissões.

- **Auth:** Requerida + recurso `permissions` com nível `Read`
- **Query:**
  - `roleName` (string, opcional — filtra por role)
  - `take` (int, default: 100)
- **Respostas:**
  - `200 OK` → `PermissionAuditDto[]`

**`PermissionAuditDto`:**
```json
{
  "id": "guid",
  "roleName": "string",
  "permissionName": "string",
  "action": "Granted | Revoked",
  "performedByUserEmail": "string",
  "performedAt": "datetime",
  "reason": "string"
}
```

---

## Fluxo Recomendado para o Frontend

```
1. POST /api/auth/login
   → Salvar token JWT no storage

2. GET /api/auth/me
   → Obter dados do usuário logado (roles + permissões de módulo)

3. GET /api/resources/my-permissions
   → Obter recursos de UI com nível de acesso
   → Construir menu de navegação com base em `allowedResources`
   → Usar `resourcePermissions[code]` para controlar botões (editar, deletar, etc.)

4. Para verificar acesso pontual:
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
