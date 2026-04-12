from datetime import datetime, timezone


class TranslationBatchService:
    def __init__(self, repository, translation_service, batch_size: int = 50):
        self.repository = repository
        self.translation_service = translation_service
        self.batch_size = batch_size

    def run(self) -> dict:
        started_at = datetime.now(timezone.utc)
        print(f"[{started_at.isoformat()}] translation batch started")

        result = {
            "started_at": started_at.isoformat(),
            "vacancies_translated": 0,
            "companies_translated": 0,
            "errors": [],
        }

        if not self.repository or not self.repository.is_configured:
            result["errors"].append("Repository not configured, skipping translations")
            return result

        # Check kill switch
        enabled = self.repository.fetch_setting("translation_enabled")
        if enabled == "false":
            print(f"[{started_at.isoformat()}] translation batch skipped (disabled via admin panel)")
            result["errors"].append("Translation disabled")
            return result

        # Refresh proxy list before batch
        self.translation_service._refresh_proxies()

        try:
            result["vacancies_translated"] = self._translate_vacancies()
        except Exception as err:
            message = f"Vacancy translation failed: {err}"
            result["errors"].append(message)
            print(f"[translation_batch] {message}")

        try:
            result["companies_translated"] = self._translate_companies()
        except Exception as err:
            message = f"Company translation failed: {err}"
            result["errors"].append(message)
            print(f"[translation_batch] {message}")

        finished_at = datetime.now(timezone.utc)
        result["finished_at"] = finished_at.isoformat()
        elapsed = (finished_at - started_at).total_seconds()
        print(
            f"[{finished_at.isoformat()}] translation batch finished "
            f"(vacancies={result['vacancies_translated']}, companies={result['companies_translated']}, "
            f"elapsed={elapsed:.1f}s)"
        )

        return result

    def _translate_vacancies(self) -> int:
        translated_count = 0

        # Fetch JobSearch vacancies missing translations
        js_untranslated = self.repository.fetch_untranslated_vacancies("jobsearch")
        print(f"[translation_batch] {len(js_untranslated)} untranslated JobSearch vacancies")

        for vacancy in js_untranslated[: self.batch_size]:
            vacancy_id = vacancy.get("id")
            title = vacancy.get("title") or ""
            text = vacancy.get("text") or ""

            if not title and not text:
                continue

            try:
                translations = self.translation_service.translate_vacancy(
                    "jobsearch", vacancy_id, title, text
                )
                if translations:
                    self.repository.upsert_vacancy_translations(translations)
                    translated_count += 1
            except Exception as err:
                print(f"[translation_batch] failed to translate JS vacancy {vacancy_id}: {err}")

        # Fetch Glorri vacancies missing translations
        glorri_untranslated = self.repository.fetch_untranslated_vacancies("glorri")
        print(f"[translation_batch] {len(glorri_untranslated)} untranslated Glorri vacancies")

        for vacancy in glorri_untranslated[: self.batch_size]:
            vacancy_id = vacancy.get("id")
            title = vacancy.get("title") or ""
            text = vacancy.get("text") or ""

            if not title and not text:
                continue

            try:
                translations = self.translation_service.translate_vacancy(
                    "glorri", vacancy_id, title, text
                )
                if translations:
                    self.repository.upsert_vacancy_translations(translations)
                    translated_count += 1
            except Exception as err:
                print(f"[translation_batch] failed to translate Glorri vacancy {vacancy_id}: {err}")

        return translated_count

    def _translate_companies(self) -> int:
        translated_count = 0

        # Fetch JobSearch companies missing translations
        js_untranslated = self.repository.fetch_untranslated_companies("jobsearch")
        print(f"[translation_batch] {len(js_untranslated)} untranslated JobSearch companies")

        for company in js_untranslated[: self.batch_size]:
            company_id = company.get("id")
            name = company.get("title") or company.get("name") or ""
            description = company.get("text") or ""

            if not name:
                continue

            try:
                translations = self.translation_service.translate_company(
                    "jobsearch", company_id, name, description
                )
                if translations:
                    self.repository.upsert_company_translations(translations)
                    translated_count += 1
            except Exception as err:
                print(f"[translation_batch] failed to translate JS company {company_id}: {err}")

        # Fetch Glorri companies missing translations
        glorri_untranslated = self.repository.fetch_untranslated_companies("glorri")
        print(f"[translation_batch] {len(glorri_untranslated)} untranslated Glorri companies")

        for company in glorri_untranslated[: self.batch_size]:
            company_id = company.get("id")
            name = company.get("name") or ""

            if not name:
                continue

            try:
                translations = self.translation_service.translate_company(
                    "glorri", company_id, name, ""
                )
                if translations:
                    self.repository.upsert_company_translations(translations)
                    translated_count += 1
            except Exception as err:
                print(f"[translation_batch] failed to translate Glorri company {company_id}: {err}")

        return translated_count
