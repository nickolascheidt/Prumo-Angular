# Prumo — Frontend

[![ci](https://github.com/nickolascheidt/Prumo-Angular/actions/workflows/ci.yml/badge.svg)](https://github.com/nickolascheidt/Prumo-Angular/actions/workflows/ci.yml)

*[Read in English](README.md)*

O SPA em Angular 18 do Prumo, um ERP multi-tenant: contas a pagar, um núcleo financeiro
simples (plano de contas e razão geral), RH (funcionários, horas trabalhadas, pagamentos)
e controle de acesso por tenant.

É um projeto de portfólio e não roda em produção. A API, onde ficam o isolamento entre
tenants e o controle de acesso, é o [Prumo](https://github.com/nickolascheidt/Prumo); o
desenho de deploy está no [Prumo-DevOps](https://github.com/nickolascheidt/Prumo-DevOps).

A interface está em inglês. As capturas estão no [README em inglês](README.md).

## O que o frontend faz

- **Menus e rotas seguem o modelo de acesso da API.** Depois do login o SPA carrega o
  nível do usuário em cada recurso do tenant selecionado. O menu lateral esconde o que
  ele não alcança, e o `resourceAccessGuard` barra a rota com o nível que a tela exige
  (`Read` para abrir, `Write` para os formulários de criar e editar). A API aplica as
  mesmas regras por conta própria; o SPA só evita oferecer o que seria recusado.
- **Roles e membros são administrados por tenant.** Owners e admins criam roles, definem
  o nível delas em cada recurso e distribuem "chaves de módulo" aos membros. Pessoas são
  adicionadas por e-mail: conta existente entra na hora; senão, um convite espera o
  cadastro.
- **O ciclo da conta tem telas próprias**: cadastro, confira seu e-mail, confirmação,
  esqueci e redefinir senha, e uma tela de espera para contas que ainda não pertencem a
  nenhuma empresa.
- **Datas de calendário continuam datas de calendário.** Vencimentos, dias trabalhados e
  períodos são exibidos em UTC e enviados como `AAAA-MM-DD` (`core/utils/date-only.ts`),
  para não voltarem um dia em fusos a oeste de Greenwich.

## Rodando localmente

Precisa de Node.js 20+ e da [API](https://github.com/nickolascheidt/Prumo) rodando em
`http://localhost:5201`.

```bash
npm install
npm start          # http://localhost:4200
npm test           # testes unitários (Karma)
```

A API semeia um master admin (`admin@SBP.com`, com a senha definida nos user secrets da
API). Para ver o app como um membro comum, cadastre-se com qualquer e-mail: o link de
confirmação sai no log da API em Development.

## Licença

[MIT](LICENSE)
