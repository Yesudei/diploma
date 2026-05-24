# Deployment

Recommended target: Vercel, because this is a Next.js app with App Router API routes.

## Vercel Dashboard

1. Push this repository to GitHub.
2. In Vercel, import the repository.
3. Set Root Directory to `Frontend`.
4. Keep Framework Preset as `Next.js`.
5. Keep Install Command, Build Command, and Output Directory on the Vercel defaults.
6. Add the environment variables from `.env.example`.
7. Deploy.

Required production variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_NAME=Melodex
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

Choose one hosted chat provider:

```bash
# Built-in dataset fallback, no external LLM key required
CHAT_PROVIDER=local-rag-fallback
```

```bash
# Gemini
CHAT_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

```bash
# OpenAI-compatible
CHAT_PROVIDER=openai-compatible
OPENAI_COMPATIBLE_BASE_URL=https://api.openai.com/v1
OPENAI_COMPATIBLE_API_KEY=
CHAT_MODEL=gpt-4o-mini
```

Local Ollama settings are fine for development, but they will not work on Vercel
unless `OLLAMA_BASE_URL` points to a reachable hosted Ollama server.

The deployed `/api/chat` route reads its RAG data from:

```text
data/rag_ready_mn.jsonl
```

## Vercel CLI

From the app folder:

```bash
cd Frontend
npx vercel
npx vercel --prod
```

When prompted, use `Frontend` as the project root. After linking the project, add
the same environment variables in the Vercel dashboard or with `vercel env add`.

## Supabase

Before testing auth, courses, admin, or purchases in production, run these SQL
files in the Supabase SQL editor:

```text
supabase-schema.sql
supabase-admin-setup.sql
```

`supabase-schema.sql` also creates the `audio-files` storage bucket used by the
dashboard upload flow.

Also add your deployed site URL in Supabase Authentication URL settings so login,
register, and password reset redirects use the production domain.
