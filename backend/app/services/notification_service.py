from datetime import datetime, timezone


class NotificationService:
    def __init__(self, repository):
        self.repository = repository

    def run(self, cycle_result: dict | None = None) -> dict:
        started_at = datetime.now(timezone.utc)
        result = {
            "started_at": started_at.isoformat(),
            "expired_notifications": 0,
            "new_vacancy_notifications": 0,
            "errors": [],
        }

        if not self.repository or not self.repository.is_configured:
            return result

        try:
            result["expired_notifications"] = self._check_expired_favorites()
        except Exception as err:
            message = f"Expired favorites check failed: {err}"
            result["errors"].append(message)
            print(f"[notifications] {message}")

        try:
            result["new_vacancy_notifications"] = self._check_new_company_vacancies(cycle_result)
        except Exception as err:
            message = f"New company vacancy check failed: {err}"
            result["errors"].append(message)
            print(f"[notifications] {message}")

        finished_at = datetime.now(timezone.utc)
        result["finished_at"] = finished_at.isoformat()
        total = result["expired_notifications"] + result["new_vacancy_notifications"]
        if total > 0:
            print(f"[notifications] generated {total} notifications "
                  f"(expired={result['expired_notifications']}, new_vacancy={result['new_vacancy_notifications']})")

        return result

    def _check_expired_favorites(self) -> int:
        expired_vacancies = self.repository.fetch_expired_favorite_vacancies()
        if not expired_vacancies:
            return 0

        notifications = []
        for row in expired_vacancies:
            user_id = row.get("user_id")
            source = row.get("source")
            vacancy_id = row.get("vacancy_id")
            title = row.get("title") or "Vacancy"
            slug = row.get("slug") or ""

            already_sent = self.repository.check_notification_exists(
                user_id, "vacancy_expired", source, vacancy_id
            )
            if already_sent:
                continue

            notifications.append({
                "user_id": user_id,
                "type": "vacancy_expired",
                "title": f"Vacancy expired: {title}",
                "body": f"The vacancy \"{title}\" you favorited has passed its deadline.",
                "metadata": {
                    "source": source,
                    "vacancy_id": vacancy_id,
                    "slug": slug,
                },
            })

        if notifications:
            self.repository.insert_notifications(notifications)

        return len(notifications)

    def _check_new_company_vacancies(self, cycle_result: dict | None) -> int:
        if not cycle_result:
            return 0

        notifications = []

        # Check JobSearch new vacancies
        js_result = cycle_result.get("jobsearch") or {}
        js_new_ids = js_result.get("new_vacancy_ids") or []
        if js_new_ids:
            notifications.extend(
                self._build_new_vacancy_notifications("jobsearch", js_new_ids)
            )

        # Check Glorri new vacancies
        glorri_result = cycle_result.get("glorri") or {}
        glorri_new_ids = glorri_result.get("new_vacancy_ids") or []
        if glorri_new_ids:
            notifications.extend(
                self._build_new_vacancy_notifications("glorri", glorri_new_ids)
            )

        if notifications:
            self.repository.insert_notifications(notifications)

        return len(notifications)

    def _build_new_vacancy_notifications(self, source: str, vacancy_ids: list[int]) -> list[dict]:
        notifications = []

        for vacancy_id in vacancy_ids:
            vacancy_info = self.repository.fetch_vacancy_brief(source, vacancy_id)
            if not vacancy_info:
                continue

            company_id = vacancy_info.get("company_id")
            if not company_id:
                continue

            followers = self.repository.fetch_company_followers(source, company_id)
            if not followers:
                continue

            title = vacancy_info.get("title") or "New vacancy"
            slug = vacancy_info.get("slug") or ""
            company_name = vacancy_info.get("company_name") or "Company"

            for user_id in followers:
                notifications.append({
                    "user_id": user_id,
                    "type": "new_company_vacancy",
                    "title": f"New vacancy from {company_name}",
                    "body": f"{company_name} posted a new vacancy: \"{title}\"",
                    "metadata": {
                        "source": source,
                        "vacancy_id": vacancy_id,
                        "company_id": company_id,
                        "slug": slug,
                    },
                })

        return notifications
