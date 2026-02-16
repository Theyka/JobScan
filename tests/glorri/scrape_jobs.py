import json
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor
from html import unescape
from pathlib import Path
from urllib.parse import urljoin

import requests

API_URL = "https://api.glorri.az/job-service-v2/jobs/public"
DETAIL_URL_TEMPLATE = "https://jobs.glorri.com/vacancies/{company_slug}/{job_slug}"
JOB_FUNCTION = "science-technology-engineering"
LIMIT = 20
TIMEOUT = 20
DETAIL_WORKERS = 16
OUTPUT_FILE = Path(__file__).with_name("glorri_jobs.json")
ROOT_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = ROOT_DIR / "backend" / ".env"
MAX_RETRIES = 6
RETRY_WAIT_SECONDS = 30
SUPABASE_TIMEOUT = 60
ABOUT_LABEL_TO_EN = {
    "Son tarix": "deadline",
    "Paylaşılıb": "posted",
    "Vakansiya növü": "job_type",
    "Təcrübə": "experience",
    "Vəzifə dərəcəsi": "position_level",
    "Təhsil": "education",
    "Əmək haqqı": "salary",
}
REMOVE_JOB_FIELDS = {"isProAd", "isRemote", "viewCount"}

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


def normalize_company(company) -> dict:
    if not isinstance(company, dict):
        return {"slug": "", "name": "", "logo": ""}

    return {
        "slug": company.get("slug") if isinstance(company.get("slug"), str) else "",
        "name": company.get("name") if isinstance(company.get("name"), str) else "",
        "logo": company.get("logo") if isinstance(company.get("logo"), str) else "",
    }


def normalize_job(job: dict) -> dict:
    normalized = dict(job)
    for field in REMOVE_JOB_FIELDS:
        normalized.pop(field, None)
    normalized["company"] = normalize_company(job.get("company"))
    return normalized


def get_with_retry(url: str, params: dict | None = None) -> requests.Response:
    for attempt in range(1, MAX_RETRIES + 1):
        response = requests.get(url, params=params, timeout=TIMEOUT)

        if response.status_code != 429:
            response.raise_for_status()
            return response

        if attempt == MAX_RETRIES:
            response.raise_for_status()

        print(f"429 received, waiting {RETRY_WAIT_SECONDS}s before retry ({attempt}/{MAX_RETRIES})")
        time.sleep(RETRY_WAIT_SECONDS)

    raise RuntimeError("Request retry failed")


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


def company_key(company: dict) -> str:
    slug = company.get("slug") if isinstance(company.get("slug"), str) else ""
    name = company.get("name") if isinstance(company.get("name"), str) else ""
    slug = slug.strip()
    name = name.strip()
    if slug:
        return f"slug:{slug}"
    return f"name:{name}"


def fetch_company_map(companies: list[dict], supabase_url: str, service_key: str) -> dict[str, int]:
    company_map: dict[str, int] = {}

    slugs = sorted({c.get("slug", "").strip() for c in companies if isinstance(c.get("slug"), str) and c.get("slug", "").strip()})
    names_without_slug = sorted(
        {
            c.get("name", "").strip()
            for c in companies
            if isinstance(c.get("name"), str)
            and c.get("name", "").strip()
            and not (isinstance(c.get("slug"), str) and c.get("slug", "").strip())
        }
    )

    for chunk in chunk_list(slugs, 80):
        in_filter = "(" + ",".join(quote_for_in(value) for value in chunk) + ")"
        response = requests.get(
            f"{supabase_url}/rest/v1/glorri_companies",
            headers=supabase_headers(service_key),
            params={"select": "id,slug,name", "slug": f"in.{in_filter}"},
            timeout=SUPABASE_TIMEOUT,
        )
        response.raise_for_status()
        rows = response.json()
        if isinstance(rows, list):
            for row in rows:
                slug = row.get("slug") if isinstance(row.get("slug"), str) else ""
                name = row.get("name") if isinstance(row.get("name"), str) else ""
                company_id = row.get("id")
                if company_id is None:
                    continue
                key = f"slug:{slug.strip()}" if slug.strip() else f"name:{name.strip()}"
                company_map[key] = int(company_id)

    for chunk in chunk_list(names_without_slug, 80):
        in_filter = "(" + ",".join(quote_for_in(value) for value in chunk) + ")"
        response = requests.get(
            f"{supabase_url}/rest/v1/glorri_companies",
            headers=supabase_headers(service_key),
            params={"select": "id,slug,name", "name": f"in.{in_filter}"},
            timeout=SUPABASE_TIMEOUT,
        )
        response.raise_for_status()
        rows = response.json()
        if isinstance(rows, list):
            for row in rows:
                slug = row.get("slug") if isinstance(row.get("slug"), str) else ""
                name = row.get("name") if isinstance(row.get("name"), str) else ""
                company_id = row.get("id")
                if company_id is None:
                    continue
                key = f"slug:{slug.strip()}" if slug.strip() else f"name:{name.strip()}"
                company_map[key] = int(company_id)

    return company_map


def fetch_existing_vacancy_slugs(slugs: list[str], supabase_url: str, service_key: str) -> set[str]:
    existing: set[str] = set()
    for chunk in chunk_list(slugs, 80):
        in_filter = "(" + ",".join(quote_for_in(value) for value in chunk) + ")"
        response = requests.get(
            f"{supabase_url}/rest/v1/glorri_vacancies",
            headers=supabase_headers(service_key),
            params={"select": "slug", "slug": f"in.{in_filter}"},
            timeout=SUPABASE_TIMEOUT,
        )
        response.raise_for_status()
        rows = response.json()
        if isinstance(rows, list):
            for row in rows:
                slug = row.get("slug")
                if isinstance(slug, str) and slug:
                    existing.add(slug)
    return existing


def save_to_database(jobs: list[dict]):
    env_values = load_env_file(ENV_FILE)
    supabase_url = os.getenv("SUPABASE_URL", env_values.get("SUPABASE_URL", "")).rstrip("/")
    service_key = os.getenv("SUPABASE_SERVICE_KEY", env_values.get("SUPABASE_SERVICE_KEY", ""))

    if not supabase_url or not service_key:
        print("Skipping DB save: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing.")
        return

    companies_by_key: dict[str, dict] = {}
    for job in jobs:
        if not isinstance(job, dict):
            continue
        company = normalize_company(job.get("company"))
        key = company_key(company)
        if key not in companies_by_key:
            companies_by_key[key] = company

    company_list = list(companies_by_key.values())
    company_map = fetch_company_map(company_list, supabase_url, service_key)
    missing_company_payload = []
    for company in company_list:
        key = company_key(company)
        if key in company_map:
            continue
        missing_company_payload.append(
            {
                "slug": company.get("slug") or None,
                "name": company.get("name") or None,
                "logo": company.get("logo") or None,
            }
        )

    if missing_company_payload:
        response = requests.post(
            f"{supabase_url}/rest/v1/glorri_companies",
            headers=supabase_headers(service_key, "return=representation"),
            json=missing_company_payload,
            timeout=SUPABASE_TIMEOUT,
        )
        response.raise_for_status()
        company_map = fetch_company_map(company_list, supabase_url, service_key)

    vacancy_slugs = sorted(
        {
            job.get("slug").strip()
            for job in jobs
            if isinstance(job, dict) and isinstance(job.get("slug"), str) and job.get("slug").strip()
        }
    )
    existing_vacancy_slugs = fetch_existing_vacancy_slugs(vacancy_slugs, supabase_url, service_key)

    payload = []
    for job in jobs:
        if not isinstance(job, dict):
            continue

        slug = job.get("slug")
        if not isinstance(slug, str) or not slug.strip():
            continue
        slug = slug.strip()

        if slug in existing_vacancy_slugs:
            continue

        company = normalize_company(job.get("company"))
        key = company_key(company)
        company_id = company_map.get(key)

        payload.append(
            {
                "title": job.get("title") if isinstance(job.get("title"), str) else None,
                "slug": slug,
                "postedDate": job.get("postedDate") if isinstance(job.get("postedDate"), str) else None,
                "jobFunction": job.get("jobFunction") if isinstance(job.get("jobFunction"), str) else None,
                "careerLevel": job.get("careerLevel") if isinstance(job.get("careerLevel"), str) else None,
                "location": job.get("location") if isinstance(job.get("location"), str) else None,
                "type": job.get("type") if isinstance(job.get("type"), str) else None,
                "detail_url": job.get("detail_url") if isinstance(job.get("detail_url"), str) else None,
                "description_html": job.get("description_html")
                if isinstance(job.get("description_html"), str)
                else None,
                "requirements_html": job.get("requirements_html")
                if isinstance(job.get("requirements_html"), str)
                else None,
                "vacancy_about": job.get("vacancy_about") if isinstance(job.get("vacancy_about"), dict) else None,
                "benefits": job.get("benefits") if isinstance(job.get("benefits"), list) else None,
                "apply_url": job.get("apply_url") if isinstance(job.get("apply_url"), str) else None,
                "company_id": company_id,
                "tech_stack": extract_technologies(
                    "\n".join(
                        [
                            job.get("title") if isinstance(job.get("title"), str) else "",
                            job.get("jobFunction") if isinstance(job.get("jobFunction"), str) else "",
                            job.get("description_html") if isinstance(job.get("description_html"), str) else "",
                            job.get("requirements_html") if isinstance(job.get("requirements_html"), str) else "",
                            " ".join(job.get("benefits")) if isinstance(job.get("benefits"), list) else "",
                            " ".join(str(value) for value in job.get("vacancy_about", {}).values())
                            if isinstance(job.get("vacancy_about"), dict)
                            else "",
                        ]
                    )
                ),
            }
        )

    if not payload:
        print("No new vacancies to save.")
        return

    for chunk in chunk_list(payload, 200):
        response = requests.post(
            f"{supabase_url}/rest/v1/glorri_vacancies",
            headers=supabase_headers(service_key, "return=minimal"),
            json=chunk,
            timeout=SUPABASE_TIMEOUT,
        )
        response.raise_for_status()

    print(f"Saved {len(payload)} new vacancies to database.")


def clean_text(value: str) -> str:
    value = re.sub(r"(?is)<!--.*?-->", "", value)
    value = re.sub(r"(?is)<br\s*/?>", "\n", value)
    value = re.sub(r"(?is)<[^>]+>", "", value)
    value = unescape(value).replace("\xa0", " ")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


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
    clean_text_value = strip_html(text)
    found = []

    for tech, keywords in TECHNOLOGIES.items():
        for keyword in keywords:
            if re.search(get_regex_pattern(keyword), clean_text_value, re.IGNORECASE):
                found.append(tech)
                break

    return found


def clean_html_fragment(value: str) -> str:
    value = re.sub(r"(?is)<!--.*?-->", "", value)
    value = unescape(value).replace("\xa0", " ")

    value = re.sub(
        r"(?is)<\s*([a-zA-Z0-9]+)\b[^>]*?>",
        lambda m: "<br>" if m.group(1).lower() == "br" else f"<{m.group(1).lower()}>",
        value,
    )
    value = re.sub(
        r"(?is)</\s*([a-zA-Z0-9]+)\s*>",
        lambda m: f"</{m.group(1).lower()}>",
        value,
    )
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def extract_section_slice(html: str, heading: str) -> str:
    heading_match = re.search(
        rf"(?is)<h3[^>]*>\s*{re.escape(heading)}\s*</h3>",
        html,
    )
    if not heading_match:
        return ""

    start = heading_match.end()
    next_heading = re.search(r"(?is)<h3[^>]*>", html[start:])
    end = start + next_heading.start() if next_heading else len(html)
    return html[start:end]


def extract_description_html(html: str, heading: str) -> str:
    section = extract_section_slice(html, heading)
    if not section:
        return ""
    match = re.search(r'(?is)<div[^>]*class="[^"]*\bdescription-html\b[^"]*"[^>]*>(.*?)</div>', section)
    if not match:
        return ""
    return clean_html_fragment(match.group(1))


def extract_about_fields(html: str) -> dict:
    section = extract_section_slice(html, "Vakansiya haqqında")
    if not section:
        return {}

    row_pattern = re.compile(
        r'(?is)<div[^>]*class="[^"]*\bjustify-between\b[^"]*"[^>]*>\s*'
        r'<p[^>]*class="[^"]*\btext-neutral-80\b[^"]*"[^>]*>(.*?)</p>\s*'
        r'<p[^>]*class="[^"]*\bfont-semibold\b[^"]*"[^>]*>(.*?)</p>',
    )

    fields = {}
    for label_html, value_html in row_pattern.findall(section):
        label = clean_text(label_html)
        value = clean_text(value_html)
        if label and value:
            fields[ABOUT_LABEL_TO_EN.get(label, label)] = value
    return fields


def extract_category(html: str) -> str:
    section = extract_section_slice(html, "Kateqoriya")
    if not section:
        return ""
    match = re.search(r"(?is)<span[^>]*>(.*?)</span>", section)
    return clean_text(match.group(1)) if match else ""


def extract_benefits(html: str) -> list[str]:
    section = extract_section_slice(html, "İmtiyazlar")
    if not section:
        return []
    items = re.findall(r"(?is)<li[^>]*>(.*?)</li>", section)
    return [clean_text(item) for item in items if clean_text(item)]


def extract_apply_url(html: str, detail_url: str) -> str:
    match = re.search(r'(?is)<a[^>]*href="([^"]*/apply[^"]*)"', html)
    if not match:
        return ""
    return urljoin(detail_url, unescape(match.group(1)))


def build_detail_url(job: dict) -> str:
    company = job.get("company") if isinstance(job.get("company"), dict) else {}
    company_slug = company.get("slug")
    job_slug = job.get("slug")
    if not isinstance(company_slug, str) or not isinstance(job_slug, str):
        return ""
    if not company_slug.strip() or not job_slug.strip():
        return ""
    return DETAIL_URL_TEMPLATE.format(company_slug=company_slug.strip(), job_slug=job_slug.strip())


def scrape_job_detail(job: dict) -> dict:
    detail_url = build_detail_url(job)
    if not detail_url:
        return job

    merged = dict(job)
    merged["company"] = normalize_company(merged.get("company"))
    merged["detail_url"] = detail_url

    try:
        response = get_with_retry(detail_url)
    except requests.RequestException as error:
        merged["detail_error"] = str(error)
        return merged

    html = response.text
    about = extract_about_fields(html)

    merged["description_html"] = extract_description_html(html, "Təsvir")
    merged["requirements_html"] = extract_description_html(html, "Tələblər")
    merged["vacancy_about"] = about
    merged["benefits"] = extract_benefits(html)
    merged["apply_url"] = extract_apply_url(html, detail_url)

    return merged


def fetch_jobs() -> list[dict]:
    jobs = []
    offset = 0
    total_count = None

    while total_count is None or offset < total_count:
        response = get_with_retry(
            API_URL,
            {
                "jobFunctions[]": JOB_FUNCTION,
                "offset": offset,
                "limit": LIMIT,
            },
        )
        data = response.json()

        entities = data.get("entities", [])
        if isinstance(entities, list):
            jobs.extend([normalize_job(item) for item in entities if isinstance(item, dict)])

        if total_count is None:
            total_count = int(data.get("totalCount", 0))

        if not entities:
            break

        offset += LIMIT

    return jobs


def main():
    jobs = fetch_jobs()
    with ThreadPoolExecutor(max_workers=DETAIL_WORKERS) as executor:
        jobs_with_details = list(executor.map(scrape_job_detail, jobs))

    save_to_database(jobs_with_details)

    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(jobs_with_details, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(jobs_with_details)} jobs to {OUTPUT_FILE}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Script failed: {error}")
