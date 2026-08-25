#!/usr/bin/env python3
"""Validate production and protected staging endpoints without third-party services."""

from __future__ import annotations

import ssl
import sys
import urllib.error
import urllib.request


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


CHECKS = (
    (
        "production",
        "https://rainbowsanctuary.life/",
        {200},
        lambda _status, _location: True,
        "HTTP 200",
    ),
    (
        "clean about route",
        "https://rainbowsanctuary.life/about",
        {200},
        lambda _status, _location: True,
        "HTTP 200",
    ),
    (
        "clean events route",
        "https://rainbowsanctuary.life/events",
        {200},
        lambda _status, _location: True,
        "HTTP 200",
    ),
    (
        "online group healing checkout route",
        "https://rainbowsanctuary.life/online-group-healing",
        {200},
        lambda _status, _location: True,
        "HTTP 200",
    ),
    (
        "regeneration maintenance checkout route",
        "https://rainbowsanctuary.life/144-stages-maintenance",
        {200},
        lambda _status, _location: True,
        "HTTP 200",
    ),
    (
        "children weekly practice checkout route",
        "https://rainbowsanctuary.life/children-weekly-practice",
        {200},
        lambda _status, _location: True,
        "HTTP 200",
    ),
    (
        "family support registration route",
        "https://rainbowsanctuary.life/autism-family-support",
        {200},
        lambda _status, _location: True,
        "HTTP 200",
    ),
    (
        "retreat booking route",
        "https://rainbowsanctuary.life/awakening-your-inner-light-2026",
        {200},
        lambda _status, _location: True,
        "HTTP 200",
    ),
    (
        "legacy about redirect",
        "https://rainbowsanctuary.life/About-Stephanie.dc.html",
        {308},
        lambda _status, location: location == "/about",
        "HTTP 308 redirect to /about",
    ),
    (
        "sitemap",
        "https://rainbowsanctuary.life/sitemap.xml",
        {200},
        lambda _status, _location: True,
        "HTTP 200",
    ),
    (
        "robots",
        "https://rainbowsanctuary.life/robots.txt",
        {200},
        lambda _status, _location: True,
        "HTTP 200",
    ),
    (
        "LLM discovery",
        "https://rainbowsanctuary.life/llms.txt",
        {200},
        lambda _status, _location: True,
        "HTTP 200",
    ),
    (
        "www canonical redirect",
        "https://www.rainbowsanctuary.life/",
        {308},
        lambda _status, location: location == "https://rainbowsanctuary.life/",
        "permanent redirect to the apex domain",
    ),
    (
        "protected staging",
        "https://staging.rainbowsanctuary.life/",
        {302},
        lambda _status, location: location.startswith("https://vercel.com/sso-api?"),
        "Vercel authentication redirect",
    ),
)


def response(url: str) -> tuple[int, str]:
    opener = urllib.request.build_opener(
        NoRedirect(),
        urllib.request.HTTPSHandler(context=ssl.create_default_context()),
    )
    request = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "rs-health-check/1"})
    try:
        result = opener.open(request, timeout=20)
        return result.status, result.headers.get("Location", "")
    except urllib.error.HTTPError as exc:
        return exc.code, exc.headers.get("Location", "")


def main() -> int:
    failures: list[str] = []
    for name, url, statuses, location_check, expected in CHECKS:
        try:
            status, location = response(url)
        except Exception as exc:
            failures.append(f"{name}: request failed: {exc}")
            continue
        if status not in statuses or not location_check(status, location):
            failures.append(
                f"{name}: got HTTP {status} Location={location!r}; expected {expected}"
            )
        else:
            print(f"OK {name}: HTTP {status} -> {location}")
    if failures:
        print("Endpoint monitoring failed:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
