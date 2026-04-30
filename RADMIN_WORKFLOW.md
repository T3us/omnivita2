# OmniVita via Radmin VPN

Este modo roda o site, a API e o banco a partir do PC do mestre. Os jogadores acessam pela rede privada do Radmin VPN.

## Como subir a sessao

1. Abra o Radmin VPN e confirme que ele esta conectado.
2. Abra o PostgreSQL local.
3. Rode `start-omnivita-radmin.bat`.
4. Se o Windows pedir permissao de firewall para `Node.js`, permita em redes privadas.
5. Passe para os jogadores o link exibido no terminal.

O link abre o frontend React novo e fica no formato:

```text
http://IP_DO_RADMIN:5500/index.html
```

## Como os jogadores entram

1. Instalar o Radmin VPN.
2. Entrar na mesma rede do mestre.
3. Abrir o link informado pelo mestre.

## Importante

- O PC do mestre precisa ficar ligado.
- PostgreSQL, backend, site local e Radmin precisam continuar rodando.
- Se o IP do Radmin mudar, rode `start-omnivita-radmin.bat` de novo.
- O script atualiza `assets/js/runtime-config.js` e refaz o build automaticamente.
- O painel antigo continua disponivel em `/legacy/` durante a migracao.

## Teste rapido

No terminal, use a URL mostrada pelo script:

```powershell
$env:API_BASE_URL='http://IP_DO_RADMIN:3001'
npm.cmd run smoke
```

Se aparecer `Smoke concluido com sucesso`, a API esta funcionando.
