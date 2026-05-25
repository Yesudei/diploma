# Accessing Home PC Ollama from School (or Anywhere)

By default Ollama only listens on `localhost`, so it is not reachable from outside your home PC.
This guide covers three free ways to expose it — plus the Vercel/env-var wiring you need once you have a URL.

---

## 0. Make Ollama listen on all interfaces (do this first, on the home PC)

### macOS / Linux

```bash
OLLAMA_HOST=0.0.0.0 ollama serve
```

Or add it to your shell profile so it persists:

```bash
echo 'export OLLAMA_HOST=0.0.0.0' >> ~/.zshrc   # or ~/.bashrc
source ~/.zshrc
ollama serve
```

### Windows

1. Open **System Properties → Advanced → Environment Variables**
2. Under *System variables*, click **New**
   - Variable name: `OLLAMA_HOST`
   - Variable value: `0.0.0.0`
3. Click OK, then **restart the Ollama service** (or reboot)

> After this change, Ollama will be available at `http://0.0.0.0:11434` (i.e. on every network interface of your home PC).

---

## 1. ngrok (free, easiest, works immediately)

### Setup

```bash
# Install ngrok: https://ngrok.com/download
# Then authenticate once (free account needed):
ngrok config add-authtoken YOUR_NGROK_TOKEN

# Start the tunnel
ngrok http 11434
```

You will see output like:

```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:11434
```

Copy the `https://...ngrok-free.app` URL.

### Set the env var

**.env.local** (on your MacBook / school laptop):

```env
OLLAMA_BASE_URL=https://abc123.ngrok-free.app
```

**Vercel dashboard** (Project Settings → Environment Variables):

| Name             | Value                              |
|------------------|------------------------------------|
| OLLAMA_BASE_URL  | https://abc123.ngrok-free.app      |

> **Note:** The ngrok URL changes every time you restart the tunnel unless you pay for a reserved domain.
> Re-deploy on Vercel (or just trigger a redeploy) each time the URL changes.

---

## 2. Cloudflare Tunnel (free, no account required for quick tunnels)

```bash
# Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
cloudflared tunnel --url http://localhost:11434
```

Output:

```
Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):
https://your-tunnel.trycloudflare.com
```

Use that URL as `OLLAMA_BASE_URL` exactly as described above for ngrok.

> **Tip:** For a permanent tunnel (same URL every time), create a free Cloudflare Zero Trust account and use a named tunnel with `cloudflared tunnel create` + a config file.

---

## 3. Tailscale (best for a permanent home-lab setup)

Tailscale creates a private WireGuard mesh between all your devices. No ports need to be forwarded.

### Setup

1. Install Tailscale on your **home PC**: https://tailscale.com/download
2. Install Tailscale on your **school laptop / MacBook**
3. Log in with the same account on both devices
4. Find your home PC's Tailscale IP in the Tailscale admin panel (looks like `100.x.y.z`)

```env
OLLAMA_BASE_URL=http://100.x.y.z:11434
```

> Tailscale IPs are stable — the URL never changes.
> This option does **not** work for Vercel (Vercel cannot join your Tailscale network), but it is ideal for local development from school.

---

## 4. Environment variables to set

Once you have an `OLLAMA_BASE_URL`, set these together:

```env
OLLAMA_BASE_URL=https://your-tunnel-url-here
OLLAMA_CHAT_MODEL=qwen3:8b
OLLAMA_EMBED_MODEL=bge-m3
```

- `OLLAMA_CHAT_MODEL` — used by `/api/chat` and `/api/audio-analyze`
- `OLLAMA_EMBED_MODEL` — used by the RAG pipeline to generate embeddings

---

## 5. Adding variables to Vercel

1. Go to your project on https://vercel.com
2. **Project Settings → Environment Variables**
3. Add each variable with its value and select the environments (Production / Preview / Development) you want it applied to
4. Click **Save**, then trigger a **Redeploy** for the new values to take effect

---

## 6. Security note

> ngrok and Cloudflare quick tunnels expose your Ollama instance to the **public internet**.
> Anyone who knows the URL can send requests to your Ollama server.

To restrict access to the Melodex chat endpoint, set a shared secret:

```env
RAG_API_KEY=some-long-random-string
```

The `/api/chat` route will then require clients to send `x-rag-api-key: <value>` in the request header.
This does **not** lock down raw Ollama — for that, consider running Ollama behind a reverse proxy (nginx/Caddy) with HTTP Basic Auth.

---

## Quick reference

| Method         | Free | Persistent URL | Works on Vercel | Setup time |
|----------------|------|----------------|-----------------|------------|
| ngrok          | Yes  | No (paid)      | Yes             | ~2 min     |
| Cloudflare     | Yes  | With account   | Yes             | ~2 min     |
| Tailscale      | Yes  | Yes            | No              | ~5 min     |
