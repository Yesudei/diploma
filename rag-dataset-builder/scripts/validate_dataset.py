"""
Validate the generated Mongolian RAG dataset.
"""

from __future__ import annotations

import argparse
import json
import sys
from difflib import SequenceMatcher
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


def count_words(text: str) -> int:
    return len([word for word in str(text).split() if word.strip()])


def has_valid_url(value: str) -> bool:
    parsed = urlparse(str(value))
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def validate_record(record: dict) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    line = record.get("_line_number", "?")

    if "_json_error" in record:
        return [f"Line {line}: invalid JSON: {record['_json_error']}"], warnings

    content = str(record.get("content", "")).strip()
    if not content:
        errors.append(f"Line {line}: content must not be empty.")
    else:
        word_count = count_words(content)
        if word_count < 80 or word_count > 150:
            errors.append(
                f"Line {line}: content should be 80-150 words, found {word_count}."
            )

    source_url = str(record.get("source_url", "")).strip()
    if not source_url:
        errors.append(f"Line {line}: source_url must exist.")
    elif not has_valid_url(source_url):
        errors.append(f"Line {line}: source_url is not a valid HTTP(S) URL.")

    category = record.get("category")
    if category not in ALLOWED_CATEGORIES:
        errors.append(f"Line {line}: invalid category '{category}'.")

    if record.get("level") != "Beginner":
        errors.append(f"Line {line}: level must be 'Beginner'.")

    keywords = record.get("keywords", [])
    if not isinstance(keywords, list) or not keywords:
        warnings.append(f"Line {line}: keywords should be a non-empty list.")

    if record.get("source_type") != "rewritten_from_reference":
        warnings.append(
            f"Line {line}: source_type is expected to be 'rewritten_from_reference'."
        )

    return errors, warnings


def duplicate_checks(records: list[dict]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    seen_ids: dict[str, int] = {}
    seen_titles: dict[str, int] = {}
    seen_urls: dict[str, int] = {}

    for record in records:
        line = record.get("_line_number", "?")

        record_id = str(record.get("id", "")).strip()
        if record_id:
            if record_id in seen_ids:
                errors.append(
                    f"Line {line}: duplicate id also appears on line {seen_ids[record_id]}."
                )
            seen_ids[record_id] = line

        title = str(record.get("title", "")).strip().casefold()
        if title:
            if title in seen_titles:
                errors.append(
                    f"Line {line}: duplicate title also appears on line {seen_titles[title]}."
                )
            seen_titles[title] = line

        url = str(record.get("source_url", "")).strip()
        if url:
            if url in seen_urls:
                warnings.append(
                    f"Line {line}: duplicate source_url also appears on line {seen_urls[url]}."
                )
            seen_urls[url] = line

    return errors, warnings


def similarity_warnings(records: list[dict], threshold: float) -> list[str]:
    warnings: list[str] = []

    for index, left in enumerate(records):
        left_content = str(left.get("content", ""))
        if not left_content:
            continue

        for right in records[index + 1 :]:
            right_content = str(right.get("content", ""))
            if not right_content:
                continue

            score = SequenceMatcher(None, left_content, right_content).ratio()
            if score >= threshold:
                warnings.append(
                    "Lines "
                    f"{left.get('_line_number', '?')} and {right.get('_line_number', '?')}: "
                    f"content similarity is high ({score:.2f})."
                )

    return warnings


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate generated RAG JSONL dataset.")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("data/rag_dataset_mn.jsonl"),
        help="Generated RAG dataset JSONL path.",
    )
    parser.add_argument(
        "--similarity-threshold",
        type=float,
        default=0.88,
        help="Warn when content similarity is at or above this ratio.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    records = load_jsonl(args.input)

    if not records:
        print("Dataset is empty.", file=sys.stderr)
        return 1

    all_errors: list[str] = []
    all_warnings: list[str] = []

    for record in records:
        errors, warnings = validate_record(record)
        all_errors.extend(errors)
        all_warnings.extend(warnings)

    duplicate_errors, duplicate_warnings = duplicate_checks(records)
    all_errors.extend(duplicate_errors)
    all_warnings.extend(duplicate_warnings)
    all_warnings.extend(similarity_warnings(records, args.similarity_threshold))

    for warning in all_warnings:
        print(f"Warning: {warning}", file=sys.stderr)

    for error in all_errors:
        print(f"Error: {error}", file=sys.stderr)

    print(
        f"Validated {len(records)} records: "
        f"{len(all_errors)} error(s), {len(all_warnings)} warning(s)."
    )

    return 1 if all_errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
