"""
Build a cleaned, ready-to-embed RAG dataset from the local project datasets.

The output keeps source-grounded learning entries separate from generated
troubleshooting tips by metadata, while using one normalized schema for both.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
PROJECT = ROOT / "rag-dataset-builder"
READY_DIR = PROJECT / "data" / "ready"

OMT_SOURCE_URL = "https://viva.pressbooks.pub/openmusictheory/"
OMT_SOURCE_NAME = "Open Music Theory Version 2"

ALLOWED_CATEGORIES = {
    "FL Studio Basics",
    "Music Basics",
    "Beat Making",
    "Music Theory",
    "Mixing",
    "Mastering",
    "Common Problems",
}

CATEGORY_MAP = {
    "Rhythm": "Music Theory",
    "Harmony": "Music Theory",
    "Song Structure": "Music Theory",
    "Composition": "Music Theory",
    "Orchestration": "Music Theory",
    "Popular Music": "Music Theory",
    "General": "Music Basics",
    "Equalization & Filtering": "Mixing",
    "Compression & Dynamics": "Mixing",
    "Reverb & Spatial Processing": "Mixing",
    "Delay & Time-Based Effects": "Mixing",
    "Saturation & Distortion": "Mixing",
    "Creative Effects & Sound Design": "Mixing",
    "Mixing Fundamentals": "Mixing",
    "Stem Processing & Bussing": "Mixing",
    "Mastering & Loudness": "Mastering",
    "Compression & Dynamics - Frequency Masking": "Mixing",
    "Compression & Dynamics - Phase Interaction": "Mixing",
    "Compression & Dynamics - Non-Linear Distortion": "Mixing",
}

META_SENTENCE_PATTERNS = [
    r"RAG чатботод энэ мэдээлэл нь хэрэглэгчийн асуултад богино,\s*ойлгомжтой тайлбар өгөх context болж ашиглагдана\.?",
    r"Энэ сэдэв нь хөгжмийн хамгийн суурь ойлголтод ордог\.?",
    r"Beat хийх,\s*MIDI бичих,\s*piano roll дээр нот байрлуулах үед ийм мэдлэг хэрэгтэй болдог\.?",
    r"Гол санаа нь тухайн ойлголтын нэр,\s*үүрэг,\s*сонсголын нөлөө болон практик хэрэглээг ялгаж сурахад чиглэнэ\.?",
]

NOISE_PHRASES = [
    "RAG чатботод",
    "context болж ашиглагдана",
]

TOKEN_RE = re.compile(r"[A-Za-zА-Яа-яӨөҮүЁё0-9+#.-]+", re.UNICODE)
MONGOLIAN_RE = re.compile(r"[А-Яа-яӨөҮүЁё]")
MOJIBAKE_MARKERS = ("Ð", "Ñ", "Â", "Ã")
STOPWORDS = {
    "the",
    "and",
    "or",
    "with",
    "from",
    "into",
    "for",
    "not",
    "of",
    "to",
    "in",
    "on",
    "a",
    "an",
    "ба",
    "болон",
    "дээр",
    "арга",
    "үндэс",
}

TERM_EQUIVALENTS = {
    "chord": ["chord", "chords", "аккорд"],
    "chords": ["chord", "chords", "аккорд"],
    "rhythm": ["rhythm", "хэмнэл"],
    "meter": ["meter", "метр", "хэмнэл"],
    "clef": ["clef", "таван шугам"],
    "notation": ["notation", "тэмдэглэгээ", "нот"],
    "note": ["note", "notes", "нот"],
    "notes": ["note", "notes", "нот"],
    "interval": ["interval", "интервал"],
    "scale": ["scale", "гамм"],
    "scales": ["scale", "гамм"],
    "melody": ["melody", "ая"],
    "harmony": ["harmony", "хармони"],
    "triad": ["triad", "аккорд"],
    "pitch": ["pitch", "дууны өндөр"],
    "tone": ["tone", "тон"],
    "tones": ["tone", "тон"],
    "form": ["form", "бүтэц", "хэлбэр"],
}


def load_json(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8-sig") as file:
        data = json.load(file)
    if not isinstance(data, list):
        raise ValueError(f"{path} must contain a JSON array")
    return data


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            if not line.strip():
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"{path}:{line_number} invalid JSON: {exc}") from exc
            if isinstance(record, dict):
                records.append(record)
    return records


def clean_text(value: Any) -> str:
    text = str(value or "")
    text = text.replace("\ufeff", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def clean_content(value: Any) -> str:
    text = clean_text(value)
    for pattern in META_SENTENCE_PATTERNS:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)
    text = text.replace(" ,", ",").replace(" .", ".")
    text = re.sub(r"\s+", " ", text).strip(" -")
    return text


def normalize_key(value: str) -> str:
    tokens = TOKEN_RE.findall(value.casefold())
    return " ".join(tokens)


def word_count(value: str) -> int:
    return len(TOKEN_RE.findall(value))


def has_mongolian(value: str) -> bool:
    return bool(MONGOLIAN_RE.search(value))


def has_mojibake(value: str) -> bool:
    return any(marker in value for marker in MOJIBAKE_MARKERS)


def normalize_category(category: Any) -> str:
    value = clean_text(category)
    value = CATEGORY_MAP.get(value, value)
    if value in ALLOWED_CATEGORIES:
        return value
    return "Music Basics"


def stable_id(prefix: str, *parts: str) -> str:
    digest = hashlib.sha1("|".join(parts).encode("utf-8")).hexdigest()[:12]
    return f"{prefix}_{digest}"


def keywords_from_text(*values: str, extra: list[str] | None = None) -> list[str]:
    keywords: list[str] = []
    seen: set[str] = set()

    def add(keyword: str) -> None:
        keyword = clean_text(keyword).strip(".,:;()[]{}\"'")
        if not keyword:
            return
        key = keyword.casefold()
        if key not in seen and len(keyword) <= 40:
            seen.add(key)
            keywords.append(keyword)

    for keyword in extra or []:
        add(keyword)

    important = [
        "FL Studio",
        "Piano Roll",
        "Channel Rack",
        "Playlist",
        "Mixer",
        "EQ",
        "compression",
        "compressor",
        "reverb",
        "delay",
        "limiter",
        "mastering",
        "MIDI",
        "BPM",
        "kick",
        "snare",
        "hi-hat",
        "harmony",
        "melody",
        "chord",
        "scale",
        "interval",
        "rhythm",
        "хэмнэл",
        "аккорд",
        "гамм",
        "ая",
        "микс",
        "мастеринг",
    ]
    haystack = " ".join(values).casefold()
    for term in important:
        if term.casefold() in haystack:
            add(term)

    for token in TOKEN_RE.findall(" ".join(values)):
        if len(keywords) >= 12:
            break
        if len(token) >= 4 and not token.replace(".", "", 1).isdigit():
            add(token)

    return keywords[:12]


def title_terms(title: str) -> list[str]:
    terms: list[str] = []
    for token in TOKEN_RE.findall(title.casefold()):
        token = token.strip(".-")
        if len(token) < 4 or token in STOPWORDS or token.isdigit():
            continue
        if token.endswith("s") and len(token) > 5:
            token = token[:-1]
        terms.append(token)
    return terms


def content_matches_title(title: str, content: str) -> bool:
    terms = title_terms(title)
    if not terms:
        return True

    haystack = content.casefold()
    matches = 0
    for term in terms:
        equivalents = TERM_EQUIVALENTS.get(term, [term])
        if any(equivalent.casefold() in haystack for equivalent in equivalents):
            matches += 1

    return matches >= 1


def build_rag_text(record: dict[str, Any]) -> str:
    keywords = ", ".join(record["keywords"])
    return (
        f"Асуулт: {record['question']}\n"
        f"Гарчиг: {record['title']}\n"
        f"Ангилал: {record['category']}\n"
        f"Түвшин: {record['level']}\n"
        f"Хариулт: {record['content']}\n"
        f"Түлхүүр үг: {keywords}"
    )


def source_label(record: dict[str, Any]) -> str:
    if record.get("source_url"):
        return str(record["source_url"])
    if record.get("source_reference"):
        return str(record["source_reference"])
    return str(record.get("source_name") or "internal_generated_dataset")


def make_record(
    *,
    prefix: str,
    title: str,
    question: str,
    category: str,
    content: str,
    keywords: list[str],
    source_name: str,
    source_type: str,
    source_url: str = "",
    source_reference: str = "",
    license_name: str = "",
    source_grounded: bool = False,
    citation_safe: bool = False,
    quality_tier: str = "curated",
    original_category: str = "",
) -> dict[str, Any] | None:
    title = clean_text(title)
    question = clean_text(question)
    content = clean_content(content)
    category = normalize_category(category)
    if not title or not question or not content:
        return None
    if word_count(content) < 18:
        return None
    if not has_mongolian(content) or has_mojibake(content):
        return None
    if any(phrase in content for phrase in NOISE_PHRASES):
        return None

    record = {
        "id": stable_id(prefix, title, question, content),
        "language": "mn",
        "title": title,
        "question": question,
        "category": category,
        "level": "Beginner",
        "content": content,
        "keywords": keywords[:12],
        "source_name": source_name,
        "source_url": clean_text(source_url),
        "source_reference": clean_text(source_reference),
        "source_type": source_type,
        "license": clean_text(license_name),
        "source_grounded": bool(source_grounded),
        "citation_safe": bool(citation_safe),
        "quality_tier": quality_tier,
        "original_category": clean_text(original_category or category),
    }
    record["rag_text"] = build_rag_text(record)
    record["source"] = source_label(record)
    return record


def from_existing_rag(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for item in load_jsonl(path):
        title = clean_text(item.get("title"))
        content = clean_content(item.get("content"))
        keywords = item.get("keywords") if isinstance(item.get("keywords"), list) else []
        record = make_record(
            prefix="ref",
            title=title,
            question=f"{title} гэж юу вэ?",
            category=clean_text(item.get("category")),
            content=content,
            keywords=keywords_from_text(title, content, extra=[str(k) for k in keywords]),
            source_name=clean_text(item.get("source_url")) or "Reference source",
            source_url=clean_text(item.get("source_url")),
            source_type=clean_text(item.get("source_type")) or "rewritten_from_reference",
            source_grounded=True,
            citation_safe=True,
            quality_tier="source_grounded",
        )
        if record:
            records.append(record)
    return records


def from_open_music_theory(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    seen_content: set[str] = set()
    for item in load_jsonl(path):
        title = clean_text(item.get("title_mn") or item.get("title_en"))
        content = clean_content(item.get("content_mn"))
        if not content_matches_title(title, content):
            continue
        content_key = normalize_key(content)
        if content_key in seen_content:
            continue
        seen_content.add(content_key)

        source = item.get("source") if isinstance(item.get("source"), dict) else {}
        source_ref_parts = [OMT_SOURCE_NAME]
        if source.get("page"):
            source_ref_parts.append(f"page {source['page']}")
        source_reference = ", ".join(source_ref_parts)

        keywords = item.get("keywords") if isinstance(item.get("keywords"), list) else []
        record = make_record(
            prefix="omt",
            title=title,
            question=f"{title} гэж юу вэ?",
            category=normalize_category(item.get("category")),
            content=content,
            keywords=keywords_from_text(title, content, extra=[str(k) for k in keywords]),
            source_name=OMT_SOURCE_NAME,
            source_url=OMT_SOURCE_URL,
            source_reference=source_reference,
            source_type="rewritten_from_reference",
            license_name=clean_text(source.get("license")) or "CC BY-SA 4.0",
            source_grounded=True,
            citation_safe=True,
            quality_tier="source_grounded",
            original_category=clean_text(item.get("category")),
        )
        if record:
            records.append(record)
    return records


def from_fl_tips(path: Path, per_category: int) -> list[dict[str, Any]]:
    data = load_json(path)
    records: list[dict[str, Any]] = []
    counts: defaultdict[str, int] = defaultdict(int)
    seen_problem: set[str] = set()
    seen_answer: set[str] = set()

    for item in data:
        original_category = clean_text(item.get("category"))
        category = normalize_category(original_category)
        if counts[original_category] >= per_category:
            continue

        problem = clean_text(item.get("problem"))
        solution = clean_content(item.get("solution"))
        if not problem or not solution:
            continue
        if normalize_key(problem) in seen_problem or normalize_key(solution) in seen_answer:
            continue
        if word_count(solution) < 20 or not has_mongolian(solution):
            continue

        seen_problem.add(normalize_key(problem))
        seen_answer.add(normalize_key(solution))
        title = f"{category}: {problem[:72].rstrip()}"
        keywords = keywords_from_text(
            problem,
            solution,
            extra=[original_category, clean_text(item.get("acoustic_keyword"))],
        )
        record = make_record(
            prefix="tip",
            title=title,
            question=problem,
            category=category,
            content=solution,
            keywords=keywords,
            source_name="Local generated FL Studio troubleshooting dataset",
            source_type="generated_internal_tip",
            source_grounded=False,
            citation_safe=False,
            quality_tier="curated_synthetic_tip",
            original_category=original_category,
        )
        if record:
            records.append(record)
            counts[original_category] += 1
    return records


def from_compression(path: Path, per_category: int) -> list[dict[str, Any]]:
    data = load_json(path)
    records: list[dict[str, Any]] = []
    counts: defaultdict[str, int] = defaultdict(int)
    seen_problem: set[str] = set()

    for item in data:
        original_category = clean_text(item.get("category"))
        if counts[original_category] >= per_category:
            continue
        problem = clean_text(item.get("problem"))
        solution = clean_content(item.get("solution"))
        if normalize_key(problem) in seen_problem:
            continue
        if word_count(solution) < 35 or not has_mongolian(solution):
            continue
        seen_problem.add(normalize_key(problem))
        title = f"Mixing: {problem[:72].rstrip()}"
        keywords = keywords_from_text(
            problem,
            solution,
            extra=[original_category, clean_text(item.get("acoustic_keyword"))],
        )
        record = make_record(
            prefix="dyn",
            title=title,
            question=problem,
            category="Mixing",
            content=solution,
            keywords=keywords,
            source_name="Local generated compression and dynamics dataset",
            source_type="generated_internal_tip",
            source_grounded=False,
            citation_safe=False,
            quality_tier="advanced_synthetic_tip",
            original_category=original_category,
        )
        if record:
            records.append(record)
            counts[original_category] += 1
    return records


def dedupe_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen_ids: set[str] = set()
    seen_questions: set[str] = set()
    seen_content: set[str] = set()
    deduped: list[dict[str, Any]] = []

    for record in records:
        question_key = normalize_key(record["question"])
        content_key = normalize_key(record["content"])
        if record["id"] in seen_ids:
            continue
        if question_key in seen_questions and not record["source_grounded"]:
            continue
        if content_key in seen_content:
            continue
        seen_ids.add(record["id"])
        seen_questions.add(question_key)
        seen_content.add(content_key)
        deduped.append(record)
    return deduped


def write_jsonl(records: list[dict[str, Any]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as file:
        for record in records:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")


def write_csv(records: list[dict[str, Any]], path: Path) -> None:
    fieldnames = [
        "id",
        "language",
        "title",
        "question",
        "category",
        "level",
        "content",
        "keywords",
        "source_name",
        "source_url",
        "source_reference",
        "source_type",
        "license",
        "source_grounded",
        "citation_safe",
        "quality_tier",
        "original_category",
        "rag_text",
        "source",
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for record in records:
            row = dict(record)
            row["keywords"] = ", ".join(record["keywords"])
            writer.writerow(row)


def write_supabase_csv(records: list[dict[str, Any]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=["category", "question", "answer", "source"])
        writer.writeheader()
        for record in records:
            writer.writerow(
                {
                    "category": record["category"],
                    "question": record["question"],
                    "answer": record["content"],
                    "source": record["source"],
                }
            )


def write_report(records: list[dict[str, Any]], path: Path) -> None:
    category_counts = Counter(record["category"] for record in records)
    tier_counts = Counter(record["quality_tier"] for record in records)
    source_type_counts = Counter(record["source_type"] for record in records)
    grounded_count = sum(1 for record in records if record["source_grounded"])
    citation_count = sum(1 for record in records if record["citation_safe"])
    word_counts = [word_count(record["content"]) for record in records]

    lines = [
        "# Ready RAG Dataset Report",
        "",
        f"Total records: {len(records)}",
        f"Source-grounded records: {grounded_count}",
        f"Citation-safe records: {citation_count}",
        f"Synthetic/internal guidance records: {len(records) - grounded_count}",
        f"Content word count range: {min(word_counts)}-{max(word_counts)}",
        f"Average content word count: {sum(word_counts) / len(word_counts):.1f}",
        "",
        "## Categories",
    ]
    lines.extend(f"- {category}: {count}" for category, count in category_counts.most_common())
    lines.extend(["", "## Quality Tiers"])
    lines.extend(f"- {tier}: {count}" for tier, count in tier_counts.most_common())
    lines.extend(["", "## Source Types"])
    lines.extend(f"- {source_type}: {count}" for source_type, count in source_type_counts.most_common())
    lines.extend(
        [
            "",
            "## Files",
            "- rag_ready_mn.jsonl: normalized JSONL for embedding pipelines",
            "- rag_ready_mn.csv: human-readable inspection copy",
            "- supabase_knowledge_base_seed.csv: import shape for Frontend/supabase-schema.sql knowledge_base",
            "",
            "## Usage Notes",
            "- Embed the `rag_text` field for best retrieval.",
            "- Use `citation_safe=true` entries when the chatbot needs to cite sources.",
            "- Entries with `source_type=generated_internal_tip` are useful guidance, but should not be presented as manual citations.",
        ]
    )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build cleaned RAG-ready dataset files.")
    parser.add_argument("--tips-per-category", type=int, default=500)
    parser.add_argument("--compression-per-category", type=int, default=150)
    parser.add_argument(
        "--include-open-music-theory",
        action="store_true",
        help=(
            "Include music_theory_rag_final_mn.jsonl. It is excluded by default "
            "because the current generated file contains title/content mismatches."
        ),
    )
    parser.add_argument("--output-dir", type=Path, default=READY_DIR)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    output_dir = args.output_dir

    records: list[dict[str, Any]] = []
    records.extend(from_existing_rag(PROJECT / "data" / "rag_dataset_mn.jsonl"))
    if args.include_open_music_theory:
        records.extend(from_open_music_theory(PROJECT / "music_theory_rag_final_mn.jsonl"))
    records.extend(
        from_fl_tips(
            ROOT / "dataset" / "fl_studio_tips_final_rewritten_mn_unique.json",
            args.tips_per_category,
        )
    )
    records.extend(
        from_compression(
            ROOT / "compression_dynamics_mn_20000.json",
            args.compression_per_category,
        )
    )

    records = dedupe_records(records)
    records.sort(key=lambda item: (item["category"], item["quality_tier"], item["title"]))

    write_jsonl(records, output_dir / "rag_ready_mn.jsonl")
    write_csv(records, output_dir / "rag_ready_mn.csv")
    write_supabase_csv(records, output_dir / "supabase_knowledge_base_seed.csv")
    write_report(records, output_dir / "rag_ready_mn_report.md")

    print(f"Built {len(records)} ready RAG records in {output_dir}")
    print("Wrote rag_ready_mn.jsonl, rag_ready_mn.csv, supabase_knowledge_base_seed.csv, rag_ready_mn_report.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
