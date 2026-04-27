"""
Validate the normalized ready-to-use RAG dataset.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse


ALLOWED_CATEGORIES = {
    "FL Studio Basics",
    "Music Basics",
    "Beat Making",
    "Music Theory",
    "Mixing",
    "Mastering",
    "Common Problems",
}

REQUIRED_FIELDS = {
    "id",
    "language",
    "title",
    "question",
    "category",
    "level",
    "content",
    "keywords",
    "source_name",
    "source_type",
    "source_grounded",
    "citation_safe",
    "quality_tier",
    "rag_text",
}

TOKEN_RE = re.compile(r"[A-Za-zА-Яа-яӨөҮүЁё0-9+#.-]+", re.UNICODE)
MONGOLIAN_RE = re.compile(r"[А-Яа-яӨөҮүЁё]")
MOJIBAKE_MARKERS = ("Ð", "Ñ", "Â", "Ã")


def load_jsonl(path: Path) -> list[dict]:
    records: list[dict] = []
    with path.open("r", encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            if not line.strip():
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError as exc:
                records.append({"_line_number": line_number, "_json_error": str(exc)})
                continue
            record["_line_number"] = line_number
            records.append(record)
    return records


def word_count(value: str) -> int:
    return len(TOKEN_RE.findall(str(value)))


def valid_http_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def validate_record(record: dict) -> tuple[list[str], list[str]]:
    line = record.get("_line_number", "?")
    errors: list[str] = []
    warnings: list[str] = []

    if "_json_error" in record:
        return [f"Line {line}: invalid JSON: {record['_json_error']}"], warnings

    missing = sorted(field for field in REQUIRED_FIELDS if field not in record)
    if missing:
        errors.append(f"Line {line}: missing required fields: {', '.join(missing)}")

    if record.get("language") != "mn":
        errors.append(f"Line {line}: language must be mn.")
    if record.get("level") != "Beginner":
        errors.append(f"Line {line}: level must be Beginner.")
    if record.get("category") not in ALLOWED_CATEGORIES:
        errors.append(f"Line {line}: invalid category {record.get('category')!r}.")

    content = str(record.get("content", "")).strip()
    if not content:
        errors.append(f"Line {line}: content is empty.")
    else:
        words = word_count(content)
        if words < 18:
            errors.append(f"Line {line}: content is too short ({words} words).")
        if not MONGOLIAN_RE.search(content):
            errors.append(f"Line {line}: content does not appear to contain Mongolian Cyrillic.")
        if any(marker in content for marker in MOJIBAKE_MARKERS):
            errors.append(f"Line {line}: content looks mojibake-corrupted.")
        if "RAG чатботод" in content or "context болж ашиглагдана" in content:
            errors.append(f"Line {line}: content contains dataset-building meta text.")

    keywords = record.get("keywords")
    if not isinstance(keywords, list) or not keywords:
        warnings.append(f"Line {line}: keywords should be a non-empty list.")

    source_grounded = record.get("source_grounded")
    citation_safe = record.get("citation_safe")
    source_url = str(record.get("source_url", "")).strip()
    if source_grounded and not valid_http_url(source_url):
        errors.append(f"Line {line}: source_grounded records need a valid source_url.")
    if citation_safe and not source_grounded:
        errors.append(f"Line {line}: citation_safe cannot be true when source_grounded is false.")
    if not source_grounded and source_url and not valid_http_url(source_url):
        warnings.append(f"Line {line}: non-grounded source_url is not HTTP(S).")

    rag_text = str(record.get("rag_text", ""))
    if content and content not in rag_text:
        warnings.append(f"Line {line}: rag_text does not include content.")

    return errors, warnings


def duplicate_checks(records: list[dict]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    ids: dict[str, int] = {}
    questions: dict[str, int] = {}
    contents: dict[str, int] = {}

    for record in records:
        line = record.get("_line_number", "?")
        if "_json_error" in record:
            continue

        record_id = str(record.get("id", "")).strip()
        question = str(record.get("question", "")).casefold().strip()
        content = str(record.get("content", "")).casefold().strip()

        if record_id:
            if record_id in ids:
                errors.append(f"Line {line}: duplicate id also appears on line {ids[record_id]}.")
            ids[record_id] = line
        if question:
            if question in questions:
                warnings.append(
                    f"Line {line}: duplicate question also appears on line {questions[question]}."
                )
            questions[question] = line
        if content:
            if content in contents:
                errors.append(f"Line {line}: duplicate content also appears on line {contents[content]}.")
            contents[content] = line

    return errors, warnings


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate ready RAG JSONL dataset.")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("data/ready/rag_ready_mn.jsonl"),
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    records = load_jsonl(args.input)
    if not records:
        print("Dataset is empty.", file=sys.stderr)
        return 1

    errors: list[str] = []
    warnings: list[str] = []
    for record in records:
        record_errors, record_warnings = validate_record(record)
        errors.extend(record_errors)
        warnings.extend(record_warnings)

    duplicate_errors, duplicate_warnings = duplicate_checks(records)
    errors.extend(duplicate_errors)
    warnings.extend(duplicate_warnings)

    category_counts = Counter(record.get("category") for record in records if "_json_error" not in record)
    tier_counts = Counter(record.get("quality_tier") for record in records if "_json_error" not in record)

    for warning in warnings[:50]:
        print(f"Warning: {warning}", file=sys.stderr)
    if len(warnings) > 50:
        print(f"Warning: suppressed {len(warnings) - 50} additional warning(s).", file=sys.stderr)

    for error in errors:
        print(f"Error: {error}", file=sys.stderr)

    print(f"Validated {len(records)} records: {len(errors)} error(s), {len(warnings)} warning(s).")
    print("Categories:", dict(category_counts))
    print("Quality tiers:", dict(tier_counts))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
