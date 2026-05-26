# Local Music RAG Chatbot Setup

This project now has a local, open-source RAG chatbot for music production lessons.

## Run

1. Start Ollama:

```bash
ollama serve
```

2. Pull models:

```bash
ollama pull qwen3:8b
ollama pull bge-m3
```

3. Start Qdrant locally:

```bash
docker volume create qdrant-rag-data
docker run -d --name qdrant-rag -p 127.0.0.1:6333:6333 -v qdrant-rag-data:/qdrant/storage qdrant/qdrant
```

4. Add env values:

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=qwen3:8b
OLLAMA_EMBED_MODEL=bge-m3
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=music_lessons_rag
RAG_TOP_K=5
RAG_API_KEY=change-this-local-api-key
```

5. Ingest data:

```bash
npm run rag:ingest
```

6. Run project locally:

```bash
npm run dev
```

For access from another device on your LAN or through Tailscale, bind Next.js to all interfaces:

```bash
npm run dev -- -H 0.0.0.0
```

7. Test in the chat UI:

```text
kick bolon 808 hoorondoo murulduud bn yaj zasah ve?
```

## Add More Lesson Data

Add new lesson chunks to `data/rag/music-course-seed.json`, then run:

```bash
npm run rag:ingest
```

Each chunk should include `id`, `title`, `category`, `level`, `content`, `tags`, `source`, `language`, and `createdAt`.

## Local Architecture

User question -> Mongolian query normalization -> Ollama `bge-m3` embedding -> Qdrant top-k search -> grounded prompt -> Ollama `qwen3:8b` answer -> answer with source titles.

## Remote Use

When `RAG_API_KEY` is set, direct API calls need:

```http
Authorization: Bearer your-local-key
```

The floating chat drawer asks for the key once and stores it in that browser's local storage.

From another device, open the website:

```text
http://YOUR_HOME_PC_IP:3000
```

On the same Wi-Fi/LAN, `YOUR_HOME_PC_IP` is the home PC LAN IP. For school use, install Tailscale on the home PC and the MacBook, log in to the same account, then use the home PC's Tailscale IP instead. Keep Ollama and Qdrant on localhost; only expose the website/API port.
