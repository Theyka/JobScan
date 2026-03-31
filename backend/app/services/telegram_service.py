from datetime import datetime, time, timedelta, timezone
from html import escape
from urllib.parse import urlparse
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import requests

from app.repositories.supabase_repository import SupabaseRepository


class TelegramService:
    API_BASE_URL = "https://api.telegram.org"
    DEFAULT_DIGEST_LIMIT = 5
    DEFAULT_TIMEZONE_LABEL = "Asia/Baku"
    FRONTEND_BASE_URL = "https://jobstats.theyka.net"

    def __init__(
        self,
        repository: SupabaseRepository,
        bot_token: str,
        channel_id: str,
        digest_limit: int = DEFAULT_DIGEST_LIMIT,
        bot_username: str = "",
        timezone_name: str = DEFAULT_TIMEZONE_LABEL,
    ):
        self.repository = repository
        self.bot_token = (bot_token or "").strip()
        self.channel_id = (channel_id or "").strip()
        self.digest_limit = max(1, int(digest_limit))
        self.bot_username = str(bot_username or "").strip().lstrip("@")
        self.timezone_name = str(timezone_name or self.DEFAULT_TIMEZONE_LABEL).strip()
        self.local_timezone = self._load_timezone(self.timezone_name)

    @property
    def is_configured(self) -> bool:
        return bool(self.bot_token and self.channel_id and self.repository.is_configured)

    @staticmethod
    def _load_timezone(name: str) -> ZoneInfo:
        try:
            return ZoneInfo(name)
        except ZoneInfoNotFoundError:
            print(f"Unknown timezone '{name}', falling back to UTC")
            return ZoneInfo("UTC")

    @staticmethod
    def _parse_datetime(value: str | None) -> datetime:
        if not isinstance(value, str) or not value.strip():
            return datetime.min.replace(tzinfo=timezone.utc)

        raw = value.strip().replace("Z", "+00:00")
        try:
            parsed = datetime.fromisoformat(raw)
        except ValueError:
            return datetime.min.replace(tzinfo=timezone.utc)

        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed

    @staticmethod
    def _format_datetime(value: str | None) -> str:
        parsed = TelegramService._parse_datetime(value)
        if parsed == datetime.min.replace(tzinfo=timezone.utc):
            return "Unknown"
        return parsed.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    @staticmethod
    def _format_deadline(value: str | None) -> str:
        raw = str(value or "").strip()
        if not raw:
            return ""

        parsed = TelegramService._parse_datetime(raw)
        if parsed != datetime.min.replace(tzinfo=timezone.utc):
            return parsed.strftime("%d %b %Y")

        for fmt in (
            "%d.%m.%Y",
            "%d/%m/%Y",
            "%d-%m-%Y",
            "%d %b %Y",
            "%d %B %Y",
            "%B %d, %Y",
            "%b %d, %Y",
        ):
            try:
                return datetime.strptime(raw, fmt).strftime("%d %b %Y")
            except ValueError:
                continue

        return raw

    @staticmethod
    def _format_salary(value) -> str:
        if value in (None, "", 0, "0"):
            return "göstərilməyib"
        try:
            parsed = int(value)
            if parsed <= 0:
                return "göstərilməyib"
            return f"{parsed:,} AZN".replace(",", " ")
        except (TypeError, ValueError):
            text = str(value).strip()
            return text or "göstərilməyib"

    @staticmethod
    def _format_tech_stack(value, limit: int | None = None) -> str:
        if not isinstance(value, list) or not value:
            return "-"
        items = [str(item).strip() for item in value if str(item).strip()]
        if limit is not None:
            items = items[:limit]
        return ", ".join(items) or "-"

    @staticmethod
    def _compact_location(value: str | None) -> str:
        if not isinstance(value, str) or not value.strip():
            return ""

        location = value.strip()
        if "," in location:
            location = location.split(",", 1)[0].strip()

        replacements = {
            "Bakı": "Baku",
            "Bakı şəhəri": "Baku",
            "Baku şəhəri": "Baku",
            "Sumqayıt": "Sumgayit",
        }
        return replacements.get(location, location)

    @staticmethod
    def _jobsearch_public_url(slug: str | None) -> str:
        if not isinstance(slug, str) or not slug.strip():
            return ""
        return f"{TelegramService.FRONTEND_BASE_URL}/vacancies/jobsearch/{slug.strip()}"

    @staticmethod
    def _glorri_public_url(slug: str | None) -> str:
        if not isinstance(slug, str) or not slug.strip():
            return ""
        return f"{TelegramService.FRONTEND_BASE_URL}/vacancies/glorri/{slug.strip()}"

    @staticmethod
    def _chat_id_kind(value: str) -> str:
        raw = (value or "").strip()
        if not raw:
            return "missing"
        if raw.startswith("-100") and raw[4:].isdigit():
            return "channel_id"
        if raw.startswith("@") and len(raw) > 1:
            return "username"
        if raw.lstrip("-").isdigit():
            return "numeric_chat_id"
        return "unknown"

    def _yesterday_window(self) -> tuple[datetime, datetime, datetime.date]:
        now_local = datetime.now(self.local_timezone)
        today_local = now_local.date()
        yesterday_local = today_local - timedelta(days=1)

        start_local = datetime.combine(yesterday_local, time.min, tzinfo=self.local_timezone)
        end_local = start_local + timedelta(days=1)

        return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc), yesterday_local

    @staticmethod
    def _to_iso_utc(value: datetime) -> str:
        return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

    def _was_published_yesterday(self, value: str | None, expected_date) -> bool:
        parsed = self._parse_datetime(value)
        if parsed == datetime.min.replace(tzinfo=timezone.utc):
            return False
        return parsed.astimezone(self.local_timezone).date() == expected_date

    @staticmethod
    def _is_supported_url(value: str | None) -> bool:
        if not isinstance(value, str) or not value.strip():
            return False

        parsed = urlparse(value.strip())
        return parsed.scheme in {"http", "https"} and bool(parsed.netloc)

    @staticmethod
    def _to_roman(value: int) -> str:
        numerals = (
            (1000, "M"),
            (900, "CM"),
            (500, "D"),
            (400, "CD"),
            (100, "C"),
            (90, "XC"),
            (50, "L"),
            (40, "XL"),
            (10, "X"),
            (9, "IX"),
            (5, "V"),
            (4, "IV"),
            (1, "I"),
        )

        number = max(1, int(value))
        result: list[str] = []
        for arabic, roman in numerals:
            while number >= arabic:
                result.append(roman)
                number -= arabic
        return "".join(result)

    @staticmethod
    def _render_title_line(index: int, title: str, url: str) -> str:
        prefix = f"<b>{TelegramService._to_roman(index)}.</b>"
        if TelegramService._is_supported_url(url):
            return (
                f'{prefix} <a href="{escape(url, quote=True)}"><b>{title}</b></a>'
            )
        return f"{prefix} <b>{title}</b>"

    def _normalize_jobsearch_jobs(self, limit: int) -> list[dict]:
        start_utc, end_utc, expected_date = self._yesterday_window()
        rows = self.repository.fetch_js_vacancies_between(
            self._to_iso_utc(start_utc),
            self._to_iso_utc(end_utc),
            limit,
        )
        company_map = self.repository.fetch_js_companies_by_ids(
            [row.get("company_id") for row in rows if isinstance(row, dict)]
        )

        jobs = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            if not self._was_published_yesterday(row.get("created_at"), expected_date):
                continue

            company_info = company_map.get(int(row.get("company_id"))) if row.get("company_id") is not None else {}
            company_title = company_info.get("title") if isinstance(company_info, dict) else ""
            company_address = company_info.get("address") if isinstance(company_info, dict) else ""

            jobs.append(
                {
                    "source": "JobSearch",
                    "title": row.get("title") if isinstance(row.get("title"), str) else "Untitled",
                    "company": company_title or "Unknown company",
                    "location": self._compact_location(company_address),
                    "employment_type": "",
                    "published_at": row.get("created_at"),
                    "deadline": row.get("deadline_at"),
                    "tech_stack": row.get("tech_stack"),
                    "salary": row.get("salary"),
                    "url": self._jobsearch_public_url(row.get("slug")),
                }
            )

        return jobs

    def _normalize_glorri_jobs(self, limit: int) -> list[dict]:
        start_utc, end_utc, expected_date = self._yesterday_window()
        rows = self.repository.fetch_glorri_vacancies_between(
            self._to_iso_utc(start_utc),
            self._to_iso_utc(end_utc),
            limit,
        )
        duplicate_ids = self.repository.fetch_duplicate_glorri_ids(
            [row.get("id") for row in rows if isinstance(row, dict)]
        )
        filtered_rows = [
            row for row in rows if isinstance(row, dict) and row.get("id") not in duplicate_ids
        ]
        company_map = self.repository.fetch_glorri_company_names_by_ids(
            [row.get("company_id") for row in filtered_rows if isinstance(row, dict)]
        )

        jobs = []
        for row in filtered_rows:
            if not self._was_published_yesterday(row.get("postedDate"), expected_date):
                continue
            vacancy_about = row.get("vacancy_about") if isinstance(row.get("vacancy_about"), dict) else {}
            jobs.append(
                {
                    "source": "Glorri",
                    "title": row.get("title") if isinstance(row.get("title"), str) else "Untitled",
                    "company": company_map.get(int(row.get("company_id"))) if row.get("company_id") is not None else "Unknown company",
                    "location": self._compact_location(row.get("location") if isinstance(row.get("location"), str) else ""),
                    "employment_type": row.get("type") if isinstance(row.get("type"), str) else "",
                    "published_at": row.get("postedDate"),
                    "deadline": vacancy_about.get("deadline") if isinstance(vacancy_about.get("deadline"), str) else "",
                    "tech_stack": row.get("tech_stack"),
                    "salary": vacancy_about.get("salary") if isinstance(vacancy_about.get("salary"), str) else None,
                    "url": self._glorri_public_url(row.get("slug")),
                }
            )

        return jobs

    def _latest_jobs(self) -> list[dict]:
        jobs = self._normalize_jobsearch_jobs(self.digest_limit) + self._normalize_glorri_jobs(self.digest_limit)
        jobs.sort(key=lambda item: self._parse_datetime(item.get("published_at")), reverse=True)
        return jobs[: self.digest_limit]

    def _build_message(self, jobs: list[dict]) -> str:
        if not jobs:
            return ""

        lines: list[str] = []
        for index, job in enumerate(jobs, start=1):
            title = escape(str(job.get("title") or "Untitled"))
            company = escape(str(job.get("company") or "Unknown company"))
            deadline = escape(self._format_deadline(job.get("deadline")))
            salary_value = self._format_salary(job.get("salary"))
            salary = escape(salary_value)
            url = str(job.get("url") or "").strip()

            lines.append(self._render_title_line(index, title, url))
            lines.append(f"🏢 {company}")
            if deadline:
                lines.append(f"📅 Son tarix: {deadline}")
            lines.append(f"💰 Maaş: {salary}")
            lines.append("")

        if self.bot_username:
            lines.append(
                "🤖 Əgər istəyinizə uyğun filterlənmiş vakansiyaları birbaşa Telegram vasitəsilə almaq istəyirsinizsə, "
                f"bu bot-a müraciət edin: @{escape(self.bot_username)}"
            )
        lines.append("✨ Vakansiyalar bu kanala avtomatik və gündəlik göndəriləcək.")

        return "\n".join(lines).strip()

    def preview_latest_jobs_digest(self) -> dict[str, int | str]:
        jobs = self._latest_jobs()
        message = self._build_message(jobs)
        return {
            "jobs": len(jobs),
            "message_length": len(message),
            "message": message,
        }

    def send_latest_jobs_digest(self) -> dict[str, int | bool]:
        if not self.is_configured:
            print("Telegram digest skipped: missing Telegram or Supabase configuration")
            return {"sent": False, "jobs": 0}

        preview = self.preview_latest_jobs_digest()
        jobs = int(preview["jobs"])
        message = str(preview["message"])

        if jobs == 0:
            print("Telegram digest skipped: no new vacancies")
            return {"sent": False, "jobs": 0}

        print(
            "Telegram digest payload: "
            f"jobs={jobs}, "
            f"message_length={preview['message_length']}, "
            f"chat_id_kind={self._chat_id_kind(self.channel_id)}"
        )

        response = requests.post(
            f"{self.API_BASE_URL}/bot{self.bot_token}/sendMessage",
            json={
                "chat_id": self.channel_id,
                "text": message,
                "parse_mode": "HTML",
                "disable_web_page_preview": True,
            },
            timeout=30,
        )
        try:
            response.raise_for_status()
        except requests.HTTPError as error:
            try:
                payload = response.json()
            except ValueError:
                payload = {}

            description = payload.get("description") if isinstance(payload, dict) else ""
            details = description or response.text.strip() or str(error)
            raise RuntimeError(f"Telegram API rejected sendMessage: {details}") from error

        print(f"Telegram digest sent: jobs={jobs}")
        return {"sent": True, "jobs": jobs}
