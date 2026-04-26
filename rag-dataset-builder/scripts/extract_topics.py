"""
Extract copyright-safe topic metadata from a list of source URLs.

This script intentionally stores only:
- source_url
- page_title
- h1/h2/h3 headings
- a few short snippets

It does not store full page text. The extracted metadata is meant to be used
as a reference for creating original RAG learning content.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable
from urllib.parse import urldefrag, urlparse

import requests
from bs4 import BeautifulSoup


DEFAULT_USER_AGENT = (
    "AI-Music-Mentor-RAG-Dataset-Builder/0.1 "
    "(educational metadata extraction; contact: student-project)"
)


def clean_text(text: str) -> str:
    """Collapse whitespace and trim a text value."""
    return " ".join(text.split()).strip()


def normalize_url(url: str) -> str:
    """Remove URL fragments and normalize simple trailing slash duplicates."""
    clean_url, _fragment = urldefrag(url.strip())
    if clean_url.endswith("/") and urlparse(clean_url).path != "/":
        clean_url = clean_url.rstrip("/")
    return clean_url


def read_source_urls(path: Path) -> list[str]:
    """Read URLs from a text file, removing comments and duplicates."""
    urls: list[str] = []
    seen: set[str] = set()

    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        url = normalize_url(stripped)
        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            print(f"Warning: skipped invalid URL: {stripped}", file=sys.stderr)
            continue

        if url in seen:
            print(f"Warning: duplicate URL removed: {url}", file=sys.stderr)
            continue

        seen.add(url)
        urls.append(url)

    return urls


def fetch_page(url: str, user_agent: str, timeout: int) -> str:
    """Fetch a page using a clear educational User-Agent."""
    headers = {
        "User-Agent": user_agent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,mn;q=0.8",
    }
    response = requests.get(url, headers=headers, timeout=timeout)
    response.raise_for_status()
    return response.text


def extract_page_title(soup: BeautifulSoup) -> str:
    """Prefer the first h1, then the HTML title."""
    h1 = soup.find("h1")
    if h1:
        title = clean_text(h1.get_text(" "))
        if title:
            return title

    if soup.title:
        return clean_text(soup.title.get_text(" "))

    return "Untitled source page"


def extract_headings(soup: BeautifulSoup, limit: int) -> list[dict[str, str]]:
    """Extract h1/h2/h3 headings only."""
    headings: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()

    for tag in soup.find_all(["h1", "h2", "h3"]):
        text = clean_text(tag.get_text(" "))
        if not text:
            continue

        item_key = (tag.name, text.lower())
        if item_key in seen:
            continue

        seen.add(item_key)
        headings.append({"level": tag.name, "text": text})

        if len(headings) >= limit:
            break

    return headings


def extract_short_snippets(
    soup: BeautifulSoup,
    max_snippets: int,
    max_chars: int,
) -> list[str]:
    """
    Extract a few short paragraph/list snippets.

    These snippets are only hints for topic generation. Keeping them short helps
    avoid storing copyrighted source pages in the dataset.
    """
    for unwanted in soup(
        ["script", "style", "noscript", "svg", "iframe", "form", "nav", "header", "footer"]
    ):
        unwanted.decompose()

    snippets: list[str] = []
    seen: set[str] = set()

    for tag in soup.find_all(["p", "li"]):
        text = clean_text(tag.get_text(" "))
        if len(text) < 40:
            continue

        short = text[:max_chars].rsplit(" ", 1)[0]
        if len(text) > len(short):
            short = f"{short}..."

        dedupe_key = short.lower()
        if dedupe_key in seen:
            continue

        seen.add(dedupe_key)
        snippets.append(short)

        if len(snippets) >= max_snippets:
            break

    return snippets


def extract_topic(url: str, html: str) -> dict:
    """Create one raw topic metadata record from a fetched HTML page."""
    soup = BeautifulSoup(html, "html.parser")

    return {
        "source_url": url,
        "page_title": extract_page_title(soup),
        "headings": extract_headings(soup, limit=40),
        "snippets": extract_short_snippets(soup, max_snippets=3, max_chars=260),
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


def write_jsonl(records: Iterable[dict], path: Path) -> None:
    """Write records to JSONL using UTF-8 so Mongolian text is preserved."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        for record in records:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract copyright-safe metadata from source URLs."
    )
    parser.add_argument(
        "--sources",
        type=Path,
        default=Path("sources.txt"),
        help="Text file containing one URL per line.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/raw_extracted_topics.jsonl"),
        help="Output JSONL path for extracted topic metadata.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=20,
        help="HTTP timeout in seconds.",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.0,
        help="Delay between requests in seconds.",
    )
    parser.add_argument(
        "--user-agent",
        default=DEFAULT_USER_AGENT,
        help="User-Agent string for HTTP requests.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    urls = read_source_urls(args.sources)

    if not urls:
        print("No valid URLs found. Add URLs to sources.txt first.", file=sys.stderr)
        return 1

    records: list[dict] = []

    for index, url in enumerate(urls, start=1):
        print(f"[{index}/{len(urls)}] Fetching {url}")
        try:
            html = fetch_page(url, user_agent=args.user_agent, timeout=args.timeout)
            records.append(extract_topic(url, html))
        except requests.RequestException as exc:
            print(f"Warning: failed to fetch {url}: {exc}", file=sys.stderr)

        if index < len(urls):
            time.sleep(args.delay)

    write_jsonl(records, args.output)
    print(f"Saved {len(records)} extracted topic records to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
