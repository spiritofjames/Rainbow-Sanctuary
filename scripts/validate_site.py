#!/usr/bin/env python3
"""Dependency-free release checks for the Rainbow Sanctuary static site."""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_SUFFIXES = {".html", ".css", ".js", ".json"}
SKIP_SCHEMES = {"data", "mailto", "tel", "javascript", "http", "https"}
COMPONENT_PAGES = {
    "SiteNav.dc.html",
    "SiteNavCinematic.dc.html",
    "SiteNavFixed.dc.html",
    "SiteNavLotus.dc.html",
}
FORBIDDEN_ACTIVE_PATTERNS = {
    "unfinished payment link": re.compile(r"REPLACE_WITH_[A-Z0-9_]+"),
    "placeholder URL": re.compile(r"""["']https?://\.\.\.["']"""),
    "localhost URL": re.compile(r"https?://(?:localhost|127\.0\.0\.1)(?::\d+)?"),
}
REQUIRED_SECURITY_HEADERS = {
    "Content-Security-Policy",
    "Permissions-Policy",
    "Referrer-Policy",
    "X-Content-Type-Options",
    "X-Frame-Options",
}


class DocumentParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.references: list[tuple[str, str]] = []
        self.ids: set[str] = set()
        self.title_parts: list[str] = []
        self.in_title = False
        self.html_lang = ""
        self.has_viewport = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "html":
            self.html_lang = (values.get("lang") or "").strip()
        if tag == "meta" and (values.get("name") or "").lower() == "viewport":
            self.has_viewport = True
        if tag == "title":
            self.in_title = True
        if values.get("id"):
            self.ids.add(values["id"] or "")
        for attribute in ("href", "src", "poster"):
            value = values.get(attribute)
            if value:
                self.references.append((attribute, value.strip()))

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)


def strip_javascript_comments(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    return re.sub(r"(^|[^:])//.*$", r"\1", text, flags=re.MULTILINE)


def local_reference_target(source: Path, reference: str) -> tuple[Path | None, str]:
    if "{{" in reference or "}}" in reference:
        return None, ""
    parsed = urlsplit(reference)
    if parsed.scheme.lower() in SKIP_SCHEMES or reference.startswith(("#", "//")):
        return None, parsed.fragment
    path = unquote(parsed.path)
    if not path or path == "/":
        return None, parsed.fragment
    target = (ROOT / path.lstrip("/")) if path.startswith("/") else (source.parent / path)
    return target.resolve(), parsed.fragment


def validate_html(path: Path, errors: list[str]) -> None:
    text = path.read_text(encoding="utf-8")
    parser = DocumentParser()
    try:
        parser.feed(text)
    except Exception as exc:  # HTMLParser is intentionally permissive.
        errors.append(f"{path.relative_to(ROOT)}: cannot parse HTML: {exc}")
        return

    relative = path.relative_to(ROOT)
    if not text.lstrip().lower().startswith("<!doctype html>"):
        errors.append(f"{relative}: missing HTML5 doctype")
    if path.name not in COMPONENT_PAGES and not parser.html_lang:
        errors.append(f"{relative}: public page is missing html[lang]")
    if not "".join(parser.title_parts).strip():
        errors.append(f"{relative}: missing non-empty title")
    if not parser.has_viewport:
        errors.append(f"{relative}: missing viewport metadata")

    for attribute, reference in parser.references:
        target, fragment = local_reference_target(path, reference)
        if target is None:
            continue
        try:
            target.relative_to(ROOT)
        except ValueError:
            errors.append(f"{relative}: {attribute} escapes the repository: {reference}")
            continue
        if not target.exists():
            errors.append(f"{relative}: missing local target for {attribute}={reference!r}")
            continue
        if fragment and target.suffix.lower() == ".html":
            target_parser = DocumentParser()
            target_parser.feed(target.read_text(encoding="utf-8"))
            if fragment not in target_parser.ids:
                errors.append(
                    f"{relative}: fragment #{fragment} does not exist in "
                    f"{target.relative_to(ROOT)}"
                )


def validate_active_placeholders(errors: list[str]) -> None:
    for path in ROOT.iterdir():
        if not path.is_file() or path.suffix.lower() not in PUBLIC_SUFFIXES:
            continue
        text = path.read_text(encoding="utf-8")
        if path.suffix.lower() == ".js":
            text = strip_javascript_comments(text)
        for label, pattern in FORBIDDEN_ACTIVE_PATTERNS.items():
            if pattern.search(text):
                errors.append(f"{path.name}: contains {label}")


def validate_vercel_configuration(errors: list[str]) -> None:
    path = ROOT / "vercel.json"
    try:
        config = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"vercel.json: invalid JSON: {exc}")
        return

    configured = {
        header.get("key")
        for rule in config.get("headers", [])
        for header in rule.get("headers", [])
    }
    missing = sorted(REQUIRED_SECURITY_HEADERS - configured)
    if missing:
        errors.append(f"vercel.json: missing security headers: {', '.join(missing)}")

    redirects = config.get("redirects", [])
    if not any(
        rule.get("source") == "/" and rule.get("destination") == "/Home.dc.html"
        for rule in redirects
    ):
        errors.append("vercel.json: root does not route to Home.dc.html")


def main() -> int:
    errors: list[str] = []
    html_files = sorted(ROOT.glob("*.html"))
    if not html_files:
        errors.append("No root HTML pages found")
    for path in html_files:
        validate_html(path, errors)
    validate_active_placeholders(errors)
    validate_vercel_configuration(errors)

    if errors:
        print(f"Site validation failed with {len(errors)} issue(s):", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"Site validation passed: {len(html_files)} HTML pages checked.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
