# Launcher Cloudflare do OmniVita

Este launcher inicia o OmniVita no Linux/CachyOS com backend, frontend Vite e Cloudflare Quick Tunnel em um clique.

## Instalar o atalho

Rode uma vez dentro da pasta do projeto:

```bash
bash install-omnivita-launcher.sh
```

Depois procure por **OmniVita Cloudflare** no menu de aplicativos ou use o atalho criado na Área de Trabalho.

## Iniciar manualmente

```bash
./start-omnivita-cloudflare.sh
```

Modo simples, sem abrir navegador e sem copiar link:

```bash
./start-omnivita-simple.sh
```

## O que o launcher faz

- inicia o backend em `http://127.0.0.1:3001`;
- espera `/health` responder;
- inicia o frontend em `http://127.0.0.1:5173`;
- espera o Vite responder;
- inicia `cloudflared tunnel --url http://127.0.0.1:5173`;
- captura o link `trycloudflare.com`;
- valida o link público antes de mostrar, copiar ou abrir;
- se o link público retornar 502/503/504, reinicia apenas o `cloudflared` e tenta outro link;
- salva o link validado em `.omnivita-cloudflare-url`.

O script valida:

- `/`
- `/tabletop`
- `/debug-connection`
- `/health`

Ele só mostra **OMNIVITA ONLINE** quando essas rotas respondem sem erro de origem.

## Links exibidos

Quando estiver pronto, ele mostra:

- Mestre: `https://...trycloudflare.com/mestre`
- Tabletop: `https://...trycloudflare.com/tabletop`
- Players: `https://...trycloudflare.com`
- Debug: `https://...trycloudflare.com/debug-connection`
- Local: `http://127.0.0.1:5173`

Por padrão, o navegador abre em `/tabletop`. Para abrir outro caminho:

```bash
OPEN_PATH=/mestre ./start-omnivita-cloudflare.sh
```

## O que significa 502

`HTTP 502 Bad Gateway - Unable to reach the origin service` significa que o domínio Cloudflare foi criado, mas o túnel não conseguiu alcançar o serviço local.

As causas comuns são:

- Vite ainda não estava pronto;
- túnel apontou para porta errada;
- link antigo foi aberto;
- processo antigo do `cloudflared` ficou preso;
- o Vite caiu depois que o link foi gerado.

O launcher agora evita isso validando `127.0.0.1:5173` antes de iniciar o túnel e rejeitando links públicos com 502.

## Logs

Os logs ficam em:

```text
logs/backend.log
logs/frontend.log
logs/cloudflared.log
```

Se algo falhar:

```bash
tail -n 120 logs/cloudflared.log
```

## Debug no navegador

A rota:

```text
/debug-connection
```

mostra href atual, origin, tipo de acesso, health, API, socket e um botão para copiar diagnóstico.

## Clipboard

Para copiar o link automaticamente:

```bash
sudo pacman -S xclip
```

Em Wayland:

```bash
sudo pacman -S wl-clipboard
```

Se nenhum estiver instalado, o launcher continua funcionando e imprime o link no terminal.

## Cloudflared e configs antigas

Quick Tunnel pode falhar se existir uma configuração em:

```text
~/.cloudflared/config.yml
~/.cloudflared/config.yaml
```

O launcher avisa quando detectar isso, mas não renomeia arquivos automaticamente.

## Portas ocupadas

Por padrão, o launcher tenta encerrar processos antigos do próprio OmniVita nas portas `3001` e `5173`.

Se a porta estiver ocupada por outro projeto, ele para e mostra erro. Para forçar:

```bash
OMNIVITA_STOP_EXISTING=1 ./start-omnivita-cloudflare.sh
```

## Localhost, LAN e Cloudflare

- `localhost`/`127.0.0.1`: só funciona no seu computador.
- IP LAN, tipo `192.168.x.x`: funciona para aparelhos na mesma rede local.
- `trycloudflare.com`: funciona pela internet enquanto o `cloudflared` estiver rodando.

Quick Tunnel é para desenvolvimento/teste e o link muda a cada execução. Para link fixo no futuro, use tunnel nomeado com domínio próprio:

```bash
cloudflared tunnel create NOME
cloudflared tunnel route dns NOME seu-dominio.com
cloudflared tunnel run NOME
```
