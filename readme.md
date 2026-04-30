# OmniVita Campaign Panel

Painel de campanha do OmniVita com frontend React/Vite, backend Node/Fastify, PostgreSQL local e fallback legado em HTML.

## Visao geral

O projeto hoje combina duas frentes:

- `frontend/`: interface nova em React, TypeScript e Tailwind.
- `backend/`: API local, sessoes, rotas de campanha e integracao com PostgreSQL.
- `assets/` + paginas HTML na raiz: fallback legado preservado durante a migracao.

O fluxo principal continua sendo local/Radmin, pensado para a mesa rodar na sua maquina e os jogadores entrarem pela rede.

## O que o sistema cobre

- login de mestre e jogador
- ficha de personagem com calculos automaticos
- painel do mestre
- combate sincronizado
- importacao e exportacao JSON
- mini-fichas, formas e OmniVita
- fallback legado para telas antigas

## Como rodar localmente

1. Garanta que o PostgreSQL local esteja ativo.
2. Configure o backend em `backend/.env`.
3. Rode:

```powershell
start-omnivita-local.bat
```

4. Abra:

```text
http://localhost:5500/index.html
```

## Como rodar via Radmin VPN

1. Abra o Radmin VPN e confirme que a rede esta conectada.
2. Rode:

```powershell
start-omnivita-radmin.bat
```

3. Compartilhe com os jogadores o endereco mostrado no terminal:

```text
http://IP_DO_RADMIN:5500/index.html
```

## Estrutura importante

- `frontend/src/` - paginas React, dominio do sistema e componentes
- `backend/src/` - rotas e logica da API
- `assets/js/` - regras e telas legadas
- `scripts/` - build, smoke test, start local e start via Radmin
- `migration-input/` - apoio para migracao/recuperacao de dados

## Comandos uteis

```powershell
npm.cmd run build
npm.cmd run check:frontend
npm.cmd run test:frontend
npm.cmd run dev:frontend
npm.cmd run smoke
npm.cmd run start:local
npm.cmd run start:radmin
```

## Fallback legado

Depois do build do frontend novo, as telas antigas continuam disponiveis em:

- `/legacy/index.html`
- `/legacy/mestre.html`
- `/legacy/personagem.html`

## Observacoes

- Os scripts de start atualizam a runtime config do frontend para apontar para a API correta.
- O build React e publicado em `frontend/dist/`.
- Logs locais, `node_modules` e builds gerados ficam ignorados pelo Git.
