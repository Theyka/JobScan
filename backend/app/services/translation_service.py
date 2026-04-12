import random
import time
from datetime import datetime, timezone

import requests


ALL_LANGUAGES = ("en", "az", "ru")
MAX_RETRIES = 6
RETRY_WAIT_SECONDS = 30
TRANSLATE_TIMEOUT = 30


class TranslationService:
    def __init__(self, repository):
        self.repository = repository
        self._proxy_list: list[dict] = []
        self._proxy_index = 0

    def _refresh_proxies(self):
        if not self.repository or not self.repository.is_configured:
            self._proxy_list = []
            return
        try:
            self._proxy_list = self.repository.fetch_active_proxies()
        except Exception as err:
            print(f"[translation] failed to fetch proxies: {err}")
            self._proxy_list = []

    def _next_proxy(self) -> dict | None:
        if not self._proxy_list:
            return None
        proxy = self._proxy_list[self._proxy_index % len(self._proxy_list)]
        self._proxy_index += 1
        return proxy

    def _report_proxy_failure(self, proxy_row: dict):
        if not proxy_row or not self.repository or not self.repository.is_configured:
            return
        proxy_id = proxy_row.get("id")
        fail_count = (proxy_row.get("fail_count") or 0) + 1
        try:
            self.repository.update_proxy_status(proxy_id, fail_count)
        except Exception as err:
            print(f"[translation] failed to update proxy status: {err}")

    def _report_proxy_success(self, proxy_row: dict):
        if not proxy_row or not self.repository or not self.repository.is_configured:
            return
        proxy_id = proxy_row.get("id")
        try:
            self.repository.update_proxy_success(proxy_id)
        except Exception as err:
            print(f"[translation] failed to update proxy success: {err}")

    def translate_text(self, text: str, to_lang: str, from_lang: str = "auto") -> str | None:
        if not text or not text.strip():
            return None

        for attempt in range(MAX_RETRIES):
            # Lazily refresh proxy list if it was empty when the batch started
            # (e.g. proxies were added while the batch was already running)
            if not self._proxy_list:
                self._refresh_proxies()

            proxy_row = self._next_proxy()
            proxy_url = proxy_row["url"] if proxy_row else None
            proxy_label = proxy_url or "direct (no proxy)"
            try:
                result = _call_google_translate(text, to_lang, from_lang, proxy_url)
                if proxy_row:
                    self._report_proxy_success(proxy_row)
                return result
            except requests.exceptions.HTTPError as err:
                if err.response is not None and err.response.status_code == 429:
                    if proxy_row:
                        self._report_proxy_failure(proxy_row)
                    wait = RETRY_WAIT_SECONDS + random.uniform(0, 5)
                    print(f"[translation] 429 rate-limited via {proxy_label}, waiting {wait:.0f}s (attempt {attempt + 1}/{MAX_RETRIES})")
                    time.sleep(wait)
                else:
                    if proxy_row:
                        self._report_proxy_failure(proxy_row)
                    print(f"[translation] HTTP error via {proxy_label}: {err}")
                    return None
            except Exception as err:
                if proxy_row:
                    self._report_proxy_failure(proxy_row)
                print(f"[translation] error via {proxy_label}: {err}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(2)

        print(f"[translation] exhausted retries for text (len={len(text)})")
        return None

    def detect_language(self, text: str) -> str:
        if not text or not text.strip():
            return "az"
        try:
            proxy_row = self._next_proxy()
            proxy_url = proxy_row["url"] if proxy_row else None
            result = _detect_language(text[:500], proxy_url)
            return result if result in ALL_LANGUAGES else "az"
        except Exception:
            return "az"

    def get_target_languages(self, source_lang: str) -> list[str]:
        return [lang for lang in ALL_LANGUAGES if lang != source_lang]

    def translate_vacancy(self, source: str, vacancy_id: int, title: str, text: str) -> list[dict]:
        combined = (title or "") + "\n" + (text or "")
        source_lang = self.detect_language(combined[:500])
        targets = self.get_target_languages(source_lang)

        translations = []

        # Store the original language row too
        translations.append({
            "source": source,
            "vacancy_id": vacancy_id,
            "lang": source_lang,
            "title": title,
            "text": text,
            "translated_at": datetime.now(timezone.utc).isoformat(),
        })

        for lang in targets:
            translated_title = self.translate_text(title, lang, source_lang) if title else None
            translated_text = self.translate_text(text, lang, source_lang) if text else None

            if translated_title or translated_text:
                translations.append({
                    "source": source,
                    "vacancy_id": vacancy_id,
                    "lang": lang,
                    "title": translated_title or title,
                    "text": translated_text or text,
                    "translated_at": datetime.now(timezone.utc).isoformat(),
                })

        return translations

    def translate_company(self, source: str, company_id: int, name: str, description: str) -> list[dict]:
        combined = (name or "") + "\n" + (description or "")
        source_lang = self.detect_language(combined[:500])
        targets = self.get_target_languages(source_lang)

        translations = []

        translations.append({
            "source": source,
            "company_id": company_id,
            "lang": source_lang,
            "name": name,
            "description": description,
            "translated_at": datetime.now(timezone.utc).isoformat(),
        })

        for lang in targets:
            translated_name = self.translate_text(name, lang, source_lang) if name else None
            translated_desc = self.translate_text(description, lang, source_lang) if description else None

            if translated_name or translated_desc:
                translations.append({
                    "source": source,
                    "company_id": company_id,
                    "lang": lang,
                    "name": translated_name or name,
                    "description": translated_desc or description,
                    "translated_at": datetime.now(timezone.utc).isoformat(),
                })

        return translations


def _call_google_translate(text: str, to_lang: str, from_lang: str = "auto", proxy: str | None = None) -> str:
    url = "https://translate.google.com/translate_a/single?client=at&dt=t&dt=rm&dj=1"
    proxies = {"http": proxy, "https": proxy} if proxy else None
    response = requests.post(
        url,
        data={"sl": from_lang, "tl": to_lang, "q": text},
        headers={"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"},
        proxies=proxies,
        timeout=TRANSLATE_TIMEOUT,
    )
    response.raise_for_status()
    raw = response.json()
    return "".join(s["trans"] for s in raw.get("sentences", []) if "trans" in s)


def _detect_language(text: str, proxy: str | None = None) -> str:
    url = "https://translate.google.com/translate_a/single?client=at&dt=t&dt=rm&dj=1"
    proxies = {"http": proxy, "https": proxy} if proxy else None
    response = requests.post(
        url,
        data={"sl": "auto", "tl": "en", "q": text},
        headers={"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"},
        proxies=proxies,
        timeout=TRANSLATE_TIMEOUT,
    )
    response.raise_for_status()
    raw = response.json()
    return raw.get("src", "az")
