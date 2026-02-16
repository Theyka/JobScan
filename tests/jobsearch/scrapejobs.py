import json
import os
import re
from concurrent.futures import ThreadPoolExecutor
from html import escape, unescape
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

import requests

BASE_URL = (
    "https://jobsearch.az/api-az/vacancies-az"
    "?hl=az&q=&posted_date=&seniority=&categories=1076&industries="
    "&ads=&location=&job_type=&salary=&order_by="
)
DETAIL_BASE_URL = "https://jobsearch.az/api-az/vacancies-az/"
HEADERS = {"X-Requested-With": "XMLHttpRequest"}
LIST_WORKERS = 4
DETAIL_WORKERS = 40
TIMEOUT = 20
SUPABASE_TIMEOUT = 60

LIST_REMOVE_FIELDS = {"is_new", "is_favorite", "is_vip", "hide_company", "view_count"}
DETAIL_EXCLUDE_FIELDS = {
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
}
COMPANY_EXCLUDE_FIELDS = {
    "has_story",
    "vacancy_count",
    "summary",
    "gallery",
    "industries",
    "slug",
    "id",
}

ROOT_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = ROOT_DIR / "backend" / ".env"
LIST_OUTPUT_FILE = Path(__file__).with_name("jobsearch_az.json")
DETAIL_OUTPUT_FILE = Path(__file__).with_name("jobsearch_az_details.json")
TECHNOLOGIES = {
    # Programming Languages
    "JavaScript": ["javascript", "js", "ecmascript"],
    "TypeScript": ["typescript"],
    "Python": ["python"],
    "Java": ["java", "jdk", "jvm", "java core"],
    "C#": ["c#", "csharp", "c sharp"],
    "PHP": ["php"],
    "Go": ["golang"],
    "SQL": ["sql", "pl/sql", "plsql", "t-sql"],
    "Swift": ["swift"],
    "Kotlin": ["kotlin"],
    "Ruby": ["ruby"],
    "Rust": ["rust"],
    "C/C++": ["c++", "cpp"],
    "Scala": ["scala"],
    # Frontend Frameworks
    "React": ["react", "reactjs", "react.js"],
    "Angular": ["angular", "angularjs"],
    "Vue.js": ["vue", "vuejs", "vue.js"],
    "Next.js": ["next.js", "nextjs"],
    # Java/Spring Ecosystem
    "Spring Boot": ["spring boot", "springboot"],
    "Spring MVC": ["spring mvc"],
    "Spring": ["spring framework", "spring"],
    "Hibernate": ["hibernate"],
    "JPA": ["jpa", "java persistence"],
    "Maven": ["maven"],
    "Gradle": ["gradle"],
    # Backend Frameworks
    "Node.js": ["node.js", "nodejs", "node js", "express.js", "expressjs"],
    "Django": ["django"],
    ".NET": [".net", "asp.net", "dotnet"],
    "Laravel": ["laravel"],
    "FastAPI": ["fastapi"],
    # Mobile
    "React Native": ["react native"],
    "Flutter": ["flutter", "dart"],
    "Android": ["android"],
    "iOS": ["ios", "objective-c"],
    # Databases
    "MongoDB": ["mongodb", "mongo"],
    "Redis": ["redis"],
    "PostgreSQL": ["postgresql", "postgres"],
    "MySQL": ["mysql"],
    "Oracle DB": ["oracle"],
    "MS SQL": ["mssql", "sql server"],
    "Elasticsearch": ["elasticsearch", "elastic"],
    # Messaging & Streaming
    "Kafka": ["kafka"],
    "RabbitMQ": ["rabbitmq"],
    # DevOps/Cloud
    "Docker": ["docker", "container"],
    "Kubernetes": ["kubernetes", "k8s"],
    "AWS": ["aws", "amazon web services"],
    "Azure": ["azure", "microsoft azure"],
    "GCP": ["gcp", "google cloud"],
    "CI/CD": ["ci/cd", "cicd", "jenkins", "gitlab ci"],
    "Linux/Unix": ["linux", "unix", "ubuntu", "centos", "debian"],
    "Windows": ["windows"],
    # Networking & Protocols
    "HTTP/HTTPS": ["http", "https", "rest api", "restful"],
    "TCP/IP": ["tcp/ip", "tcp", "networking"],
    "SSL/TLS": ["ssl", "tls", "certificate"],
    "WebSocket": ["websocket", "socket.io"],
    "gRPC": ["grpc"],
    # API & Integration
    "REST API": ["rest api", "restful", "api"],
    "GraphQL": ["graphql"],
    "API Gateway": ["api gateway", "gravitee"],
    "Microservices": ["microservice", "micro-service", "microservices"],
    # Authentication & Security
    "Keycloak": ["keycloak"],
    "OAuth": ["oauth", "oauth2"],
    "JWT": ["jwt", "json web token"],
    # Workflow & BPM
    "Camunda": ["camunda"],
    # Concurrency
    "Multithreading": ["multithreading", "multi-threading", "concurrency", "parallel"],
    # Tools & Version Control
    "Git": ["git", "github", "gitlab", "bitbucket"],
    "1C": ["1c", "1с"],
    # Testing
    "JUnit": ["junit"],
    "Selenium": ["selenium"],
    "Jest": ["jest"],
    # Data & Analytics
    "Power BI": ["power bi", "powerbi"],
    "Tableau": ["tableau"],
    "ETL": ["etl"],
}


def load_env_file(path: Path) -> dict:
    values = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip("'").strip('"')
    return values


def parse_salary(value):
    if value is None:
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        digits = re.sub(r"\D", "", value)
        return int(digits) if digits else None
    return None


def strip_html(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = re.sub(r"(?is)<!--.*?-->", " ", text)
    text = re.sub(r"(?is)<br\s*/?>", "\n", text)
    text = re.sub(r"(?is)<[^>]+>", " ", text)
    text = unescape(text).replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def get_regex_pattern(keyword: str) -> str:
    pattern = re.escape(keyword)

    if keyword[0].isalnum() or keyword[0] == "_":
        pattern = r"\b" + pattern
    else:
        pattern = r"(?:^|\s)" + pattern

    if keyword[-1].isalnum() or keyword[-1] == "_":
        pattern = pattern + r"\b"
    else:
        pattern = pattern + r"(?:$|[\s,.;/\(\)])"

    return pattern


def extract_technologies(text: str) -> list[str]:
    clean_text = strip_html(text)
    found = []

    for tech, keywords in TECHNOLOGIES.items():
        for keyword in keywords:
            if re.search(get_regex_pattern(keyword), clean_text, re.IGNORECASE):
                found.append(tech)
                break

    return found


def normalize_id(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def merge_phones(company_phones, top_phone) -> list[str]:
    merged = []

    if isinstance(company_phones, list):
        for phone in company_phones:
            if isinstance(phone, str):
                phone = phone.strip()
                if phone and phone not in merged:
                    merged.append(phone)

    if isinstance(top_phone, str):
        top_phone = top_phone.strip()
        if top_phone and top_phone not in merged:
            merged.append(top_phone)

    return merged


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


def clean_listing_item(item: dict) -> dict:
    cleaned = dict(item)
    for field in LIST_REMOVE_FIELDS:
        cleaned.pop(field, None)
    return cleaned


def clean_detail_item(detail: dict) -> dict:
    cleaned = dict(detail)
    for field in DETAIL_EXCLUDE_FIELDS:
        cleaned.pop(field, None)

    if isinstance(cleaned.get("text"), str):
        cleaned["text"] = clean_html(cleaned["text"])

    company = cleaned.get("company")
    if isinstance(company, dict):
        company = dict(company)
        for key in COMPANY_EXCLUDE_FIELDS:
            company.pop(key, None)
        if isinstance(company.get("text"), str):
            company["text"] = clean_html(company["text"])
        cleaned["company"] = company

    return cleaned


def merge_job_and_detail(job: dict, detail: dict | None) -> dict:
    merged = dict(job)
    if not isinstance(detail, dict):
        return merged

    for key, value in detail.items():
        if key in {"id", "company", "phone"}:
            continue
        merged[key] = value

    company_from_job = merged.get("company") if isinstance(merged.get("company"), dict) else {}
    company_from_detail = detail.get("company") if isinstance(detail.get("company"), dict) else {}
    company = dict(company_from_job)
    company.update(company_from_detail)
    phones = merge_phones(company_from_job.get("phones"), None)
    for phone in merge_phones(company_from_detail.get("phones"), detail.get("phone")):
        if phone not in phones:
            phones.append(phone)
    company["phones"] = phones
    merged["company"] = company

    return merged


def url_with_page(page: int) -> str:
    parsed = urlparse(BASE_URL)
    params = parse_qs(parsed.query, keep_blank_values=True)
    params["page"] = [str(page)]
    query = urlencode(params, doseq=True)
    return urlunparse(parsed._replace(query=query))


def fetch_page(page: int) -> tuple[int, dict]:
    response = requests.get(url_with_page(page), headers=HEADERS, timeout=TIMEOUT)
    response.raise_for_status()
    return page, response.json()


def scrape_listing_jobs() -> list[dict]:
    all_pages = []
    page = 1
    done = False

    while not done:
        batch_pages = [page + i for i in range(LIST_WORKERS)]
        with ThreadPoolExecutor(max_workers=LIST_WORKERS) as executor:
            batch_results = list(executor.map(fetch_page, batch_pages))

        batch_results.sort(key=lambda item: item[0])
        for _, data in batch_results:
            all_pages.append(data)
            if data.get("next") is None:
                done = True
                break

        page += LIST_WORKERS

    jobs = []
    for data in all_pages:
        items = data.get("items")
        if isinstance(items, list):
            for item in items:
                if isinstance(item, dict):
                    jobs.append(clean_listing_item(item))
    return jobs


def fetch_detail_for_job(job: dict) -> tuple[int, dict] | None:
    slug = job.get("slug")
    if not isinstance(slug, str) or not slug.strip():
        return None
    job_id = normalize_id(job.get("id"))
    if job_id is None:
        return None

    try:
        response = requests.get(f"{DETAIL_BASE_URL}{slug}", headers=HEADERS, timeout=TIMEOUT)
        response.raise_for_status()
        detail = response.json()
    except requests.RequestException as error:
        print(f"Detail fetch failed for slug={slug}: {error}")
        return None

    if not isinstance(detail, dict):
        return None
    return job_id, clean_detail_item(detail)


def merge_details_into_jobs(jobs: list[dict]) -> list[dict]:
    detail_by_id: dict[int, dict] = {}
    with ThreadPoolExecutor(max_workers=DETAIL_WORKERS) as executor:
        for result in executor.map(fetch_detail_for_job, jobs):
            if result is None:
                continue
            job_id, detail = result
            detail_by_id[job_id] = detail

    merged_jobs = []
    for job in jobs:
        job_id = normalize_id(job.get("id"))
        merged_jobs.append(merge_job_and_detail(job, detail_by_id.get(job_id)))
    return merged_jobs


def supabase_headers(service_key: str, prefer: str | None = None) -> dict:
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return headers


def chunk_list(values: list, size: int):
    for i in range(0, len(values), size):
        yield values[i : i + size]


def quote_for_in(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def fetch_company_map(titles: list[str], supabase_url: str, service_key: str) -> dict[str, int]:
    company_map: dict[str, int] = {}
    for chunk in chunk_list(titles, 80):
        in_filter = "(" + ",".join(quote_for_in(title) for title in chunk) + ")"
        response = requests.get(
            f"{supabase_url}/rest/v1/js_companies",
            headers=supabase_headers(service_key),
            params={"select": "id,title", "title": f"in.{in_filter}"},
            timeout=SUPABASE_TIMEOUT,
        )
        response.raise_for_status()
        rows = response.json()
        if isinstance(rows, list):
            for row in rows:
                title = row.get("title")
                company_id = row.get("id")
                if isinstance(title, str) and company_id is not None:
                    company_map[title] = int(company_id)
    return company_map


def json_list_or_none(value):
    return value if isinstance(value, list) else None


def json_obj_or_default(value):
    return value if isinstance(value, dict) else {}


def save_to_database(jobs: list[dict]):
    env_values = load_env_file(ENV_FILE)
    supabase_url = os.getenv("SUPABASE_URL", env_values.get("SUPABASE_URL", "")).rstrip("/")
    service_key = os.getenv(
        "SUPABASE_SERVICE_KEY",
        env_values.get("SUPABASE_SERVICE_KEY", ""),
    )

    if not supabase_url or not service_key:
        print("Skipping DB save: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing.")
        return

    company_payload_by_title: dict[str, dict] = {}
    for job in jobs:
        if not isinstance(job, dict):
            continue
        company = job.get("company")
        if not isinstance(company, dict):
            continue

        title = str(company.get("title", "")).strip()
        if not title:
            continue

        if title not in company_payload_by_title:
            company_payload_by_title[title] = {
                "title": title,
                "logo": company.get("logo") or None,
                "logo_mini": company.get("logo_mini") or None,
                "first_char": (company.get("first_char") or title[0]).strip()[:1].lower(),
                "text": company.get("text") if isinstance(company.get("text"), str) else None,
                "address": company.get("address") if isinstance(company.get("address"), str) else None,
                "phones": json_list_or_none(company.get("phones")),
                "sites": json_list_or_none(company.get("sites")),
                "email": json_list_or_none(company.get("email")),
                "cover": company.get("cover") if isinstance(company.get("cover"), str) else None,
                "coordinates": json_obj_or_default(company.get("coordinates")),
            }

    titles = list(company_payload_by_title.keys())
    company_map = fetch_company_map(titles, supabase_url, service_key) if titles else {}
    missing_titles = [title for title in titles if title not in company_map]

    if missing_titles:
        payload = [company_payload_by_title[title] for title in missing_titles]
        create = requests.post(
            f"{supabase_url}/rest/v1/js_companies",
            headers=supabase_headers(service_key, "return=representation"),
            json=payload,
            timeout=SUPABASE_TIMEOUT,
        )
        if not create.ok:
            raise RuntimeError(f"{create.status_code}: {create.text}")
        company_map = fetch_company_map(titles, supabase_url, service_key)

    vacancies = []
    for job in jobs:
        if not isinstance(job, dict):
            continue

        company = job.get("company") if isinstance(job.get("company"), dict) else {}
        company_title = str(company.get("title", "")).strip()
        company_id = company_map.get(company_title)
        if company_id is None:
            continue

        vacancy_id = normalize_id(job.get("id"))
        title = job.get("title")
        created_at = job.get("created_at")
        slug = job.get("slug")
        if vacancy_id is None or not isinstance(title, str) or not created_at or not isinstance(slug, str):
            continue

        vacancies.append(
            {
                "id": vacancy_id,
                "title": title,
                "created_at": created_at,
                "slug": slug,
                "company_id": company_id,
                "salary": parse_salary(job.get("salary")),
                "deadline_at": job.get("deadline_at"),
                "text": job.get("text") if isinstance(job.get("text"), str) else None,
                "tech_stack": extract_technologies(
                    "\n".join(
                        [
                            title,
                            job.get("text") if isinstance(job.get("text"), str) else "",
                        ]
                    )
                ),
            }
        )

    if not vacancies:
        print("No vacancies to save.")
        return

    upsert = requests.post(
        f"{supabase_url}/rest/v1/js_vacancies",
        headers=supabase_headers(service_key, "resolution=merge-duplicates,return=minimal"),
        params={"on_conflict": "id"},
        json=vacancies,
        timeout=SUPABASE_TIMEOUT,
    )
    if not upsert.ok:
        raise RuntimeError(f"{upsert.status_code}: {upsert.text}")

    print(f"Saved {len(vacancies)} vacancies to database.")


def main():
    jobs = scrape_listing_jobs()
    jobs_with_details = merge_details_into_jobs(jobs)
    save_to_database(jobs_with_details)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Script failed: {error}")
