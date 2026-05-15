# Launcher Cloudflare do OmniVita

Este launcher inicia o OmniVita no Linux/CachyOS com backend, frontend Vite e Cloudflare Quick Tunnel em um clique.

## Instalar o atalho

Rode uma vez dentro da pasta do projeto:

```bash
bash install-omnivita-launcher.sh
```

Depois disso, procure por **OmniVita Cloudflare** no menu de aplicativos ou use o atalho criado na Área de Trabalho, se a pasta existir.

## Iniciar manualmente

```bash
./start-omnivita-cloudflare.sh
```

Modo simples, sem abrir navegador e sem copiar link:

```bash
./start-omnivita-simple.sh
```

## O que o launcher faz

- sobe o backend em `http://localhost:3001`;
- sobe o frontend em `http://localhost:5173`;
- inicia `cloudflared tunnel --url http://localhost:5173`;
- captura o link `trycloudflare.com`;
- salva o link em `.omnivita-cloudflare-url`;
- copia o link para a área de transferência quando possível;
- abre o navegador em `/mestre`.

Quando estiver pronto, ele mostra:

- Mestre: `https://...trycloudflare.com/mestre`
- Players: `https://...trycloudflare.com`
- Debug: `https://...trycloudflare.com/debug-connection`
- Local: `http://localhost:5173`

## Logs

Os logs ficam em:

```text
logs/backend.log
logs/frontend.log
logs/cloudflared.log
```

Se algo falhar, olhe primeiro o log indicado pelo terminal.

## Clipboard

Para copiar o link automaticamente, instale um helper:

```bash
sudo pacman -S xclip
```

Em Wayland, prefira:

```bash
sudo pacman -S wl-clipboard
```

Se nenhum estiver instalado, o launcher continua funcionando e imprime o link no terminal.

## Se o Cloudflare não gerar link

Veja:

```bash
tail -n 120 logs/cloudflared.log
```

Quick Tunnel pode falhar se existir uma configuração em:

```text
~/.cloudflared/config.yml
~/.cloudflared/config.yaml
```

Nesse caso, mova a configuração temporariamente ou use um túnel nomeado.

## Localhost, LAN e Cloudflare

- `localhost`: só funciona no seu próprio computador.
- IP LAN, tipo `192.168.x.x`: funciona para aparelhos na mesma rede local.
- `trycloudflare.com`: funciona pela internet enquanto o `cloudflared` estiver rodando.

Quick Tunnel é ótimo para desenvolvimento e teste. Para um link fixo no futuro, use um tunnel nomeado com domínio próprio:

```bash
cloudflared tunnel create NOME
cloudflared tunnel route dns NOME seu-dominio.com
cloudflared tunnel run NOME
```

Isso exige configurar DNS na Cloudflare.

## Portas ocupadas

Por padrão, o launcher não mata processos de outros projetos. Se uma porta estiver ocupada, ele avisa.

Se você quiser que ele tente liberar as portas antigas:

```bash
OMNIVITA_STOP_EXISTING=1 ./start-omnivita-cloudflare.sh
```
