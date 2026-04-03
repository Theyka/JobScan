from __future__ import annotations

import json
import time
from datetime import date, datetime, time as dt_time, timedelta, timezone
from html import escape

import requests

from app.models.technologies import TECHNOLOGIES
from app.services.telegram_service import TelegramService


class TelegramBotService(TelegramService):
    SUPPORTED_LANGUAGES = ("az", "en", "ru")
    DEFAULT_LANGUAGE = "az"
    CALLBACK_PREFIX_LANGUAGE = "lang"
    CALLBACK_PREFIX_SETTINGS = "settings"
    CALLBACK_PREFIX_TECH = "tech"
    CALLBACK_PREFIX_STATUS = "status"
    CALLBACK_PREFIX_VIEW = "view"
    VIEW_CONTEXT_BROWSE = "browse"
    VIEW_CONTEXT_DAILY = "daily"
    TECH_PAGE_SIZE = 8
    VIEW_PAGE_SIZE = 5
    DETAIL_PAGE_SIZE = 6
    UPDATE_TIMEOUT_SECONDS = 45
    RETRY_DELAY_SECONDS = 5
    MAX_DAILY_FETCH = 200

    LANGUAGE_LABELS = {
        "az": "🇦🇿 Azərbaycan",
        "en": "🇬🇧 English",
        "ru": "🇷🇺 Русский",
    }

    TEXTS = {
        "az": {
            "welcome": "Salam. Davam etmək üçün dili seçin.",
            "language_saved": (
                "Dil seçimi yadda saxlanıldı. Əgər vakansiyanın təsviri seçilən dildə mövcud deyilsə, "
                "avtomatik tərcümə Google Translate vasitəsilə həyata keçiriləcək."
            ),
            "step_two": "Step 2/2 — Sizə uyğun stack və texnologiyaları seçin.",
            "tech_help": "Seçim etmək üçün düymələrə toxunun. Bitir düyməsi ilə yadda saxlanılır.",
            "settings_hint": "Tənzimləmələri yenidən dəyişmək üçün /settings yazın.",
            "settings_title": "Cari tənzimləmələriniz:",
            "language": "Dil",
            "technologies": "Texnologiyalar",
            "status": "Status",
            "active": "aktiv",
            "paused": "dayandırılıb",
            "all_technologies": "Hamısı",
            "saved": "Tənzimləmələr yadda saxlanıldı.",
            "paused_message": "Bildirişlər dayandırıldı. Yenidən başlatmaq üçün /settings istifadə edin.",
            "resumed_message": "Bildirişlər yenidən aktiv edildi.",
            "empty_digest": "Dünən seçdiyiniz stack üzrə yeni vakansiya tapılmadı.",
            "vacancy_header": "🚀 Yeni Vakansiya:",
            "position": "👨‍💻 Vəzifə",
            "company": "🏢 Şirkət",
            "location": "📍 Məkan",
            "employment_type": "💼 Employment type",
            "salary": "💰 Maaş",
            "deadline": "📅 Deadline",
            "stack": "🧰 Stack & Texnologiyalar",
            "not_specified": "göstərilməyib",
            "change_language": "Dili dəyiş",
            "change_stack": "Stack seç",
            "view_vacancies": "Vakansiyalara bax",
            "pause": "Dayandır",
            "resume": "Yenidən aktiv et",
            "done": "Bitir",
            "clear": "Təmizlə",
            "back": "Geri",
            "next": "Növbəti",
            "previous": "Əvvəlki",
            "vacancies_sent": "Sizə uyğun vakansiyalar göndərildi.",
            "browse_vacancies": "Sizə uyğun vakansiyalar:",
            "daily_digest": "Dünən sizə uyğun tapılan vakansiyalar:",
            "page": "Səhifə",
            "open_vacancy": "Vakansiyanı aç",
        },
        "en": {
            "welcome": "Hello. Select a language to continue.",
            "language_saved": (
                "Your language was saved. If a vacancy description is not available in the selected language, "
                "it will be translated automatically via Google Translate."
            ),
            "step_two": "Step 2/2 — Choose the stack and technologies that match you.",
            "tech_help": "Tap buttons to select technologies. Use Done to save.",
            "settings_hint": "Use /settings any time to update your preferences.",
            "settings_title": "Your current settings:",
            "language": "Language",
            "technologies": "Technologies",
            "status": "Status",
            "active": "active",
            "paused": "paused",
            "all_technologies": "All",
            "saved": "Settings saved.",
            "paused_message": "Notifications were paused. Use /settings to enable them again.",
            "resumed_message": "Notifications were enabled again.",
            "empty_digest": "No new vacancies matched your stack yesterday.",
            "vacancy_header": "🚀 New Vacancy:",
            "position": "👨‍💻 Position",
            "company": "🏢 Company",
            "location": "📍 Location",
            "employment_type": "💼 Employment type",
            "salary": "💰 Salary",
            "deadline": "📅 Deadline",
            "stack": "🧰 Stack & Technologies",
            "not_specified": "not specified",
            "change_language": "Change language",
            "change_stack": "Choose stack",
            "view_vacancies": "View vacancies",
            "pause": "Pause",
            "resume": "Resume",
            "done": "Done",
            "clear": "Clear",
            "back": "Back",
            "next": "Next",
            "previous": "Previous",
            "vacancies_sent": "Matching vacancies were sent to you.",
            "browse_vacancies": "Vacancies matching your stack:",
            "daily_digest": "Vacancies matching you from yesterday:",
            "page": "Page",
            "open_vacancy": "Open vacancy",
        },
        "ru": {
            "welcome": "Здравствуйте. Выберите язык.",
            "language_saved": (
                "Язык сохранён. Если описание вакансии недоступно на выбранном языке, "
                "будет использован автоматический перевод через Google Translate."
            ),
            "step_two": "Шаг 2/2 — Выберите подходящие технологии и стек.",
            "tech_help": "Нажимайте кнопки для выбора. Используйте Done для сохранения.",
            "settings_hint": "Используйте /settings, чтобы изменить настройки в любой момент.",
            "settings_title": "Ваши текущие настройки:",
            "language": "Язык",
            "technologies": "Технологии",
            "status": "Статус",
            "active": "активно",
            "paused": "остановлено",
            "all_technologies": "Все",
            "saved": "Настройки сохранены.",
            "paused_message": "Уведомления остановлены. Используйте /settings для повторного включения.",
            "resumed_message": "Уведомления снова включены.",
            "empty_digest": "Вчера не было новых вакансий по выбранному стеку.",
            "vacancy_header": "🚀 Новая вакансия:",
            "position": "👨‍💻 Позиция",
            "company": "🏢 Компания",
            "location": "📍 Локация",
            "employment_type": "💼 Employment type",
            "salary": "💰 Зарплата",
            "deadline": "📅 Deadline",
            "stack": "🧰 Stack & Technologies",
            "not_specified": "не указано",
            "change_language": "Изменить язык",
            "change_stack": "Выбрать стек",
            "view_vacancies": "Посмотреть вакансии",
            "pause": "Остановить",
            "resume": "Возобновить",
            "done": "Готово",
            "clear": "Очистить",
            "back": "Назад",
            "next": "Далее",
            "previous": "Назад",
            "vacancies_sent": "Подходящие вакансии отправлены.",
            "browse_vacancies": "Вакансии по вашему стеку:",
            "daily_digest": "Вакансии за вчера по вашему стеку:",
            "page": "Страница",
            "open_vacancy": "Открыть вакансию",
        },
    }

    def __init__(self, repository, bot_token: str, digest_limit: int, timezone_name: str, bot_username: str = ""):
        super().__init__(repository, bot_token, "", digest_limit, bot_username, timezone_name)
        self.tech_options = sorted(TECHNOLOGIES.keys())
        self._update_offset: int | None = None

    @property
    def is_bot_configured(self) -> bool:
        return bool(self.bot_token and self.repository.is_configured)

    def _text(self, language: str, key: str) -> str:
        lang = language if language in self.TEXTS else self.DEFAULT_LANGUAGE
        return self.TEXTS[lang][key]

    @staticmethod
    def _normalize_language(value: str | None) -> str:
        raw = str(value or "").strip().lower()
        return raw if raw in TelegramBotService.SUPPORTED_LANGUAGES else TelegramBotService.DEFAULT_LANGUAGE

    @staticmethod
    def _normalize_technologies(value) -> list[str]:
        if not isinstance(value, list):
            return []
        seen: set[str] = set()
        result: list[str] = []
        for item in value:
            tech = str(item).strip()
            if not tech or tech in seen:
                continue
            seen.add(tech)
            result.append(tech)
        return result

    def _build_language_keyboard(self) -> dict:
        rows = []
        for code in self.SUPPORTED_LANGUAGES:
            rows.append([
                {"text": self.LANGUAGE_LABELS[code], "callback_data": f"{self.CALLBACK_PREFIX_LANGUAGE}:{code}"}
            ])
        return {"inline_keyboard": rows}

    def _build_settings_keyboard(self, language: str, active: bool) -> dict:
        return {
            "inline_keyboard": [
                [
                    {
                        "text": self._text(language, "change_language"),
                        "callback_data": f"{self.CALLBACK_PREFIX_SETTINGS}:language",
                    },
                    {
                        "text": self._text(language, "change_stack"),
                        "callback_data": f"{self.CALLBACK_PREFIX_SETTINGS}:tech:0",
                    },
                ],
                [
                    {
                        "text": self._text(language, "view_vacancies"),
                        "callback_data": f"{self.CALLBACK_PREFIX_VIEW}:vacancies",
                    }
                ],
                [
                    {
                        "text": self._text(language, "pause") if active else self._text(language, "resume"),
                        "callback_data": f"{self.CALLBACK_PREFIX_STATUS}:{'pause' if active else 'resume'}",
                    }
                ],
            ]
        }

    def _build_view_keyboard(
        self,
        language: str,
        page: int,
        total_pages: int,
        context: str,
        date_token: str | None = None,
    ) -> dict | None:
        rows: list[list[dict]] = []
        nav_row: list[dict] = []

        def callback_data(target_page: int) -> str:
            if context == self.VIEW_CONTEXT_DAILY and date_token:
                return f"{self.CALLBACK_PREFIX_VIEW}:{context}:{date_token}:{target_page}"
            return f"{self.CALLBACK_PREFIX_VIEW}:{context}:{target_page}"

        if page > 0:
            nav_row.append(
                {
                    "text": self._text(language, "previous"),
                    "callback_data": callback_data(page - 1),
                }
            )
        if page < total_pages - 1:
            nav_row.append(
                {
                    "text": self._text(language, "next"),
                    "callback_data": callback_data(page + 1),
                }
            )
        if nav_row:
            rows.append(nav_row)
        return {"inline_keyboard": rows} if rows else None

    def _build_tech_keyboard(self, language: str, selected: list[str], page: int) -> dict:
        total_pages = max(1, (len(self.tech_options) + self.TECH_PAGE_SIZE - 1) // self.TECH_PAGE_SIZE)
        current_page = min(max(0, int(page)), total_pages - 1)
        start = current_page * self.TECH_PAGE_SIZE
        page_items = self.tech_options[start : start + self.TECH_PAGE_SIZE]
        selected_set = set(selected)

        rows: list[list[dict]] = []
        current_row: list[dict] = []
        for tech in page_items:
            marker = "✅ " if tech in selected_set else "⬜️ "
            current_row.append(
                {
                    "text": f"{marker}{tech}",
                    "callback_data": f"{self.CALLBACK_PREFIX_TECH}:toggle:{current_page}:{self.tech_options.index(tech)}",
                }
            )
            if len(current_row) == 2:
                rows.append(current_row)
                current_row = []
        if current_row:
            rows.append(current_row)

        nav_row: list[dict] = []
        if current_page > 0:
            nav_row.append(
                {
                    "text": self._text(language, "previous"),
                    "callback_data": f"{self.CALLBACK_PREFIX_TECH}:page:{current_page - 1}",
                }
            )
        if current_page < total_pages - 1:
            nav_row.append(
                {
                    "text": self._text(language, "next"),
                    "callback_data": f"{self.CALLBACK_PREFIX_TECH}:page:{current_page + 1}",
                }
            )
        if nav_row:
            rows.append(nav_row)

        rows.append(
            [
                {"text": self._text(language, "clear"), "callback_data": f"{self.CALLBACK_PREFIX_TECH}:clear:{current_page}"},
                {"text": self._text(language, "done"), "callback_data": f"{self.CALLBACK_PREFIX_TECH}:done"},
            ]
        )
        rows.append(
            [
                {"text": self._text(language, "change_language"), "callback_data": f"{self.CALLBACK_PREFIX_SETTINGS}:language"}
            ]
        )
        return {"inline_keyboard": rows}

    def _send_api_request(self, method: str, payload: dict | None = None) -> dict:
        response = requests.post(
            f"{self.API_BASE_URL}/bot{self.bot_token}/{method}",
            json=payload or {},
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        if not data.get("ok"):
            raise RuntimeError(data.get("description") or f"Telegram method failed: {method}")
        return data

    def _send_message(self, chat_id: int, text: str, reply_markup: dict | None = None):
        payload = {
            "chat_id": int(chat_id),
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        }
        if reply_markup is not None:
            payload["reply_markup"] = reply_markup
        self._send_api_request("sendMessage", payload)

    def _edit_message(self, chat_id: int, message_id: int, text: str, reply_markup: dict | None = None):
        payload = {
            "chat_id": int(chat_id),
            "message_id": int(message_id),
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        }
        if reply_markup is not None:
            payload["reply_markup"] = reply_markup
        self._send_api_request("editMessageText", payload)

    def _answer_callback(self, callback_query_id: str, text: str = ""):
        payload = {"callback_query_id": callback_query_id}
        if text:
            payload["text"] = text
        self._send_api_request("answerCallbackQuery", payload)

    def _get_updates(self) -> list[dict]:
        response = requests.get(
            f"{self.API_BASE_URL}/bot{self.bot_token}/getUpdates",
            params={
                "timeout": self.UPDATE_TIMEOUT_SECONDS,
                "offset": self._update_offset,
                "allowed_updates": json.dumps(["message", "callback_query"]),
            },
            timeout=self.UPDATE_TIMEOUT_SECONDS + 10,
        )
        response.raise_for_status()
        data = response.json()
        if not data.get("ok"):
            return []
        return data.get("result", []) if isinstance(data.get("result"), list) else []

    def _base_user_payload(self, chat: dict, user: dict | None = None) -> dict:
        sender = user if isinstance(user, dict) else chat
        return {
            "chat_id": int(chat.get("id")),
            "username": sender.get("username") if isinstance(sender.get("username"), str) else None,
            "first_name": sender.get("first_name") if isinstance(sender.get("first_name"), str) else None,
            "language_code": self.DEFAULT_LANGUAGE,
            "selected_technologies": [],
            "onboarding_step": "language",
            "active": True,
        }

    def _get_or_create_user(self, chat: dict, user: dict | None = None) -> dict:
        chat_id = int(chat.get("id"))
        existing = self.repository.fetch_telegram_user(chat_id)
        if existing:
            return existing
        payload = self._base_user_payload(chat, user)
        self.repository.upsert_telegram_user(payload)
        created = self.repository.fetch_telegram_user(chat_id)
        return created or payload

    def _settings_summary(self, user: dict) -> str:
        language = self._normalize_language(user.get("language_code"))
        selected = self._normalize_technologies(user.get("selected_technologies"))
        selected_text = ", ".join(selected[:10]) if selected else self._text(language, "all_technologies")
        status_text = self._text(language, "active") if user.get("active", True) else self._text(language, "paused")
        return "\n".join(
            [
                self._text(language, "settings_title"),
                f"• {self._text(language, 'language')}: {self.LANGUAGE_LABELS.get(language, language)}",
                f"• {self._text(language, 'technologies')}: {escape(selected_text)}",
                f"• {self._text(language, 'status')}: {status_text}",
                "",
                self._text(language, "settings_hint"),
            ]
        )

    def _send_language_prompt(self, chat_id: int):
        self._send_message(chat_id, self._text(self.DEFAULT_LANGUAGE, "welcome"), self._build_language_keyboard())

    def _send_tech_prompt(self, chat_id: int, language: str, selected: list[str], page: int = 0, message_id: int | None = None):
        text = "\n\n".join(
            [
                self._text(language, "step_two"),
                self._text(language, "tech_help"),
            ]
        )
        keyboard = self._build_tech_keyboard(language, selected, page)
        if message_id is None:
            self._send_message(chat_id, text, keyboard)
        else:
            self._edit_message(chat_id, message_id, text, keyboard)

    def _save_language(self, user: dict, language: str, onboarding_step: str | None = None) -> dict:
        chat_id = int(user["chat_id"])
        next_step = onboarding_step or str(user.get("onboarding_step") or "language")
        self.repository.upsert_telegram_user(
            {
                "chat_id": chat_id,
                "username": user.get("username"),
                "first_name": user.get("first_name"),
                "language_code": language,
                "selected_technologies": self._normalize_technologies(user.get("selected_technologies")),
                "onboarding_step": next_step,
                "active": True,
            }
        )
        return self.repository.fetch_telegram_user(chat_id) or user

    def _toggle_technology(self, user: dict, tech_index: int) -> dict:
        chat_id = int(user["chat_id"])
        selected = self._normalize_technologies(user.get("selected_technologies"))
        if 0 <= tech_index < len(self.tech_options):
            tech = self.tech_options[tech_index]
            if tech in selected:
                selected = [item for item in selected if item != tech]
            else:
                selected.append(tech)
        self.repository.update_telegram_user(
            chat_id,
            {"selected_technologies": selected, "onboarding_step": "tech", "active": True},
        )
        return self.repository.fetch_telegram_user(chat_id) or user

    def _clear_technologies(self, user: dict) -> dict:
        chat_id = int(user["chat_id"])
        self.repository.update_telegram_user(chat_id, {"selected_technologies": [], "onboarding_step": "tech", "active": True})
        return self.repository.fetch_telegram_user(chat_id) or user

    def _complete_onboarding(self, user: dict) -> dict:
        chat_id = int(user["chat_id"])
        self.repository.update_telegram_user(chat_id, {"onboarding_step": "completed", "active": True})
        return self.repository.fetch_telegram_user(chat_id) or user

    def _set_active(self, user: dict, active: bool) -> dict:
        chat_id = int(user["chat_id"])
        self.repository.update_telegram_user(chat_id, {"active": active})
        return self.repository.fetch_telegram_user(chat_id) or user

    def _render_user_vacancy(self, job: dict, language: str) -> str:
        tech_stack = self._format_tech_stack(job.get("tech_stack"), limit=5)
        salary = self._format_salary(job.get("salary"))
        deadline = self._format_deadline(job.get("deadline")) or self._text(language, "not_specified")
        location = str(job.get("location") or "").strip() or self._text(language, "not_specified")
        lines = [
            f"{self._text(language, 'position')}: {escape(str(job.get('title') or 'Untitled'))}",
            f"{self._text(language, 'company')}: {escape(str(job.get('company') or 'Unknown company'))}",
            f"{self._text(language, 'location')}: {escape(location)}",
            f"{self._text(language, 'salary')}: {escape(salary)}",
            f"{self._text(language, 'deadline')}: {escape(deadline)}",
            f"{self._text(language, 'stack')}: {escape(tech_stack if tech_stack != '-' else self._text(language, 'not_specified'))}",
        ]
        url = str(job.get("url") or "").strip()
        if self._is_supported_url(url):
            lines.append(f'<a href="{escape(url, quote=True)}">Open vacancy</a>')
        return "\n".join(lines)

    @staticmethod
    def _parse_date_token(value: str | None) -> date | None:
        raw = str(value or "").strip()
        if not raw:
            return None
        try:
            return date.fromisoformat(raw)
        except ValueError:
            return None

    def _date_window(self, target_date: date) -> tuple[datetime, datetime]:
        start_local = datetime.combine(target_date, dt_time.min, tzinfo=self.local_timezone)
        end_local = start_local + timedelta(days=1)
        return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)

    def _collect_jobs_for_date(self, target_date: date) -> list[dict]:
        fetch_limit = max(self.MAX_DAILY_FETCH, self.digest_limit)
        start_utc, end_utc = self._date_window(target_date)

        js_rows = self.repository.fetch_js_vacancies_between(
            self._to_iso_utc(start_utc),
            self._to_iso_utc(end_utc),
            fetch_limit,
        )
        duplicate_js_ids = self.repository.fetch_duplicate_jobsearch_ids(
            [row.get("id") for row in js_rows if isinstance(row, dict)]
        )
        js_rows = [row for row in js_rows if isinstance(row, dict) and row.get("id") not in duplicate_js_ids]
        js_company_map = self.repository.fetch_js_companies_by_ids(
            [row.get("company_id") for row in js_rows if isinstance(row, dict)]
        )

        js_jobs: list[dict] = []
        for row in js_rows:
            company_info = js_company_map.get(int(row.get("company_id"))) if row.get("company_id") is not None else {}
            company_title = company_info.get("title") if isinstance(company_info, dict) else ""
            company_address = company_info.get("address") if isinstance(company_info, dict) else ""
            js_jobs.append(
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

        glorri_rows = self.repository.fetch_glorri_vacancies_between(
            self._to_iso_utc(start_utc),
            self._to_iso_utc(end_utc),
            fetch_limit,
        )
        duplicate_ids = self.repository.fetch_duplicate_glorri_ids(
            [row.get("id") for row in glorri_rows if isinstance(row, dict)]
        )
        filtered_glorri_rows = [
            row for row in glorri_rows if isinstance(row, dict) and row.get("id") not in duplicate_ids
        ]
        glorri_company_map = self.repository.fetch_glorri_company_names_by_ids(
            [row.get("company_id") for row in filtered_glorri_rows if isinstance(row, dict)]
        )

        glorri_jobs: list[dict] = []
        for row in filtered_glorri_rows:
            vacancy_about = row.get("vacancy_about") if isinstance(row.get("vacancy_about"), dict) else {}
            glorri_jobs.append(
                {
                    "source": "Glorri",
                    "title": row.get("title") if isinstance(row.get("title"), str) else "Untitled",
                    "company": glorri_company_map.get(int(row.get("company_id"))) if row.get("company_id") is not None else "Unknown company",
                    "location": self._compact_location(row.get("location") if isinstance(row.get("location"), str) else ""),
                    "employment_type": row.get("type") if isinstance(row.get("type"), str) else "",
                    "published_at": row.get("postedDate"),
                    "deadline": vacancy_about.get("deadline") if isinstance(vacancy_about.get("deadline"), str) else "",
                    "tech_stack": row.get("tech_stack"),
                    "salary": vacancy_about.get("salary") if isinstance(vacancy_about.get("salary"), str) else None,
                    "url": self._glorri_public_url(row.get("slug")),
                }
            )

        jobs = js_jobs + glorri_jobs
        jobs.sort(key=lambda item: self._parse_datetime(item.get("published_at")), reverse=True)
        return jobs

    def _paginate_detail_messages(self, language: str, jobs: list[dict], title_key: str) -> list[str]:
        title = self._text(language, title_key)
        rendered_jobs = [self._render_user_vacancy(job, language) for job in jobs]
        pages = [
            rendered_jobs[index : index + self.DETAIL_PAGE_SIZE]
            for index in range(0, len(rendered_jobs), self.DETAIL_PAGE_SIZE)
        ]

        total_pages = max(1, len(pages))
        messages: list[str] = []
        for index, page_items in enumerate(pages, start=1):
            messages.append(
                "\n\n".join(
                    [
                        title,
                        f"{self._text(language, 'page')}: {index}/{total_pages}",
                        *page_items,
                    ]
                )
            )
        return messages

    def _user_matches_job(self, selected: list[str], job: dict) -> bool:
        if not selected:
            return True
        job_stack = {str(item).strip() for item in job.get("tech_stack") if str(item).strip()} if isinstance(job.get("tech_stack"), list) else set()
        return bool(job_stack.intersection(set(selected)))

    def _collect_yesterday_jobs(self) -> list[dict]:
        _, _, yesterday_local = self._yesterday_window()
        return self._collect_jobs_for_date(yesterday_local)

    def _collect_all_jobs(self) -> list[dict]:
        js_rows = self.repository.fetch_all_js_vacancies_for_bot()
        duplicate_js_ids = self.repository.fetch_duplicate_jobsearch_ids(
            [row.get("id") for row in js_rows if isinstance(row, dict)]
        )
        js_rows = [row for row in js_rows if isinstance(row, dict) and row.get("id") not in duplicate_js_ids]
        js_company_map = self.repository.fetch_js_companies_by_ids(
            [row.get("company_id") for row in js_rows if isinstance(row, dict)]
        )

        js_jobs: list[dict] = []
        for row in js_rows:
            company_info = js_company_map.get(int(row.get("company_id"))) if row.get("company_id") is not None else {}
            company_title = company_info.get("title") if isinstance(company_info, dict) else ""
            company_address = company_info.get("address") if isinstance(company_info, dict) else ""
            js_jobs.append(
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

        glorri_rows = self.repository.fetch_all_glorri_vacancies_for_bot()
        duplicate_ids = self.repository.fetch_duplicate_glorri_ids(
            [row.get("id") for row in glorri_rows if isinstance(row, dict)]
        )
        glorri_rows = [row for row in glorri_rows if isinstance(row, dict) and row.get("id") not in duplicate_ids]
        glorri_company_map = self.repository.fetch_glorri_company_names_by_ids(
            [row.get("company_id") for row in glorri_rows if isinstance(row, dict)]
        )

        glorri_jobs: list[dict] = []
        for row in glorri_rows:
            vacancy_about = row.get("vacancy_about") if isinstance(row.get("vacancy_about"), dict) else {}
            glorri_jobs.append(
                {
                    "source": "Glorri",
                    "title": row.get("title") if isinstance(row.get("title"), str) else "Untitled",
                    "company": glorri_company_map.get(int(row.get("company_id"))) if row.get("company_id") is not None else "Unknown company",
                    "location": self._compact_location(row.get("location") if isinstance(row.get("location"), str) else ""),
                    "employment_type": row.get("type") if isinstance(row.get("type"), str) else "",
                    "published_at": row.get("postedDate"),
                    "deadline": vacancy_about.get("deadline") if isinstance(vacancy_about.get("deadline"), str) else "",
                    "tech_stack": row.get("tech_stack"),
                    "salary": vacancy_about.get("salary") if isinstance(vacancy_about.get("salary"), str) else None,
                    "url": self._glorri_public_url(row.get("slug")),
                }
            )

        jobs = js_jobs + glorri_jobs
        jobs.sort(key=lambda item: self._parse_datetime(item.get("published_at")), reverse=True)
        return jobs

    def _matching_jobs_for_user(self, user: dict) -> list[dict]:
        selected = self._normalize_technologies(user.get("selected_technologies"))
        jobs = self._collect_yesterday_jobs()
        return [job for job in jobs if self._user_matches_job(selected, job)]

    def _all_matching_jobs_for_user(self, user: dict) -> list[dict]:
        selected = self._normalize_technologies(user.get("selected_technologies"))
        jobs = self._collect_all_jobs()
        return [job for job in jobs if self._user_matches_job(selected, job)]

    def _build_browse_message(self, user: dict, page: int) -> tuple[str, dict | None]:
        language = self._normalize_language(user.get("language_code"))
        matched = self._all_matching_jobs_for_user(user)
        if not matched:
            return self._text(language, "empty_digest"), None

        total_pages = max(1, (len(matched) + self.VIEW_PAGE_SIZE - 1) // self.VIEW_PAGE_SIZE)
        current_page = min(max(0, int(page)), total_pages - 1)
        start = current_page * self.VIEW_PAGE_SIZE
        page_items = matched[start : start + self.VIEW_PAGE_SIZE]

        lines = [
            self._text(language, "browse_vacancies"),
            f"{self._text(language, 'page')}: {current_page + 1}/{total_pages}",
            "",
        ]

        for index, job in enumerate(page_items, start=start + 1):
            title = escape(str(job.get("title") or "Untitled"))
            company = escape(str(job.get("company") or "Unknown company"))
            salary = escape(self._format_salary(job.get("salary")))
            deadline = escape(self._format_deadline(job.get("deadline")) or self._text(language, "not_specified"))
            url = str(job.get("url") or "").strip()

            if self._is_supported_url(url):
                lines.append(f"<b>{index}.</b> <a href=\"{escape(url, quote=True)}\">{title}</a>")
            else:
                lines.append(f"<b>{index}.</b> {title}")
            lines.append(f"🏢 {company}")
            lines.append(f"📅 {deadline}")
            lines.append(f"💰 {salary}")
            lines.append("")

        return "\n".join(lines).strip(), self._build_view_keyboard(
            language,
            current_page,
            total_pages,
            self.VIEW_CONTEXT_BROWSE,
        )

    def _build_daily_digest_message(
        self,
        user: dict,
        target_date: date | None = None,
        page: int = 0,
    ) -> tuple[str, dict | None]:
        language = self._normalize_language(user.get("language_code"))
        digest_date = target_date or self._yesterday_window()[2]
        selected = self._normalize_technologies(user.get("selected_technologies"))
        jobs = self._collect_jobs_for_date(digest_date)
        matched = [job for job in jobs if self._user_matches_job(selected, job)]

        if not matched:
            return self._text(language, "empty_digest"), None

        messages = self._paginate_detail_messages(language, matched, "daily_digest")
        current_page = min(max(0, int(page)), len(messages) - 1)
        keyboard = self._build_view_keyboard(
            language,
            current_page,
            len(messages),
            self.VIEW_CONTEXT_DAILY,
            digest_date.isoformat(),
        )
        return messages[current_page], keyboard

    def _send_matching_vacancies(self, user: dict):
        self._send_daily_digest_page(user)

    def _send_daily_digest_page(self, user: dict, target_date: date | None = None, page: int = 0, message_id: int | None = None):
        text, keyboard = self._build_daily_digest_message(user, target_date, page)
        chat_id = int(user["chat_id"])
        if message_id is None:
            self._send_message(chat_id, text, keyboard)
        else:
            self._edit_message(chat_id, message_id, text, keyboard)

    def _send_browse_vacancies(self, user: dict, page: int = 0, message_id: int | None = None):
        text, keyboard = self._build_browse_message(user, page)
        chat_id = int(user["chat_id"])
        if message_id is None:
            self._send_message(chat_id, text, keyboard)
        else:
            self._edit_message(chat_id, message_id, text, keyboard)

    def send_daily_user_digests(self):
        if not self.is_bot_configured:
            return

        users = self.repository.fetch_active_telegram_users()
        if not users:
            return

        jobs = self._collect_yesterday_jobs()
        _, _, yesterday_local = self._yesterday_window()
        yesterday_token = yesterday_local.isoformat()

        for user in users:
            if user.get("last_digest_for") == yesterday_token:
                continue

            language = self._normalize_language(user.get("language_code"))
            selected = self._normalize_technologies(user.get("selected_technologies"))
            matched = [job for job in jobs if self._user_matches_job(selected, job)]
            if not matched:
                self._send_message(int(user["chat_id"]), self._text(language, "empty_digest"))
                self.repository.update_telegram_user(int(user["chat_id"]), {"last_digest_for": yesterday_token})
                continue

            self._send_daily_digest_page(user, yesterday_local)

            self.repository.update_telegram_user(int(user["chat_id"]), {"last_digest_for": yesterday_token})

    def _handle_start(self, chat: dict, from_user: dict | None = None):
        user = self._get_or_create_user(chat, from_user)
        self.repository.update_telegram_user(int(user["chat_id"]), {"active": True, "onboarding_step": "language"})
        self._send_language_prompt(int(chat["id"]))

    def _handle_settings(self, chat: dict, from_user: dict | None = None):
        user = self._get_or_create_user(chat, from_user)
        language = self._normalize_language(user.get("language_code"))
        self._send_message(
            int(chat["id"]),
            self._settings_summary(user),
            self._build_settings_keyboard(language, bool(user.get("active", True))),
        )

    def _handle_message(self, message: dict):
        chat = message.get("chat") if isinstance(message.get("chat"), dict) else None
        if not chat or chat.get("type") != "private":
            return

        text = str(message.get("text") or "").strip()
        from_user = message.get("from") if isinstance(message.get("from"), dict) else None
        if text.startswith("/start"):
            self._handle_start(chat, from_user)
        elif text.startswith("/settings"):
            self._handle_settings(chat, from_user)
        elif text.startswith("/stop"):
            user = self._get_or_create_user(chat, from_user)
            updated = self._set_active(user, False)
            language = self._normalize_language(updated.get("language_code"))
            self._send_message(int(chat["id"]), self._text(language, "paused_message"))
        elif text.startswith("/resume"):
            user = self._get_or_create_user(chat, from_user)
            updated = self._set_active(user, True)
            language = self._normalize_language(updated.get("language_code"))
            self._send_message(int(chat["id"]), self._text(language, "resumed_message"))
        elif text.startswith("/vacancies"):
            user = self._get_or_create_user(chat, from_user)
            self._send_browse_vacancies(user, 0)
        else:
            self._handle_settings(chat, from_user)

    def _handle_callback(self, callback_query: dict):
        callback_id = str(callback_query.get("id") or "")
        data = str(callback_query.get("data") or "")
        message = callback_query.get("message") if isinstance(callback_query.get("message"), dict) else None
        from_user = callback_query.get("from") if isinstance(callback_query.get("from"), dict) else None
        if not message:
            self._answer_callback(callback_id)
            return

        chat = message.get("chat") if isinstance(message.get("chat"), dict) else None
        if not chat or chat.get("type") != "private":
            self._answer_callback(callback_id)
            return

        user = self._get_or_create_user(chat, from_user)
        parts = data.split(":")
        action = parts[0] if parts else ""

        if action == self.CALLBACK_PREFIX_LANGUAGE and len(parts) == 2:
            language = self._normalize_language(parts[1])
            current_step = str(user.get("onboarding_step") or "language")
            is_completed = current_step == "completed"
            next_step = "completed" if is_completed else "tech"
            user = self._save_language(user, language, next_step)
            self._answer_callback(callback_id, self._text(language, "saved"))
            self._send_message(int(chat["id"]), self._text(language, "language_saved"))
            if is_completed:
                self._send_message(
                    int(chat["id"]),
                    self._settings_summary(user),
                    self._build_settings_keyboard(language, bool(user.get("active", True))),
                )
            else:
                self._send_tech_prompt(
                    int(chat["id"]),
                    language,
                    self._normalize_technologies(user.get("selected_technologies")),
                )
            return

        if action == self.CALLBACK_PREFIX_SETTINGS:
            language = self._normalize_language(user.get("language_code"))
            self._answer_callback(callback_id)
            if len(parts) >= 2 and parts[1] == "language":
                self._send_message(int(chat["id"]), self._text(language, "welcome"), self._build_language_keyboard())
                return
            if len(parts) >= 3 and parts[1] == "tech":
                page = int(parts[2]) if parts[2].isdigit() else 0
                self._send_tech_prompt(
                    int(chat["id"]),
                    language,
                    self._normalize_technologies(user.get("selected_technologies")),
                    page,
                )
                return

        if action == self.CALLBACK_PREFIX_STATUS and len(parts) == 2:
            pause = parts[1] == "pause"
            user = self._set_active(user, not pause)
            language = self._normalize_language(user.get("language_code"))
            self._answer_callback(callback_id)
            self._send_message(
                int(chat["id"]),
                self._text(language, "paused_message") if pause else self._text(language, "resumed_message"),
                self._build_settings_keyboard(language, bool(user.get("active", True))),
            )
            return

        if action == self.CALLBACK_PREFIX_VIEW and len(parts) == 2 and parts[1] == "vacancies":
            language = self._normalize_language(user.get("language_code"))
            self._answer_callback(callback_id, self._text(language, "vacancies_sent"))
            self._send_browse_vacancies(user, 0)
            return

        if action == self.CALLBACK_PREFIX_VIEW and len(parts) == 3 and parts[1] == self.VIEW_CONTEXT_BROWSE:
            page = int(parts[2]) if parts[2].isdigit() else 0
            self._answer_callback(callback_id)
            self._send_browse_vacancies(user, page, int(message["message_id"]))
            return

        if action == self.CALLBACK_PREFIX_VIEW and len(parts) == 4 and parts[1] == self.VIEW_CONTEXT_DAILY:
            target_date = self._parse_date_token(parts[2]) or self._yesterday_window()[2]
            page = int(parts[3]) if parts[3].isdigit() else 0
            self._answer_callback(callback_id)
            self._send_daily_digest_page(user, target_date, page, int(message["message_id"]))
            return

        if action == self.CALLBACK_PREFIX_TECH:
            language = self._normalize_language(user.get("language_code"))
            if len(parts) >= 2 and parts[1] == "toggle" and len(parts) == 4:
                page = int(parts[2]) if parts[2].isdigit() else 0
                tech_index = int(parts[3]) if parts[3].isdigit() else -1
                user = self._toggle_technology(user, tech_index)
                self._answer_callback(callback_id)
                self._send_tech_prompt(
                    int(chat["id"]),
                    language,
                    self._normalize_technologies(user.get("selected_technologies")),
                    page,
                    int(message["message_id"]),
                )
                return
            if len(parts) >= 2 and parts[1] == "page" and len(parts) == 3:
                page = int(parts[2]) if parts[2].isdigit() else 0
                self._answer_callback(callback_id)
                self._send_tech_prompt(
                    int(chat["id"]),
                    language,
                    self._normalize_technologies(user.get("selected_technologies")),
                    page,
                    int(message["message_id"]),
                )
                return
            if len(parts) >= 2 and parts[1] == "clear":
                page = int(parts[2]) if len(parts) == 3 and parts[2].isdigit() else 0
                user = self._clear_technologies(user)
                self._answer_callback(callback_id)
                self._send_tech_prompt(int(chat["id"]), language, [], page, int(message["message_id"]))
                return
            if len(parts) >= 2 and parts[1] == "done":
                user = self._complete_onboarding(user)
                self._answer_callback(callback_id, self._text(language, "saved"))
                self._send_message(
                    int(chat["id"]),
                    self._settings_summary(user),
                    self._build_settings_keyboard(language, bool(user.get("active", True))),
                )
                return

        self._answer_callback(callback_id)

    def start_polling(self):
        if not self.is_bot_configured:
            print("Telegram bot polling skipped: missing bot token or Supabase configuration")
            return

        print("Telegram bot polling started")
        while True:
            try:
                updates = self._get_updates()
                for update in updates:
                    update_id = update.get("update_id")
                    if isinstance(update_id, int):
                        self._update_offset = update_id + 1
                    if isinstance(update.get("message"), dict):
                        self._handle_message(update["message"])
                    elif isinstance(update.get("callback_query"), dict):
                        self._handle_callback(update["callback_query"])
            except requests.RequestException as error:
                print(f"Telegram bot polling error: {error}")
                time.sleep(self.RETRY_DELAY_SECONDS)
            except Exception as error:
                print(f"Telegram bot processing error: {error}")
                time.sleep(self.RETRY_DELAY_SECONDS)
