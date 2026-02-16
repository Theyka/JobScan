import json
import re
from concurrent.futures import ThreadPoolExecutor
from html import escape, unescape
from pathlib import Path

import requests

BASE_URL = "https://jobsearch.az/api-az/vacancies-az/"
HEADERS = {"X-Requested-With": "XMLHttpRequest"}
WORKERS = 40
TIMEOUT = 20
EXCLUDE_FIELDS = {
    "is_new",
    "is_favorite",
    "is_vip",
    "request_type",
    "similar_vacancies",
    "v_count",
    "view_count",
    "company_vacancy_count",
    "has_company_info",
    "category",
    "files",
    "direct_apply",
    "hide_company",
    "slug",
    "salary",
}
COMPANY_EXCLUDE_FIELDS = {
    "has_story",
    "vacancy_count",
    "summary",
    "gallery",
    "industries",
}

DIR = Path(__file__).parent
INPUT_FILE = DIR / "jobsearch_az.json"
OUTPUT_FILE = DIR / "jobsearch_az_details.json"

with INPUT_FILE.open("r", encoding="utf-8") as f:
    jobs = json.load(f)

if not isinstance(jobs, list):
    print("jobsearch_az.json must be a JSON list")
    raise SystemExit(1)


def clean_html(text: str) -> str:
    allowed_tags = {
        "p",
        "br",
        "ul",
        "ol",
        "li",
        "strong",
        "em",
        "a",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "blockquote",
    }
    dangerous_tags = {"script", "style", "iframe", "object", "embed", "svg", "math", "noscript"}

    for tag in dangerous_tags:
        text = re.sub(
            rf"(?is)<\s*{tag}\b[^>]*>.*?<\s*/\s*{tag}\s*>",
            "",
            text,
        )

    text = re.sub(r"(?is)<!--.*?-->", "", text)
    text = unescape(text).replace("\xa0", " ")

    def sanitize_tag(match: re.Match[str]) -> str:
        closing = match.group(1)
        name = match.group(2).lower()
        attrs = match.group(3) or ""

        if name == "b":
            name = "strong"
        elif name == "i":
            name = "em"

        if name not in allowed_tags:
            return ""

        if closing:
            return f"</{name}>"

        if name == "br":
            return "<br>"

        if name == "a":
            href_match = re.search(
                r"""(?i)\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))""",
                attrs,
            )
            href = ""
            if href_match:
                href = href_match.group(2) or href_match.group(3) or href_match.group(4) or ""
                href = href.strip()
                if not re.match(r"(?i)^(https?://|mailto:)", href):
                    href = ""
            if href:
                return f'<a href="{escape(href, quote=True)}">'
            return "<a>"

        return f"<{name}>"

    text = re.sub(r"(?is)<\s*(/?)\s*([a-zA-Z0-9]+)([^>]*)>", sanitize_tag, text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def fetch_job(job: dict) -> dict | None:
    slug = job.get("slug")
    if not slug:
        return None
    response = requests.get(f"{BASE_URL}{slug}", headers=HEADERS, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    if isinstance(data, dict):
        for key in EXCLUDE_FIELDS:
            data.pop(key, None)
        if isinstance(data.get("text"), str):
            data["text"] = clean_html(data["text"])
        company = data.get("company")
        if isinstance(company, dict):
            for key in COMPANY_EXCLUDE_FIELDS:
                company.pop(key, None)
            if isinstance(company.get("text"), str):
                company["text"] = clean_html(company["text"])
    return data


with ThreadPoolExecutor(max_workers=WORKERS) as executor:
    details = [data for data in executor.map(fetch_job, jobs) if data is not None]

with OUTPUT_FILE.open("w", encoding="utf-8") as f:
    json.dump(details, f, ensure_ascii=False, indent=2)

print(f"Saved {len(details)} job details to {OUTPUT_FILE}")
