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

    def _fetch_by_ids(self, table: str, select: str, ids: list[int]) -> list[dict]:
        normalized_ids = sorted({int(value) for value in ids if value is not None})
        if not normalized_ids:
            return []

        rows: list[dict] = []
        for chunk in self._chunk_list(normalized_ids, 80):
            in_filter = "(" + ",".join(str(value) for value in chunk) + ")"
            response = self._get(
                table,
                {
                    "select": select,
                    "id": f"in.{in_filter}",
                },
            ).json()
            if isinstance(response, list):
                rows.extend(response)

        return rows

    def _fetch_latest(self, table: str, select: str, order_by: str, limit: int) -> list[dict]:
        response = self._get(
            table,
            {
                "select": select,
                "order": f"{order_by}.desc",
                "limit": str(max(1, int(limit))),
            },
        ).json()
        return response if isinstance(response, list) else []

    def _fetch_latest_with_filters(
        self,
        table: str,
        select: str,
        order_by: str,
        limit: int,
        filters: list[str],
    ) -> list[dict]:
        params = {
            "select": select,
            "order": f"{order_by}.desc",
            "limit": str(max(1, int(limit))),
        }
        if filters:
            params["and"] = "(" + ",".join(filters) + ")"

        response = self._get(table, params).json()
        return response if isinstance(response, list) else []

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

    def _patch(self, table: str, payload: dict, params: dict[str, str]) -> requests.Response:
        response = requests.patch(
            f"{self.base_url}/rest/v1/{table}",
            headers=self._headers(prefer="return=representation"),
            params=params,
            json=payload,
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

    # Telegram digest methods
    def fetch_latest_js_vacancies(self, limit: int) -> list[dict]:
        return self._fetch_latest(
            "js_vacancies",
            "id,title,created_at,slug,salary,deadline_at,company_id,tech_stack",
            "created_at",
            limit,
        )

    def fetch_js_vacancies_between(self, start_iso: str, end_iso: str, limit: int) -> list[dict]:
        return self._fetch_latest_with_filters(
            "js_vacancies",
            "id,title,created_at,slug,salary,deadline_at,company_id,tech_stack",
            "created_at",
            limit,
            [f"created_at.gte.{start_iso}", f"created_at.lt.{end_iso}"],
        )

    def fetch_latest_glorri_vacancies(self, limit: int) -> list[dict]:
        return self._fetch_latest(
            "glorri_vacancies",
            "id,title,slug,postedDate,detail_url,location,type,vacancy_about,company_id,tech_stack",
            "postedDate",
            limit,
        )

    def fetch_glorri_vacancies_between(self, start_iso: str, end_iso: str, limit: int) -> list[dict]:
        return self._fetch_latest_with_filters(
            "glorri_vacancies",
            "id,title,slug,postedDate,detail_url,location,type,vacancy_about,company_id,tech_stack",
            "postedDate",
            limit,
            [f"postedDate.gte.{start_iso}", f"postedDate.lt.{end_iso}"],
        )

    def fetch_js_companies_by_ids(self, ids: list[int]) -> dict[int, dict]:
        rows = self._fetch_by_ids("js_companies", "id,title,address", ids)
        company_map: dict[int, dict] = {}
        for row in rows:
            company_id = row.get("id")
            title = row.get("title")
            if company_id is None or not isinstance(title, str):
                continue
            company_map[int(company_id)] = {
                "title": title,
                "address": row.get("address") if isinstance(row.get("address"), str) else "",
            }
        return company_map

    def fetch_glorri_company_names_by_ids(self, ids: list[int]) -> dict[int, str]:
        rows = self._fetch_by_ids("glorri_companies", "id,name", ids)
        company_map: dict[int, str] = {}
        for row in rows:
            company_id = row.get("id")
            name = row.get("name")
            if company_id is None or not isinstance(name, str):
                continue
            company_map[int(company_id)] = name
        return company_map

    def fetch_duplicate_glorri_ids(self, ids: list[int]) -> set[int]:
        normalized_ids = sorted({int(value) for value in ids if value is not None})
        if not normalized_ids:
            return set()

        duplicate_ids: set[int] = set()
        for chunk in self._chunk_list(normalized_ids, 80):
            in_filter = "(" + ",".join(str(value) for value in chunk) + ")"
            rows = self._get(
                "duplicate_jobs",
                {
                    "select": "glorri_id",
                    "glorri_id": f"in.{in_filter}",
                },
            ).json()
            if not isinstance(rows, list):
                continue
            for row in rows:
                glorri_id = row.get("glorri_id")
                if glorri_id is not None:
                    duplicate_ids.add(int(glorri_id))

        return duplicate_ids

    def fetch_duplicate_jobsearch_ids(self, ids: list[int]) -> set[int]:
        normalized_ids = sorted({int(value) for value in ids if value is not None})
        if not normalized_ids:
            return set()

        duplicate_ids: set[int] = set()
        for chunk in self._chunk_list(normalized_ids, 80):
            in_filter = "(" + ",".join(str(value) for value in chunk) + ")"
            rows = self._get(
                "duplicate_jobs",
                {
                    "select": "jobsearch_id",
                    "jobsearch_id": f"in.{in_filter}",
                },
            ).json()
            if not isinstance(rows, list):
                continue
            for row in rows:
                jobsearch_id = row.get("jobsearch_id")
                if jobsearch_id is not None:
                    duplicate_ids.add(int(jobsearch_id))

        return duplicate_ids

    def fetch_all_js_vacancies_for_bot(self) -> list[dict]:
        rows = self._fetch_all(
            "js_vacancies",
            "id,title,created_at,slug,salary,deadline_at,company_id,tech_stack",
            order_by="created_at",
        )
        rows.reverse()
        return rows

    def fetch_all_glorri_vacancies_for_bot(self) -> list[dict]:
        rows = self._fetch_all(
            "glorri_vacancies",
            "id,title,slug,postedDate,detail_url,location,type,vacancy_about,company_id,tech_stack",
            order_by="postedDate",
        )
        rows.reverse()
        return rows

    # Telegram bot methods
    def fetch_telegram_user(self, chat_id: int) -> dict | None:
        rows = self._get(
            "telegram_user_settings",
            {
                "select": "*",
                "chat_id": f"eq.{int(chat_id)}",
                "limit": "1",
            },
        ).json()
        if isinstance(rows, list) and rows:
            return rows[0]
        return None

    def upsert_telegram_user(self, payload: dict):
        if not payload:
            return
        self._post(
            "telegram_user_settings",
            payload,
            prefer="resolution=merge-duplicates,return=representation",
            params={"on_conflict": "chat_id"},
        )

    def update_telegram_user(self, chat_id: int, payload: dict) -> dict | None:
        if not payload:
            return self.fetch_telegram_user(chat_id)
        rows = self._patch(
            "telegram_user_settings",
            payload,
            {"chat_id": f"eq.{int(chat_id)}"},
        ).json()
        if isinstance(rows, list) and rows:
            return rows[0]
        return None

    def fetch_active_telegram_users(self) -> list[dict]:
        rows = self._get(
            "telegram_user_settings",
            {
                "select": "*",
                "active": "eq.true",
                "onboarding_step": "eq.completed",
                "order": "updated_at.asc",
            },
        ).json()
        return rows if isinstance(rows, list) else []
