# OmniVita Backend

API local do OmniVita para autenticacao, fichas, dados do mestre, combate e sincronizacao em tempo real.

## Rodando so o backend

```powershell
cd backend
npm.cmd install
Copy-Item .env.example .env
npm.cmd run migrate
npm.cmd run restore:fresh
npm.cmd run dev
```

Para a mesa completa, use os atalhos da raiz:

- `start-omnivita-local.bat`
- `start-omnivita-radmin.bat`

Eles sobem o backend, atualizam a URL da API no front, geram `dist/` e servem o site na porta `5500`.

## Endpoints principais

- `GET /health`
- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `GET /api/bootstrap`
- `GET /api/characters/me`
- `GET /api/characters`
- `GET /api/characters/:id`
- `PUT /api/characters/:id`
- `GET /api/combat`
- `PUT /api/combat`
- `POST /api/combat/control`
- `GET /api/master-data/:key`
- `PUT /api/master-data/:key`

## Banco

O backend usa PostgreSQL local pela variavel `DATABASE_URL` em `backend/.env`.

`bcryptjs` foi mantido no lugar de `bcrypt` para evitar build nativo no Windows.
