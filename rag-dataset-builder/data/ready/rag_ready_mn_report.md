# Ready RAG Dataset Report

Total records: 4952
Source-grounded records: 2
Citation-safe records: 2
Synthetic/internal guidance records: 4950
Content word count range: 27-96
Average content word count: 42.9

## Categories
- Mixing: 4450
- Mastering: 500
- FL Studio Basics: 1
- Music Theory: 1

## Quality Tiers
- curated_synthetic_tip: 4500
- advanced_synthetic_tip: 450
- source_grounded: 2

## Source Types
- generated_internal_tip: 4950
- rewritten_from_reference: 2

## Files
- rag_ready_mn.jsonl: normalized JSONL for embedding pipelines
- rag_ready_mn.csv: human-readable inspection copy
- supabase_knowledge_base_seed.csv: import shape for Frontend/supabase-schema.sql knowledge_base

## Usage Notes
- Embed the `rag_text` field for best retrieval.
- Use `citation_safe=true` entries when the chatbot needs to cite sources.
- Entries with `source_type=generated_internal_tip` are useful guidance, but should not be presented as manual citations.
