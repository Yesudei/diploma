# RAG Dataset Builder for AI Music Mentor

This project prepares a small, copyright-safe dataset for an AI Music Mentor chatbot. The chatbot is designed for complete beginners learning music production, FL Studio basics, beat making, music theory, mixing, mastering, and common beginner problems.

## What RAG Is

RAG means Retrieval-Augmented Generation. Instead of asking a chatbot to answer only from memory, we store trusted learning entries in a searchable database. When a student asks a question, the app finds the most relevant entries, sends those entries to the AI model as context, and the model writes a helpful answer from that context.

For this diploma project, the dataset will later be embedded and stored in Supabase `pgvector`.

## Why We Do Not Copy Full Pages

FL Studio manuals, tutorials, and many websites are copyrighted. This project does not save full page text into the final dataset. The extractor keeps only lightweight metadata:

- source URL
- page title
- h1/h2/h3 headings
- a few short snippets for topic hints

The generated RAG entries are original Mongolian explanations written in our own words. Each entry keeps `source_url` so the original reference can be checked later.

## Project Structure

```text
rag-dataset-builder/
  README.md
  .env.example
  requirements.txt
  sources.txt
  scripts/
    extract_topics.py
    generate_dataset.py
    validate_dataset.py
  data/
    raw_extracted_topics.jsonl
    rag_dataset_mn.jsonl
    rag_dataset_mn.csv
    failed_generation.jsonl
```

## Dataset Format

Each generated entry looks like this:

```json
{
  "id": "unique_id",
  "title": "Beginner-friendly title",
  "category": "FL Studio Basics",
  "level": "Beginner",
  "content": "80-150 word original Mongolian explanation.",
  "keywords": ["English keyword", "Mongolian keyword"],
  "source_url": "https://example.com/reference",
  "source_type": "rewritten_from_reference"
}
```

Allowed categories:

- `FL Studio Basics`
- `Music Basics`
- `Beat Making`
- `Music Theory`
- `Mixing`
- `Mastering`
- `Common Problems`

## Setup

Run these commands from the project folder:

```powershell
cd rag-dataset-builder
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If PowerShell blocks virtual environment activation, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

## Optional AI Setup

The generator can run in three modes:

- `AI_PROVIDER=none`: use the local placeholder generator. No API key needed.
- `AI_PROVIDER=gemini`: call Gemini and ask it to return one JSON dataset entry.
- `AI_PROVIDER=openai`: call OpenAI and ask it to return one JSON dataset entry.

Create your local `.env` file from the example:

```powershell
Copy-Item .env.example .env
```

For the default no-key mode:

```env
AI_PROVIDER=none
```

For Gemini:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-2.5-flash
```

For OpenAI:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Optional settings:

```env
AI_MAX_RETRIES=3
AI_REQUEST_TIMEOUT=60
```

The `.env` file is ignored by Git so API keys are not uploaded.

## Add Sources

Edit `sources.txt` and add one URL per line:

```text
https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/basics_workflow.htm
https://en.wikipedia.org/wiki/Music_theory
```

Blank lines and lines starting with `#` are ignored.

## Run the Pipeline

Extract copyright-safe topic metadata:

```powershell
python scripts/extract_topics.py --sources sources.txt --output data/raw_extracted_topics.jsonl
```

Generate original beginner-friendly Mongolian RAG entries:

```powershell
python scripts/generate_dataset.py --input data/raw_extracted_topics.jsonl --jsonl-output data/rag_dataset_mn.jsonl --csv-output data/rag_dataset_mn.csv
```

If `AI_PROVIDER=gemini` or `AI_PROVIDER=openai`, failed AI responses are saved here:

```text
data/failed_generation.jsonl
```

Validate the generated dataset:

```powershell
python scripts/validate_dataset.py --input data/rag_dataset_mn.jsonl
```

## Generation Method

The script reads `.env` with `python-dotenv`.

When `AI_PROVIDER=none`, `generate_mongolian_entry(topic)` uses the safe local placeholder generator.

When `AI_PROVIDER=gemini`, the script calls the Gemini REST API with JSON output enabled.

When `AI_PROVIDER=openai`, the script calls the OpenAI Responses API with structured JSON output enabled.

The AI prompt always includes this rule:

```text
Do not copy the source text. Write in original words.
```

The AI output is parsed as JSON and validated before it is saved. If the output is missing fields, uses the wrong category, has the wrong word count, or changes the original `source_url`, the topic is retried. If it still fails, it is written to `data/failed_generation.jsonl`.

## Duplicate Checking and Validation

The pipeline checks:

- duplicate source URLs
- duplicate generated titles
- content that is very similar to another entry
- invalid AI JSON output
- failed AI generation records
- empty content
- word count between 80 and 150 words
- valid `source_url`
- allowed category
- `level` must be `Beginner`

Similarity warnings are useful because the current template generator can make entries look alike. When AI generation is added, those warnings should become less frequent.

## Later: Supabase pgvector

After the JSONL/CSV dataset is approved, the next step is embedding.

Typical flow:

1. Read `data/rag_dataset_mn.jsonl`.
2. For each entry, combine `title`, `content`, and `keywords`.
3. Send that text to an embedding model.
4. Store the embedding vector in a Supabase table with `pgvector`.
5. At chatbot time, embed the user's question.
6. Search Supabase for the closest vectors.
7. Send the matching Mongolian entries to the AI model as context.

Example table idea:

```sql
create extension if not exists vector;

create table rag_music_entries (
  id text primary key,
  title text not null,
  category text not null,
  level text not null,
  content text not null,
  keywords text[],
  source_url text not null,
  source_type text not null,
  embedding vector(1536)
);
```

The vector size depends on the embedding model you choose later.
