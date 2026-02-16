import requests


class SupabaseRepository:
    def __init__(self, base_url: str, service_key: str, timeout: int = 60):
        self.base_url = (base_url or "").rstrip("/")
        self.service_key = service_key or ""
        self.timeout = timeout

    @property
    def is_configured(self) -> bool:
        return bool(self.base_url and self.service_key)

    def _headers(self, prefer: str | None = None) -> dict[str, str]:
        headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        return headers

    def _get(self, table: str, params: dict[str, str]) -> requests.Response:
        response = requests.get(
            f"{self.base_url}/rest/v1/{table}",
            headers=self._headers(),
            params=params,
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response

    def _post(
        self,
        table: str,
        payload,
        prefer: str,
        params: dict[str, str] | None = None,
    ) -> requests.Response:
        response = requests.post(
            f"{self.base_url}/rest/v1/{table}",
            headers=self._headers(prefer),
            params=params,
            json=payload,
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response

    def _delete(self, table: str, params: dict[str, str]) -> requests.Response:
        response = requests.delete(
            f"{self.base_url}/rest/v1/{table}",
            headers=self._headers(prefer="return=minimal"),
            params=params,
            timeout=self.timeout,
        )
        response.raise_for_status()
        return response

    def _fetch_all(self, table: str, select: str, order_by: str = "id", page_size: int = 1000) -> list[dict]:
        rows: list[dict] = []
        offset = 0

        while True:
            chunk = self._get(
                table,
                {
                    "select": select,
                    "order": f"{order_by}.asc",
                    "limit": str(page_size),
                    "offset": str(offset),
                },
            ).json()

            if not isinstance(chunk, list) or not chunk:
                break

            rows.extend(chunk)
            if len(chunk) < page_size:
                break

            offset += page_size

        return rows

    @staticmethod
    def _chunk_list(values: list, size: int):
        for i in range(0, len(values), size):
            yield values[i : i + size]

    @staticmethod
    def _quote_for_in(value: str) -> str:
        return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'

    # JobSearch methods
    def fetch_js_company_map(self, titles: list[str]) -> dict[str, int]:
        company_map: dict[str, int] = {}
        for chunk in self._chunk_list(titles, 80):
            in_filter = "(" + ",".join(self._quote_for_in(title) for title in chunk) + ")"
            rows = self._get(
                "js_companies",
                {"select": "id,title", "title": f"in.{in_filter}"},
            ).json()
            if not isinstance(rows, list):
                continue
            for row in rows:
                title = row.get("title")
                company_id = row.get("id")
                if isinstance(title, str) and company_id is not None:
                    company_map[title] = int(company_id)
        return company_map

    def insert_js_companies(self, companies_payload: list[dict]):
        if not companies_payload:
            return
        self._post(
            "js_companies",
            companies_payload,
            prefer="return=representation",
        )

    def upsert_js_vacancies(self, vacancies_payload: list[dict]):
        if not vacancies_payload:
            return
        for chunk in self._chunk_list(vacancies_payload, 500):
            self._post(
                "js_vacancies",
                chunk,
                prefer="resolution=merge-duplicates,return=minimal",
                params={"on_conflict": "id"},
            )

    # Glorri methods
    @staticmethod
    def glorri_company_key(company: dict) -> str:
        slug = company.get("slug") if isinstance(company.get("slug"), str) else ""
        name = company.get("name") if isinstance(company.get("name"), str) else ""
        slug = slug.strip()
        name = name.strip()
        if slug:
            return f"slug:{slug}"
        return f"name:{name}"

    def fetch_glorri_company_map(self, companies: list[dict]) -> dict[str, int]:
        company_map: dict[str, int] = {}

        slugs = sorted(
            {
                company.get("slug", "").strip()
                for company in companies
                if isinstance(company.get("slug"), str) and company.get("slug", "").strip()
            }
        )

        names_without_slug = sorted(
            {
                company.get("name", "").strip()
                for company in companies
                if isinstance(company.get("name"), str)
                and company.get("name", "").strip()
                and not (isinstance(company.get("slug"), str) and company.get("slug", "").strip())
            }
        )

        for chunk in self._chunk_list(slugs, 80):
            in_filter = "(" + ",".join(self._quote_for_in(value) for value in chunk) + ")"
            rows = self._get(
                "glorri_companies",
                {"select": "id,slug,name", "slug": f"in.{in_filter}"},
            ).json()
            if not isinstance(rows, list):
                continue
            for row in rows:
                company_id = row.get("id")
                if company_id is None:
                    continue
                key = self.glorri_company_key(row)
                company_map[key] = int(company_id)

        for chunk in self._chunk_list(names_without_slug, 80):
            in_filter = "(" + ",".join(self._quote_for_in(value) for value in chunk) + ")"
            rows = self._get(
                "glorri_companies",
                {"select": "id,slug,name", "name": f"in.{in_filter}"},
            ).json()
            if not isinstance(rows, list):
                continue
            for row in rows:
                company_id = row.get("id")
                if company_id is None:
                    continue
                key = self.glorri_company_key(row)
                company_map[key] = int(company_id)

        return company_map

    def insert_glorri_companies(self, companies_payload: list[dict]):
        if not companies_payload:
            return
        self._post(
            "glorri_companies",
            companies_payload,
            prefer="return=representation",
        )

    def fetch_existing_glorri_vacancy_slugs(self, slugs: list[str]) -> set[str]:
        existing: set[str] = set()
        for chunk in self._chunk_list(slugs, 80):
            in_filter = "(" + ",".join(self._quote_for_in(value) for value in chunk) + ")"
            rows = self._get(
                "glorri_vacancies",
                {"select": "slug", "slug": f"in.{in_filter}"},
            ).json()
            if not isinstance(rows, list):
                continue
            for row in rows:
                slug = row.get("slug")
                if isinstance(slug, str) and slug:
                    existing.add(slug)
        return existing

    def insert_glorri_vacancies(self, vacancies_payload: list[dict]):
        if not vacancies_payload:
            return
        for chunk in self._chunk_list(vacancies_payload, 200):
            self._post(
                "glorri_vacancies",
                chunk,
                prefer="return=minimal",
            )

    # Duplicate detection methods
    def fetch_js_companies_for_duplicate_scan(self) -> list[dict]:
        return self._fetch_all("js_companies", "id,title")

    def fetch_glorri_companies_for_duplicate_scan(self) -> list[dict]:
        return self._fetch_all("glorri_companies", "id,name")

    def fetch_js_vacancies_for_duplicate_scan(self) -> list[dict]:
        return self._fetch_all("js_vacancies", "id,title,text,tech_stack,company_id")

    def fetch_glorri_vacancies_for_duplicate_scan(self) -> list[dict]:
        return self._fetch_all("glorri_vacancies", "id,title,text,tech_stack,company_id")

    def replace_duplicate_jobs(self, duplicate_payload: list[dict]):
        self._delete("duplicate_jobs", {"glorri_id": "not.is.null"})

        if not duplicate_payload:
            return

        for chunk in self._chunk_list(duplicate_payload, 500):
            self._post(
                "duplicate_jobs",
                chunk,
                prefer="resolution=merge-duplicates,return=minimal",
                params={"on_conflict": "glorri_id"},
            )
