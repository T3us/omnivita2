# Arquivos esperados em `migration-input/`

Coloque aqui os exports do projeto antigo antes de rodar:

- `profiles.json`
- `characters.json`
- `companions.json`
- `auth-users.json` opcional

## Formato aceito
- Pode ser um array JSON puro.
- Também pode ser um objeto com a chave `data`.

## Observação
Se `auth-users.json` não existir, o importador tenta:
1. usar as contas de `assets/js/mock-data.js`
2. gerar senha temporária para o que faltar

O relatório sai em:
- `migration-input/import-report.json`
