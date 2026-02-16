import re
import time
from concurrent.futures import ThreadPoolExecutor
from html import unescape
from urllib.parse import urljoin

import requests

from app.repositories.supabase_repository import SupabaseRepository
from app.services.technology_service import TechnologyService


class GlorriService:
    API_URL = "https://api.glorri.az/job-service-v2/jobs/public"
    DETAIL_URL_TEMPLATE = "https://jobs.glorri.com/vacancies/{company_slug}/{job_slug}"

    JOB_FUNCTION = "science-technology-engineering"
    LIMIT = 20

    REQUEST_TIMEOUT = 20
    DETAIL_WORKERS = 16
    MAX_RETRIES = 6
    RETRY_WAIT_SECONDS = 30

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

    def __init__(self, repository: SupabaseRepository, technology_service: TechnologyService):
        self.repository = repository
        self.technology_service = technology_service

    def _get_with_retry(self, url: str, params: dict | None = None) -> requests.Response:
        for attempt in range(1, self.MAX_RETRIES + 1):
            response = requests.get(url, params=params, timeout=self.REQUEST_TIMEOUT)

            if response.status_code != 429:
                response.raise_for_status()
                return response

            if attempt == self.MAX_RETRIES:
                response.raise_for_status()

            print(
                f"Glorri 429: waiting {self.RETRY_WAIT_SECONDS}s before retry "
                f"({attempt}/{self.MAX_RETRIES})"
            )
            time.sleep(self.RETRY_WAIT_SECONDS)

        raise RuntimeError("Glorri request retry failed")

    @staticmethod
    def _normalize_company(company) -> dict:
        if not isinstance(company, dict):
            return {"slug": "", "name": "", "logo": ""}

        return {
            "slug": company.get("slug") if isinstance(company.get("slug"), str) else "",
            "name": company.get("name") if isinstance(company.get("name"), str) else "",
            "logo": company.get("logo") if isinstance(company.get("logo"), str) else "",
        }

    def _normalize_job(self, job: dict) -> dict:
        normalized = dict(job)
        for field in self.REMOVE_JOB_FIELDS:
            normalized.pop(field, None)
        normalized["company"] = self._normalize_company(job.get("company"))
        return normalized

    @staticmethod
    def _clean_text(value: str) -> str:
        value = re.sub(r"(?is)<!--.*?-->", "", value)
        value = re.sub(r"(?is)<br\s*/?>", "\n", value)
        value = re.sub(r"(?is)<[^>]+>", "", value)
        value = unescape(value).replace("\xa0", " ")
        value = re.sub(r"[ \t]+", " ", value)
        value = re.sub(r"\n{3,}", "\n\n", value)
        return value.strip()

    @staticmethod
    def _clean_html_fragment(value: str) -> str:
        value = re.sub(r"(?is)<!--.*?-->", "", value)
        value = unescape(value).replace("\xa0", " ")

        value = re.sub(
            r"(?is)<\s*([a-zA-Z0-9]+)\b[^>]*?>",
            lambda match: "<br>" if match.group(1).lower() == "br" else f"<{match.group(1).lower()}>",
            value,
        )
        value = re.sub(
            r"(?is)</\s*([a-zA-Z0-9]+)\s*>",
            lambda match: f"</{match.group(1).lower()}>",
            value,
        )
        value = re.sub(r"[ \t]+", " ", value)
        value = re.sub(r"\n{3,}", "\n\n", value)
        return value.strip()

    @staticmethod
    def _extract_section_slice(html: str, heading: str) -> str:
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

    def _extract_description_html(self, html: str, heading: str) -> str:
        section = self._extract_section_slice(html, heading)
        if not section:
            return ""

        match = re.search(r'(?is)<div[^>]*class="[^"]*\bdescription-html\b[^"]*"[^>]*>(.*?)</div>', section)
        if not match:
            return ""

        return self._clean_html_fragment(match.group(1))

    def _extract_about_fields(self, html: str) -> dict:
        section = self._extract_section_slice(html, "Vakansiya haqqında")
        if not section:
            return {}

        row_pattern = re.compile(
            r'(?is)<div[^>]*class="[^"]*\bjustify-between\b[^"]*"[^>]*>\s*'
            r'<p[^>]*class="[^"]*\btext-neutral-80\b[^"]*"[^>]*>(.*?)</p>\s*'
            r'<p[^>]*class="[^"]*\bfont-semibold\b[^"]*"[^>]*>(.*?)</p>',
        )

        fields = {}
        for label_html, value_html in row_pattern.findall(section):
            label = self._clean_text(label_html)
            value = self._clean_text(value_html)
            if label and value:
                fields[self.ABOUT_LABEL_TO_EN.get(label, label)] = value

        return fields

    def _extract_benefits(self, html: str) -> list[str]:
        section = self._extract_section_slice(html, "İmtiyazlar")
        if not section:
            return []

        items = re.findall(r"(?is)<li[^>]*>(.*?)</li>", section)
        benefits = []
        for item in items:
            cleaned = self._clean_text(item)
            if cleaned:
                benefits.append(cleaned)

        return benefits

    @staticmethod
    def _extract_apply_url(html: str, detail_url: str) -> str:
        match = re.search(r'(?is)<a[^>]*href="([^"]*/apply[^"]*)"', html)
        if not match:
            return ""
        return urljoin(detail_url, unescape(match.group(1)))

    def _build_detail_url(self, job: dict) -> str:
        company = job.get("company") if isinstance(job.get("company"), dict) else {}
        company_slug = company.get("slug")
        job_slug = job.get("slug")

        if not isinstance(company_slug, str) or not isinstance(job_slug, str):
            return ""
        if not company_slug.strip() or not job_slug.strip():
            return ""

        return self.DETAIL_URL_TEMPLATE.format(
            company_slug=company_slug.strip(),
            job_slug=job_slug.strip(),
        )

    def _scrape_job_detail(self, job: dict) -> dict:
        detail_url = self._build_detail_url(job)
        if not detail_url:
            return job

        merged = dict(job)
        merged["company"] = self._normalize_company(merged.get("company"))
        merged["detail_url"] = detail_url

        try:
            response = self._get_with_retry(detail_url)
        except requests.RequestException as error:
            merged["detail_error"] = str(error)
            return merged

        html = response.text
        merged["description_html"] = self._extract_description_html(html, "Təsvir")
        merged["requirements_html"] = self._extract_description_html(html, "Tələblər")
        merged["vacancy_about"] = self._extract_about_fields(html)
        merged["benefits"] = self._extract_benefits(html)
        merged["apply_url"] = self._extract_apply_url(html, detail_url)

        return merged

    def _fetch_jobs(self) -> list[dict]:
        jobs: list[dict] = []
        offset = 0
        total_count = None

        while total_count is None or offset < total_count:
            response = self._get_with_retry(
                self.API_URL,
                {
                    "jobFunctions[]": self.JOB_FUNCTION,
                    "offset": offset,
                    "limit": self.LIMIT,
                },
            )
            data = response.json()

            entities = data.get("entities", [])
            if isinstance(entities, list):
                jobs.extend(self._normalize_job(item) for item in entities if isinstance(item, dict))

            if total_count is None:
                total_count = int(data.get("totalCount", 0))

            if not entities:
                break

            offset += self.LIMIT

        return jobs

    def _save_to_database(self, jobs: list[dict]) -> int:
        if not self.repository.is_configured:
            print("Glorri DB save skipped: missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
            return 0

        companies_by_key: dict[str, dict] = {}
        for job in jobs:
            if not isinstance(job, dict):
                continue

            company = self._normalize_company(job.get("company"))
            key = self.repository.glorri_company_key(company)
            if key not in companies_by_key:
                companies_by_key[key] = company

        company_list = list(companies_by_key.values())
        company_map = self.repository.fetch_glorri_company_map(company_list)

        missing_company_payload = []
        for company in company_list:
            key = self.repository.glorri_company_key(company)
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
            self.repository.insert_glorri_companies(missing_company_payload)
            company_map = self.repository.fetch_glorri_company_map(company_list)

        vacancy_slugs = sorted(
            {
                job.get("slug").strip()
                for job in jobs
                if isinstance(job, dict)
                and isinstance(job.get("slug"), str)
                and job.get("slug").strip()
            }
        )
        existing_slugs = self.repository.fetch_existing_glorri_vacancy_slugs(vacancy_slugs)

        payload = []
        for job in jobs:
            if not isinstance(job, dict):
                continue

            slug = job.get("slug")
            if not isinstance(slug, str) or not slug.strip():
                continue
            slug = slug.strip()

            if slug in existing_slugs:
                continue

            company = self._normalize_company(job.get("company"))
            company_key = self.repository.glorri_company_key(company)
            company_id = company_map.get(company_key)

            tech_input = "\n".join(
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
                    "vacancy_about": job.get("vacancy_about")
                    if isinstance(job.get("vacancy_about"), dict)
                    else None,
                    "benefits": job.get("benefits") if isinstance(job.get("benefits"), list) else None,
                    "apply_url": job.get("apply_url") if isinstance(job.get("apply_url"), str) else None,
                    "company_id": company_id,
                    "tech_stack": self.technology_service.extract(tech_input),
                }
            )

        if not payload:
            return 0

        self.repository.insert_glorri_vacancies(payload)
        return len(payload)

    def run(self) -> dict[str, int]:
        jobs = self._fetch_jobs()
        with ThreadPoolExecutor(max_workers=self.DETAIL_WORKERS) as executor:
            jobs_with_details = list(executor.map(self._scrape_job_detail, jobs))

        saved_count = self._save_to_database(jobs_with_details)

        print(f"Glorri: scraped={len(jobs_with_details)}, saved={saved_count}")
        return {"scraped": len(jobs_with_details), "saved": saved_count}
