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
# Transaction-return pages are reachable only from a completed Checkout session.
# They are deliberately routable, but must not become discovery/sitemap content.
PRIVATE_ROUTES = {"/payment-confirmation", "/young-people-wellbeing", "/144-stages-maintenance"}


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


def local_reference_target(
    source: Path, reference: str, route_map: dict[str, str]
) -> tuple[Path | None, str]:
    if "{{" in reference or "}}" in reference:
        return None, ""
    parsed = urlsplit(reference)
    if parsed.scheme.lower() in SKIP_SCHEMES or reference.startswith(("#", "//")):
        return None, parsed.fragment
    path = unquote(parsed.path)
    if not path:
        return None, parsed.fragment
    if path.startswith("/") and path in route_map:
        path = route_map[path]
    target = (ROOT / path.lstrip("/")) if path.startswith("/") else (source.parent / path)
    return target.resolve(), parsed.fragment


def validate_html(path: Path, errors: list[str], route_map: dict[str, str]) -> None:
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
        target, fragment = local_reference_target(path, reference, route_map)
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


def load_vercel_configuration(errors: list[str]) -> dict:
    path = ROOT / "vercel.json"
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"vercel.json: invalid JSON: {exc}")
        return {}


def validate_discovery_layer(
    config: dict, route_map: dict[str, str], errors: list[str]
) -> None:
    discovery_routes = {
        route: target for route, target in route_map.items()
        if route not in PRIVATE_ROUTES
    }
    if len(discovery_routes) != 40:
        errors.append(f"vercel.json: expected 40 canonical routes, found {len(discovery_routes)}")

    redirects = config.get("redirects", [])
    redirect_map = {
        rule.get("source"): rule
        for rule in redirects
        if rule.get("source") and rule.get("destination")
    }
    for clean_route, legacy_path in discovery_routes.items():
        target = ROOT / legacy_path.lstrip("/")
        if not target.is_file():
            errors.append(f"vercel.json: {clean_route} rewrites to missing {legacy_path}")
        redirect = redirect_map.get(legacy_path)
        if not redirect or redirect.get("destination") != clean_route:
            errors.append(
                f"vercel.json: missing legacy redirect from {legacy_path} to {clean_route}"
            )
        elif redirect.get("permanent") is not True:
            errors.append(f"vercel.json: legacy redirect {legacy_path} is not permanent")

        if target.is_file():
            text = target.read_text(encoding="utf-8")
            canonical = f'https://rainbowsanctuary.life{clean_route}'
            if f'<link rel="canonical" href="{canonical}">' not in text:
                errors.append(f"{target.name}: canonical URL is not {canonical}")
            for marker in (
                '<meta name="robots" content="index,follow',
                '<meta property="og:url"',
                '<meta name="twitter:card"',
                '<script type="application/ld+json">',
            ):
                if marker not in text:
                    errors.append(f"{target.name}: missing discovery metadata {marker}")

    expected_urls = {
        f"https://rainbowsanctuary.life{route}" for route in discovery_routes
    }
    sitemap_path = ROOT / "sitemap.xml"
    if sitemap_path.is_file():
        sitemap_urls = set(re.findall(r"<loc>([^<]+)</loc>", sitemap_path.read_text()))
        if sitemap_urls != expected_urls:
            errors.append(
                "sitemap.xml: URLs do not exactly match the canonical routes"
            )
    else:
        errors.append("sitemap.xml: missing")

    required_files = ("robots.txt", "llms.txt", "llms-full.txt")
    for filename in required_files:
        if not (ROOT / filename).is_file():
            errors.append(f"{filename}: missing")

    robots_path = ROOT / "robots.txt"
    if robots_path.is_file():
        robots = robots_path.read_text(encoding="utf-8")
        if "Sitemap: https://rainbowsanctuary.life/sitemap.xml" not in robots:
            errors.append("robots.txt: missing canonical sitemap declaration")
        for crawler in (
            "GPTBot",
            "OAI-SearchBot",
            "ClaudeBot",
            "PerplexityBot",
            "Google-Extended",
        ):
            if f"User-agent: {crawler}" not in robots:
                errors.append(f"robots.txt: missing explicit rule for {crawler}")


def validate_vercel_configuration(
    config: dict, route_map: dict[str, str], errors: list[str]
) -> None:
    if not config:
        return

    configured = {
        header.get("key")
        for rule in config.get("headers", [])
        for header in rule.get("headers", [])
    }
    missing = sorted(REQUIRED_SECURITY_HEADERS - configured)
    if missing:
        errors.append(f"vercel.json: missing security headers: {', '.join(missing)}")

    if route_map.get("/") != "/Home.dc.html":
        errors.append("vercel.json: root does not rewrite to Home.dc.html")

    validate_discovery_layer(config, route_map, errors)


def main() -> int:
    errors: list[str] = []
    config = load_vercel_configuration(errors)
    route_map = {
        rule["source"]: rule["destination"]
        for rule in config.get("rewrites", [])
        if isinstance(rule, dict) and rule.get("source") and rule.get("destination")
    }
    html_files = sorted(ROOT.glob("*.html"))
    if not html_files:
        errors.append("No root HTML pages found")
    for path in html_files:
        validate_html(path, errors, route_map)
    validate_active_placeholders(errors)
    validate_vercel_configuration(config, route_map, errors)

    if errors:
        print(f"Site validation failed with {len(errors)} issue(s):", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"Site validation passed: {len(html_files)} HTML pages checked.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
