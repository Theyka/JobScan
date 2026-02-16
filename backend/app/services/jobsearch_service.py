import re
from concurrent.futures import ThreadPoolExecutor
from html import escape, unescape
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

import requests

from app.repositories.supabase_repository import SupabaseRepository
from app.services.technology_service import TechnologyService


class JobSearchService:
    BASE_URL = (
        "https://jobsearch.az/api-az/vacancies-az"
        "?hl=az&q=&posted_date=&seniority=&categories=1076&industries="
        "&ads=&location=&job_type=&salary=&order_by="
    )
    DETAIL_BASE_URL = "https://jobsearch.az/api-az/vacancies-az/"
    HEADERS = {"X-Requested-With": "XMLHttpRequest"}

    LIST_WORKERS = 4
    DETAIL_WORKERS = 40
    REQUEST_TIMEOUT = 20

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

    def __init__(self, repository: SupabaseRepository, technology_service: TechnologyService):
        self.repository = repository
        self.technology_service = technology_service

    @staticmethod
    def _normalize_id(value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _parse_salary(value):
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

    @staticmethod
    def _merge_phones(company_phones, top_phone) -> list[str]:
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

    @staticmethod
    def _json_list_or_none(value):
        return value if isinstance(value, list) else None

    @staticmethod
    def _json_obj_or_default(value):
        return value if isinstance(value, dict) else {}

    @staticmethod
    def _clean_html(text: str) -> str:
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
                    r"""(?i)\bhref\s*=\s*(\"([^\"]*)\"|'([^']*)'|([^\s>]+))""",
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

    def _clean_listing_item(self, item: dict) -> dict:
        cleaned = dict(item)
        for field in self.LIST_REMOVE_FIELDS:
            cleaned.pop(field, None)
        return cleaned

    def _clean_detail_item(self, detail: dict) -> dict:
        cleaned = dict(detail)
        for field in self.DETAIL_EXCLUDE_FIELDS:
            cleaned.pop(field, None)

        if isinstance(cleaned.get("text"), str):
            cleaned["text"] = self._clean_html(cleaned["text"])

        company = cleaned.get("company")
        if isinstance(company, dict):
            company = dict(company)
            for key in self.COMPANY_EXCLUDE_FIELDS:
                company.pop(key, None)
            if isinstance(company.get("text"), str):
                company["text"] = self._clean_html(company["text"])
            cleaned["company"] = company

        return cleaned

    def _merge_job_and_detail(self, job: dict, detail: dict | None) -> dict:
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

        phones = self._merge_phones(company_from_job.get("phones"), None)
        for phone in self._merge_phones(company_from_detail.get("phones"), detail.get("phone")):
            if phone not in phones:
                phones.append(phone)

        company["phones"] = phones
        merged["company"] = company

        return merged

    def _url_with_page(self, page: int) -> str:
        parsed = urlparse(self.BASE_URL)
        params = parse_qs(parsed.query, keep_blank_values=True)
        params["page"] = [str(page)]
        query = urlencode(params, doseq=True)
        return urlunparse(parsed._replace(query=query))

    def _fetch_page(self, page: int) -> tuple[int, dict]:
        response = requests.get(
            self._url_with_page(page),
            headers=self.HEADERS,
            timeout=self.REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        return page, response.json()

    def _scrape_listing_jobs(self) -> list[dict]:
        all_pages = []
        page = 1
        done = False

        while not done:
            batch_pages = [page + i for i in range(self.LIST_WORKERS)]
            with ThreadPoolExecutor(max_workers=self.LIST_WORKERS) as executor:
                batch_results = list(executor.map(self._fetch_page, batch_pages))

            batch_results.sort(key=lambda item: item[0])
            for _, data in batch_results:
                all_pages.append(data)
                if data.get("next") is None:
                    done = True
                    break

            page += self.LIST_WORKERS

        jobs: list[dict] = []
        for data in all_pages:
            items = data.get("items")
            if not isinstance(items, list):
                continue
            for item in items:
                if isinstance(item, dict):
                    jobs.append(self._clean_listing_item(item))

        return jobs

    def _fetch_detail_for_job(self, job: dict) -> tuple[int, dict] | None:
        slug = job.get("slug")
        if not isinstance(slug, str) or not slug.strip():
            return None

        job_id = self._normalize_id(job.get("id"))
        if job_id is None:
            return None

        try:
            response = requests.get(
                f"{self.DETAIL_BASE_URL}{slug}",
                headers=self.HEADERS,
                timeout=self.REQUEST_TIMEOUT,
            )
            response.raise_for_status()
            detail = response.json()
        except requests.RequestException as error:
            print(f"JobSearch detail fetch failed for slug={slug}: {error}")
            return None

        if not isinstance(detail, dict):
            return None

        return job_id, self._clean_detail_item(detail)

    def _merge_details_into_jobs(self, jobs: list[dict]) -> list[dict]:
        detail_by_id: dict[int, dict] = {}

        with ThreadPoolExecutor(max_workers=self.DETAIL_WORKERS) as executor:
            for result in executor.map(self._fetch_detail_for_job, jobs):
                if result is None:
                    continue
                job_id, detail = result
                detail_by_id[job_id] = detail

        merged_jobs = []
        for job in jobs:
            job_id = self._normalize_id(job.get("id"))
            merged_jobs.append(self._merge_job_and_detail(job, detail_by_id.get(job_id)))

        return merged_jobs

    def _save_to_database(self, jobs: list[dict]) -> int:
        if not self.repository.is_configured:
            print("JobSearch DB save skipped: missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
            return 0

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

            if title in company_payload_by_title:
                continue

            first_char = str(company.get("first_char") or title[0]).strip()[:1].lower()
            company_payload_by_title[title] = {
                "title": title,
                "logo": company.get("logo") if isinstance(company.get("logo"), str) else None,
                "logo_mini": company.get("logo_mini") if isinstance(company.get("logo_mini"), str) else None,
                "first_char": first_char,
                "text": company.get("text") if isinstance(company.get("text"), str) else None,
                "address": company.get("address") if isinstance(company.get("address"), str) else None,
                "phones": self._json_list_or_none(company.get("phones")),
                "sites": self._json_list_or_none(company.get("sites")),
                "email": self._json_list_or_none(company.get("email")),
                "cover": company.get("cover") if isinstance(company.get("cover"), str) else None,
                "coordinates": self._json_obj_or_default(company.get("coordinates")),
            }

        titles = list(company_payload_by_title.keys())
        company_map = self.repository.fetch_js_company_map(titles) if titles else {}
        missing_titles = [title for title in titles if title not in company_map]

        if missing_titles:
            self.repository.insert_js_companies([company_payload_by_title[title] for title in missing_titles])
            company_map = self.repository.fetch_js_company_map(titles)

        vacancies: list[dict] = []
        for job in jobs:
            if not isinstance(job, dict):
                continue

            company = job.get("company") if isinstance(job.get("company"), dict) else {}
            company_title = str(company.get("title", "")).strip()
            company_id = company_map.get(company_title)
            if company_id is None:
                continue

            vacancy_id = self._normalize_id(job.get("id"))
            title = job.get("title")
            created_at = job.get("created_at")
            slug = job.get("slug")

            if vacancy_id is None or not isinstance(title, str) or not isinstance(created_at, str) or not isinstance(slug, str):
                continue

            vacancies.append(
                {
                    "id": vacancy_id,
                    "title": title,
                    "created_at": created_at,
                    "slug": slug,
                    "company_id": company_id,
                    "salary": self._parse_salary(job.get("salary")),
                    "deadline_at": job.get("deadline_at"),
                    "text": job.get("text") if isinstance(job.get("text"), str) else None,
                    "tech_stack": self.technology_service.extract(
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
            return 0

        self.repository.upsert_js_vacancies(vacancies)
        return len(vacancies)

    def run(self) -> dict[str, int]:
        jobs = self._scrape_listing_jobs()
        jobs_with_details = self._merge_details_into_jobs(jobs)
        saved_count = self._save_to_database(jobs_with_details)

        print(f"JobSearch: scraped={len(jobs_with_details)}, saved={saved_count}")
        return {"scraped": len(jobs_with_details), "saved": saved_count}
