---
name: design-sync
description: Sincroniza os design tokens do Prumo entre o Claude Design (fonte da verdade) e src/styles.scss. Use quando o usuário disser que mudou algo no design system, pedir para replicar cores/tokens no front, perguntar se os dois estão em dia, ou quando um token novo nascer no código e precisar subir. Também cobre a verificação de aderência (nenhum hex chumbado, nenhum token órfão).
user-invocable: true
---

# Sync do design system do Prumo

## O contrato

O design system vive no **Claude Design**, projeto **"SaaS Base Platform Design
System"**, id `019df28f-17ee-750e-a62f-64153583d01b`. O arquivo canônico é
`colors_and_type.css`.

**Ele é a fonte da verdade.** `src/styles.scss` é um espelho: o bloco `:root`
dele deve conter exatamente o mesmo conjunto de tokens, com os mesmos valores.

Regra que o `styles.scss` declara no topo e que este sync existe para manter:
**nenhum hex chumbado em `.scss` de componente.** Valor que não existe como
token nasce no design system primeiro, não como exceção local.

> O usuário tem outros 2 projetos chamados só "Design System" (de julho/2026).
> São rascunhos. Não são estes.

## Direção 1 — design system → código (o caso comum)

Quando o usuário disser "mudei X no Claude Design, replica no front":

1. `DesignSync` `get_file` em `colors_and_type.css`.
2. Extraia as definições de token do bloco `:root` e compare com as de
   `src/styles.scss`:

   ```bash
   ./.claude/skills/design-sync/check-tokens.sh
   ```

   Esse script lista tokens definidos, tokens usados, órfãos e hex chumbado.
   Para o diff de **valores** (não só de nomes), compare o `:root` remoto com o
   local lado a lado — o script só cobre nomes.
3. **Mostre o diff ao usuário antes de aplicar.** Token removido lá em cima é
   quebra: algum `.scss` pode referenciá-lo. O script acusa isso como órfão.
4. Aplique no `:root` do `styles.scss`. Não toque nas seções de tema do Material
   nem nos overrides — só o bloco de tokens.
5. Verifique (ver "Verificação" abaixo).

## Direção 2 — código → design system (o caso raro)

Quando um valor novo nascer no código, ele **precisa** subir, senão a fonte da
verdade deixa de ser verdade.

1. Escreva o `colors_and_type.css` completo, com a adição, num arquivo local.
   Só a adição — não reformate nem reordene o resto.
2. `finalize_plan` com `writes: ["colors_and_type.css"]`, `deletes: []` e
   `localDir` apontando para onde o arquivo está.

   > **`finalize_plan` exige o campo `deletes` mesmo vazio.** Sem ele, erro.

3. `write_files` com o `planId` e `localPath`.
4. **Confira de volta** com `get_file`: os tokens novos entraram e nada mais
   mudou.

**Peça o ok do usuário antes.** Isso escreve no projeto dele na nuvem.

## Verificação

Sempre, depois de qualquer sync:

```bash
./.claude/skills/design-sync/check-tokens.sh   # hex chumbado = 0, órfãos = 0
npm run build:prod                              # tem que ficar limpo
```

**Build limpo não prova nada visual.** Trocar um token por outro de valor
diferente compila igual e quebra a tela. Se a mudança altera valores (e não só
nomes), suba a app e olhe:

```bash
cd ../SaaSBasePlatform && docker compose up -d && dotnet run --project Prumo.Api
npm start   # neste repo
```

A app pede login. **Não digite senha em formulário** — peça ao usuário que faça
o login e avise; depois disso dá para navegar sozinho.

Telas que cobrem a maior parte dos tokens: login (gradientes, orbes, sombras),
dashboard visão geral (hero, stat icons, role chip), dashboard contábil (chips de
status), Tenant e Roles por Usuário (page headers, avatares, badges). A toolbar e
o sidenav aparecem em todas.

## O que ainda não foi trazido, de propósito

O design system tem classes base (`.card`, `.chip`, `.role-chip`, `.stat-icon`,
`.page-header`) que o Angular **não** usa — cada componente reimplementa o
padrão no seu `.scss`. Trazê-las é refactor de marcação, não de token, e o
momento natural é o item 5 do backlog (a linha expansível com feature roles, que
precisa justamente do `.role-chip`).

Não faça isso de carona num sync de token.
