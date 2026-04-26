"""
Generate beginner-friendly Mongolian RAG dataset entries from raw topic metadata.

AI generation is optional:
- AI_PROVIDER=none   -> use the local placeholder generator
- AI_PROVIDER=gemini -> call the Gemini REST API
- AI_PROVIDER=openai -> call the OpenAI Responses API
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import sys
import time
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import pandas as pd
import requests
from dotenv import load_dotenv


ALLOWED_CATEGORIES = {
    "FL Studio Basics",
    "Music Basics",
    "Beat Making",
    "Music Theory",
    "Mixing",
    "Mastering",
    "Common Problems",
}

REQUIRED_AI_FIELDS = [
    "title",
    "category",
    "level",
    "content",
    "keywords",
    "source_url",
    "source_type",
]

ENTRY_JSON_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "title": {"type": "string"},
        "category": {
            "type": "string",
            "enum": sorted(ALLOWED_CATEGORIES),
        },
        "level": {"type": "string", "enum": ["Beginner"]},
        "content": {"type": "string"},
        "keywords": {
            "type": "array",
            "items": {"type": "string"},
        },
        "source_url": {"type": "string"},
        "source_type": {
            "type": "string",
            "enum": ["rewritten_from_reference"],
        },
    },
    "required": REQUIRED_AI_FIELDS,
}

CATEGORY_KEYWORDS = {
    "Common Problems": [
        "problem",
        "troubleshoot",
        "error",
        "latency",
        "crash",
        "no sound",
        "not working",
        "export problem",
    ],
    "Mastering": ["master", "mastering", "limiter", "loudness", "final mix"],
    "Mixing": [
        "mix",
        "mixer",
        "mixing",
        "eq",
        "equalizer",
        "compression",
        "compressor",
        "reverb",
        "delay",
        "pan",
        "volume",
    ],
    "Beat Making": [
        "beat",
        "drum",
        "pattern",
        "rhythm",
        "kick",
        "snare",
        "hi-hat",
        "808",
        "step sequencer",
    ],
    "Music Theory": [
        "theory",
        "scale",
        "chord",
        "harmony",
        "melody",
        "interval",
        "key",
        "tempo",
        "notation",
    ],
    "FL Studio Basics": [
        "fl studio",
        "playlist",
        "piano roll",
        "channel rack",
        "browser",
        "workflow",
        "automation",
        "plugin",
    ],
}

KEYWORD_TRANSLATIONS = {
    "fl studio": "FL Studio",
    "workflow": "ажлын урсгал",
    "playlist": "Playlist",
    "piano roll": "Piano Roll",
    "channel rack": "Channel Rack",
    "browser": "Browser",
    "automation": "автоматжуулалт",
    "plugin": "плагин",
    "music": "хөгжим",
    "theory": "онол",
    "scale": "гамм",
    "chord": "аккорд",
    "harmony": "хармони",
    "melody": "ая",
    "tempo": "темп",
    "beat": "бийт",
    "drum": "бөмбөр",
    "pattern": "паттерн",
    "rhythm": "хэмнэл",
    "kick": "kick",
    "snare": "snare",
    "mix": "микс",
    "mixer": "миксер",
    "mixing": "микс хийх",
    "eq": "EQ",
    "compression": "компресс",
    "reverb": "reverb",
    "delay": "delay",
    "master": "мастер",
    "mastering": "мастеринг",
    "loudness": "чанга байдал",
    "latency": "саатал",
    "error": "алдаа",
}

CATEGORY_EXPLANATIONS = {
    "FL Studio Basics": (
        "FL Studio дээр цонх, хэрэгсэл, дууны сувгууд хоорондоо хэрхэн холбогддогийг "
        "ойлгох нь дараагийн бүх дасгалын суурь болдог."
    ),
    "Music Basics": (
        "Хөгжмийн үндсэн ойлголт нь сонсож байгаа зүйлээ нэрлэж, энгийн санааг "
        "эмх цэгцтэй бүтээл болгоход тусалдаг."
    ),
    "Beat Making": (
        "Бийт хийхдээ kick, snare, hi-hat, давталт, зай завсар зэрэг жижиг хэсгүүд "
        "хамтдаа хөдөлгөөн үүсгэдгийг анзаараарай."
    ),
    "Music Theory": (
        "Онолыг дүрэм цээжлэх гэж биш, аккорд, гамм, ая яагаад тодорхой мэдрэмж "
        "төрүүлдгийг тайлбарлах хэл гэж ойлговол амар."
    ),
    "Mixing": (
        "Микс хийх үед дуу бүрийн түвшин, байрлал, өнгө, зайг тааруулж, бүх элемент "
        "нэг дор цэвэр сонсогдохыг зорьдог."
    ),
    "Mastering": (
        "Мастеринг нь дууссан миксийг олон төхөөрөмж дээр тогтвортой, цэвэр, зохистой "
        "чанга сонсогдуулах эцсийн өнгөлгөө юм."
    ),
    "Common Problems": (
        "Асуудал гарвал бүх тохиргоог зэрэг өөрчлөхөөс илүү нэг шалтгааныг сонгоод "
        "туршиж, үр дүнг нь сонсох нь хамгийн хурдан арга."
    ),
}

AI_PROMPT_TEMPLATE = """Create one RAG dataset entry in Mongolian for a beginner music production chatbot.

Rules:
- Do not copy the source text.
- Write in original words.
- Explain simply for complete beginners.
- Keep content between 80 and 150 words.
- Use Mongolian for the content.
- Keep technical terms like BPM, MIDI, DAW, EQ, compressor, Piano Roll when useful.
- Output valid JSON only.
- Include fields:
  title, category, level, content, keywords, source_url, source_type

Source metadata:
{topic_metadata}

Allowed categories:
FL Studio Basics, Music Basics, Beat Making, Music Theory, Mixing, Mastering, Common Problems

level must be Beginner.
source_type must be rewritten_from_reference.
"""


@dataclass
class AIConfig:
    provider: str
    gemini_api_key: str
    openai_api_key: str
    gemini_model: str
    openai_model: str
    max_retries: int
    request_timeout: int


class GenerationError(Exception):
    """Raised when an AI provider response cannot be used."""


def clean_text(text: str) -> str:
    return " ".join(str(text).split()).strip()


def load_jsonl(path: Path) -> list[dict]:
    records: list[dict] = []
    with path.open("r", encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            if not line.strip():
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError as exc:
                print(f"Warning: skipped invalid JSON on line {line_number}: {exc}", file=sys.stderr)
    return records


def write_jsonl(records: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        for record in records:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")


def normalize_url(url: str) -> str:
    parsed = urlparse(url.strip())
    if not parsed.scheme or not parsed.netloc:
        return url.strip()
    normalized = parsed.geturl()
    if normalized.endswith("/") and parsed.path != "/":
        normalized = normalized.rstrip("/")
    return normalized


def dedupe_topics_by_url(topics: list[dict]) -> list[dict]:
    unique_topics: list[dict] = []
    seen_urls: set[str] = set()

    for topic in topics:
        url = normalize_url(topic.get("source_url", ""))
        if not url:
            print("Warning: skipped topic without source_url.", file=sys.stderr)
            continue

        if url in seen_urls:
            print(f"Warning: duplicate raw topic URL removed: {url}", file=sys.stderr)
            continue

        topic["source_url"] = url
        seen_urls.add(url)
        unique_topics.append(topic)

    return unique_topics


def topic_text(topic: dict) -> str:
    heading_text = " ".join(
        clean_text(heading.get("text", ""))
        for heading in topic.get("headings", [])
        if isinstance(heading, dict)
    )
    snippet_text = " ".join(clean_text(item) for item in topic.get("snippets", []))
    return clean_text(f"{topic.get('page_title', '')} {heading_text} {snippet_text}").lower()


def keyword_in_text(keyword: str, text: str) -> bool:
    """Match keywords as words/phrases, so 'mix' does not match unrelated words."""
    escaped = re.escape(keyword.lower())
    pattern = rf"(?<![a-z0-9]){escaped}(?![a-z0-9])"
    return re.search(pattern, text) is not None


def classify_category(topic: dict) -> str:
    full_text = topic_text(topic)
    title_text = clean_text(topic.get("page_title", "")).lower()

    scores: dict[str, int] = {category: 0 for category in ALLOWED_CATEGORIES}

    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword_in_text(keyword, title_text):
                scores[category] += 3
            elif keyword_in_text(keyword, full_text):
                scores[category] += 1

    best_category, best_score = max(scores.items(), key=lambda item: item[1])
    if best_score > 0:
        return best_category

    return "Music Basics"


def source_title(topic: dict) -> str:
    title = clean_text(topic.get("page_title") or "")
    if title:
        return title

    for heading in topic.get("headings", []):
        heading_text = clean_text(heading.get("text", ""))
        if heading_text:
            return heading_text

    return "Music production topic"


def beginner_title(topic: dict, category: str) -> str:
    raw_title = source_title(topic)
    raw_title = re.sub(r"\s*[-|]\s*FL Studio.*$", "", raw_title, flags=re.IGNORECASE)
    raw_title = re.sub(r"\s*[-|]\s*Image-Line.*$", "", raw_title, flags=re.IGNORECASE)
    raw_title = clean_text(raw_title)

    if category == "FL Studio Basics":
        return f"FL Studio эхлэгчдэд: {raw_title}"
    if category == "Music Theory":
        return f"Хөгжмийн онолын эхлэл: {raw_title}"
    if category == "Beat Making":
        return f"Бийт хийх эхний алхам: {raw_title}"
    if category == "Mixing":
        return f"Микс хийх үндэс: {raw_title}"
    if category == "Mastering":
        return f"Мастерингийн үндэс: {raw_title}"
    if category == "Common Problems":
        return f"Эхлэгчдийн асуудал: {raw_title}"
    return f"Хөгжмийн үндэс: {raw_title}"


def make_id(title: str, source_url: str) -> str:
    digest = hashlib.sha1(f"{title}|{source_url}".encode("utf-8")).hexdigest()[:10]
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    if not slug:
        slug = "music-topic"
    return f"{slug[:40]}-{digest}"


def choose_keywords(topic: dict, category: str) -> list[str]:
    text = topic_text(topic)
    keywords: list[str] = []

    def add_keyword(value: str) -> None:
        if value and value not in keywords:
            keywords.append(value)

    for keyword, translation in KEYWORD_TRANSLATIONS.items():
        if keyword_in_text(keyword, text):
            add_keyword(keyword)
            add_keyword(translation)

    category_words = {
        "FL Studio Basics": ["FL Studio", "эхлэгч"],
        "Music Basics": ["music production", "хөгжмийн үндэс"],
        "Beat Making": ["beat making", "бийт хийх"],
        "Music Theory": ["music theory", "хөгжмийн онол"],
        "Mixing": ["mixing", "микс хийх"],
        "Mastering": ["mastering", "мастеринг"],
        "Common Problems": ["troubleshooting", "асуудал шийдэх"],
    }

    for value in category_words[category]:
        add_keyword(value)

    return keywords[:10]


def count_words(text: str) -> int:
    return len([word for word in str(text).split() if word.strip()])


def generate_content(title: str, category: str) -> str:
    """Build an original Mongolian placeholder explanation from metadata only."""
    category_sentence = CATEGORY_EXPLANATIONS[category]
    content = (
        f"'{title}' сэдэв нь хөгжмийн продакшн шинээр сурч байгаа хүнд анхны ойлголтоо "
        f"цэгцлэхэд тусална. {category_sentence} Эхлээд нэр томьёог төгс цээжлэх гэж "
        f"яарах хэрэггүй. Нэг жижиг зорилго сонгоод туршаарай: хоёр такт хэмнэл хийх, "
        f"нэг аккорд тоглуулах, эсвэл дууны түвшинг бага зэрэг өөрчлөх гэх мэт. Дараа нь "
        f"үр дүнг сонсож, юу өөрчлөгдсөнийг өөрийн үгээр тэмдэглэ. Ийм маягаар алхам "
        f"бүрийг сонсголтой холбовол програмын товчлуур, хөгжмийн ойлголт хоёр бодит "
        f"дуу болж нийлж байгааг амархан ойлгоно."
    )

    if count_words(content) < 80:
        content += (
            " Дасгалаа хадгалаад маргааш дахин сонсвол ахиц, алдаа хоёроо илүү тайван "
            "ялгаж сурна."
        )

    return content


def generate_placeholder_entry(topic: dict) -> dict:
    """Create one local template RAG dataset entry from one extracted topic."""
    category = classify_category(topic)
    title = beginner_title(topic, category)
    source_url = topic["source_url"]

    return {
        "id": make_id(title, source_url),
        "title": title,
        "category": category,
        "level": "Beginner",
        "content": generate_content(title, category),
        "keywords": choose_keywords(topic, category),
        "source_url": source_url,
        "source_type": "rewritten_from_reference",
    }


def safe_topic_metadata(topic: dict) -> dict:
    """Keep the prompt limited to metadata and short snippets, not full source text."""
    headings = []
    for heading in topic.get("headings", []):
        if isinstance(heading, dict):
            headings.append(
                {
                    "level": clean_text(heading.get("level", "")),
                    "text": clean_text(heading.get("text", "")),
                }
            )

    return {
        "source_url": topic.get("source_url", ""),
        "page_title": clean_text(topic.get("page_title", "")),
        "headings": headings[:40],
        "short_snippets": [clean_text(snippet)[:260] for snippet in topic.get("snippets", [])[:3]],
    }


def build_generation_prompt(topic: dict) -> str:
    topic_metadata = json.dumps(safe_topic_metadata(topic), ensure_ascii=False, indent=2)
    return AI_PROMPT_TEMPLATE.format(topic_metadata=topic_metadata)


def load_ai_config() -> AIConfig:
    load_dotenv()
    provider = os.getenv("AI_PROVIDER", "none").strip().lower()

    return AIConfig(
        provider=provider,
        gemini_api_key=os.getenv("GEMINI_API_KEY", "").strip(),
        openai_api_key=os.getenv("OPENAI_API_KEY", "").strip(),
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip(),
        openai_model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini").strip(),
        max_retries=max(1, int(os.getenv("AI_MAX_RETRIES", "3"))),
        request_timeout=max(5, int(os.getenv("AI_REQUEST_TIMEOUT", "60"))),
    )


def validate_ai_config(config: AIConfig) -> list[str]:
    errors: list[str] = []

    if config.provider not in {"none", "gemini", "openai"}:
        errors.append("AI_PROVIDER must be one of: none, gemini, openai.")

    if config.provider == "gemini" and not config.gemini_api_key:
        errors.append("GEMINI_API_KEY is required when AI_PROVIDER=gemini.")

    if config.provider == "openai" and not config.openai_api_key:
        errors.append("OPENAI_API_KEY is required when AI_PROVIDER=openai.")

    return errors


def parse_json_object(text: str) -> dict:
    """Parse strict JSON, with a small cleanup for accidental code fences."""
    cleaned = clean_text(text)
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        parsed = json.loads(cleaned[start : end + 1])

    if not isinstance(parsed, dict):
        raise GenerationError("AI output JSON must be an object.")

    return parsed


def validate_generated_entry(entry: dict, expected_source_url: str) -> list[str]:
    errors: list[str] = []

    for field in REQUIRED_AI_FIELDS:
        if field not in entry:
            errors.append(f"missing field: {field}")

    if errors:
        return errors

    title = clean_text(entry.get("title", ""))
    if not title:
        errors.append("title must not be empty")

    category = entry.get("category")
    if category not in ALLOWED_CATEGORIES:
        errors.append(f"category must be one of {sorted(ALLOWED_CATEGORIES)}")

    if entry.get("level") != "Beginner":
        errors.append("level must be Beginner")

    content = clean_text(entry.get("content", ""))
    if not content:
        errors.append("content must not be empty")
    else:
        word_count = count_words(content)
        if word_count < 80 or word_count > 150:
            errors.append(f"content must be 80-150 words, found {word_count}")

    keywords = entry.get("keywords")
    if not isinstance(keywords, list) or not keywords:
        errors.append("keywords must be a non-empty list")
    elif not all(isinstance(keyword, str) and clean_text(keyword) for keyword in keywords):
        errors.append("keywords must contain only non-empty strings")

    source_url = normalize_url(str(entry.get("source_url", "")))
    if source_url != expected_source_url:
        errors.append("source_url must match the original topic source_url")

    if entry.get("source_type") != "rewritten_from_reference":
        errors.append("source_type must be rewritten_from_reference")

    return errors


def normalize_ai_entry(entry: dict, source_url: str) -> dict:
    """Trim AI output and add the local unique id."""
    normalized = {
        "title": clean_text(entry.get("title", "")),
        "category": clean_text(entry.get("category", "")),
        "level": clean_text(entry.get("level", "")),
        "content": clean_text(entry.get("content", "")),
        "keywords": [clean_text(keyword) for keyword in entry.get("keywords", [])],
        "source_url": normalize_url(str(entry.get("source_url", ""))),
        "source_type": clean_text(entry.get("source_type", "")),
    }
    normalized["id"] = make_id(normalized["title"], source_url)
    return normalized


def call_gemini(prompt: str, config: AIConfig) -> str:
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{config.gemini_model}:generateContent"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 900,
            "responseMimeType": "application/json",
            "responseJsonSchema": ENTRY_JSON_SCHEMA,
        },
    }
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": config.gemini_api_key,
    }

    response = requests.post(url, headers=headers, json=payload, timeout=config.request_timeout)
    if response.status_code >= 400:
        raise GenerationError(f"Gemini API error {response.status_code}: {response.text[:800]}")

    data = response.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError) as exc:
        raise GenerationError(f"Gemini response did not include JSON text: {data}") from exc


def call_openai(prompt: str, config: AIConfig) -> str:
    url = "https://api.openai.com/v1/responses"
    payload = {
        "model": config.openai_model,
        "input": [
            {
                "role": "user",
                "content": [{"type": "input_text", "text": prompt}],
            }
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "rag_dataset_entry",
                "strict": True,
                "schema": ENTRY_JSON_SCHEMA,
            }
        },
        "temperature": 0.2,
        "max_output_tokens": 900,
    }
    headers = {
        "Authorization": f"Bearer {config.openai_api_key}",
        "Content-Type": "application/json",
    }

    response = requests.post(url, headers=headers, json=payload, timeout=config.request_timeout)
    if response.status_code >= 400:
        raise GenerationError(f"OpenAI API error {response.status_code}: {response.text[:800]}")

    data = response.json()
    text = extract_openai_text(data)
    if not text:
        raise GenerationError(f"OpenAI response did not include output text: {data}")
    return text


def extract_openai_text(data: dict) -> str:
    if isinstance(data.get("output_text"), str):
        return data["output_text"]

    chunks: list[str] = []
    for item in data.get("output", []):
        if not isinstance(item, dict):
            continue
        for content in item.get("content", []):
            if not isinstance(content, dict):
                continue
            if content.get("type") in {"output_text", "text"} and isinstance(content.get("text"), str):
                chunks.append(content["text"])

    return "\n".join(chunks).strip()


def call_ai_provider(prompt: str, config: AIConfig) -> str:
    if config.provider == "gemini":
        return call_gemini(prompt, config)
    if config.provider == "openai":
        return call_openai(prompt, config)
    raise GenerationError(f"Unsupported AI provider: {config.provider}")


def generate_ai_entry(topic: dict, config: AIConfig) -> tuple[dict | None, dict | None]:
    prompt = build_generation_prompt(topic)
    source_url = normalize_url(topic["source_url"])
    last_error = ""
    last_response = ""

    for attempt in range(1, config.max_retries + 1):
        try:
            raw_text = call_ai_provider(prompt, config)
            last_response = raw_text
            parsed = parse_json_object(raw_text)
            validation_errors = validate_generated_entry(parsed, source_url)
            if validation_errors:
                raise GenerationError("; ".join(validation_errors))

            entry = normalize_ai_entry(parsed, source_url)
            return entry, None
        except (GenerationError, requests.RequestException, json.JSONDecodeError) as exc:
            last_error = str(exc)
            print(
                f"Warning: {config.provider} generation failed for {source_url} "
                f"(attempt {attempt}/{config.max_retries}): {last_error}",
                file=sys.stderr,
            )
            if attempt < config.max_retries:
                time.sleep(min(2 ** attempt, 8))

    failed_record = {
        "source_url": source_url,
        "page_title": topic.get("page_title", ""),
        "provider": config.provider,
        "error": last_error,
        "raw_response": last_response,
        "topic_metadata": safe_topic_metadata(topic),
    }
    return None, failed_record


def generate_mongolian_entry(topic: dict, config: AIConfig) -> tuple[dict | None, dict | None]:
    """Generate one entry using the configured provider."""
    if config.provider == "none":
        return generate_placeholder_entry(topic), None
    return generate_ai_entry(topic, config)


def remove_duplicate_titles(entries: list[dict]) -> list[dict]:
    unique_entries: list[dict] = []
    seen_titles: set[str] = set()

    for entry in entries:
        title_key = entry["title"].casefold()
        if title_key in seen_titles:
            print(f"Warning: duplicate generated title removed: {entry['title']}", file=sys.stderr)
            continue

        seen_titles.add(title_key)
        unique_entries.append(entry)

    return unique_entries


def warn_if_content_too_similar(entries: list[dict], threshold: float = 0.88) -> None:
    for index, left in enumerate(entries):
        for right in entries[index + 1 :]:
            score = SequenceMatcher(None, left["content"], right["content"]).ratio()
            if score >= threshold:
                print(
                    "Warning: generated content is very similar "
                    f"({score:.2f}) between '{left['title']}' and '{right['title']}'.",
                    file=sys.stderr,
                )


def save_csv(entries: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    dataframe = pd.DataFrame(entries)
    if not dataframe.empty:
        dataframe["keywords"] = dataframe["keywords"].apply(
            lambda values: ", ".join(values) if isinstance(values, list) else values
        )
    dataframe.to_csv(path, index=False, encoding="utf-8-sig", quoting=csv.QUOTE_MINIMAL)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate Mongolian beginner RAG entries from extracted metadata."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("data/raw_extracted_topics.jsonl"),
        help="Input raw extracted topics JSONL.",
    )
    parser.add_argument(
        "--jsonl-output",
        type=Path,
        default=Path("data/rag_dataset_mn.jsonl"),
        help="Output RAG dataset JSONL.",
    )
    parser.add_argument(
        "--csv-output",
        type=Path,
        default=Path("data/rag_dataset_mn.csv"),
        help="Output RAG dataset CSV.",
    )
    parser.add_argument(
        "--failed-output",
        type=Path,
        default=Path("data/failed_generation.jsonl"),
        help="Output JSONL path for AI topics that failed generation or validation.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    config = load_ai_config()
    config_errors = validate_ai_config(config)

    if config_errors:
        for error in config_errors:
            print(f"Error: {error}", file=sys.stderr)
        return 1

    print(f"Using AI_PROVIDER={config.provider}")

    topics = dedupe_topics_by_url(load_jsonl(args.input))
    if not topics:
        print("No topics found. Run scripts/extract_topics.py first.", file=sys.stderr)
        return 1

    entries: list[dict] = []
    failed_records: list[dict] = []

    for index, topic in enumerate(topics, start=1):
        print(f"[{index}/{len(topics)}] Generating entry for {topic['source_url']}")
        entry, failed_record = generate_mongolian_entry(topic, config)
        if entry:
            entries.append(entry)
        if failed_record:
            failed_records.append(failed_record)

    entries = remove_duplicate_titles(entries)
    warn_if_content_too_similar(entries)

    write_jsonl(entries, args.jsonl_output)
    save_csv(entries, args.csv_output)
    write_jsonl(failed_records, args.failed_output)

    print(f"Saved {len(entries)} RAG entries to {args.jsonl_output}")
    print(f"Saved CSV to {args.csv_output}")
    print(f"Saved {len(failed_records)} failed generation record(s) to {args.failed_output}")

    return 1 if failed_records else 0


if __name__ == "__main__":
    raise SystemExit(main())
