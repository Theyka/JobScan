from datetime import datetime, timezone

from app.services.glorri_service import GlorriService
from app.services.jobsearch_service import JobSearchService


class ScrapeController:
    def __init__(self, jobsearch_service: JobSearchService, glorri_service: GlorriService):
        self.jobsearch_service = jobsearch_service
        self.glorri_service = glorri_service

    def run_cycle(self) -> dict:
        started_at = datetime.now(timezone.utc)
        print(f"[{started_at.isoformat()}] scrape cycle started")

        result = {
            "started_at": started_at.isoformat(),
            "jobsearch": None,
            "glorri": None,
            "errors": [],
        }

        try:
            result["jobsearch"] = self.jobsearch_service.run()
        except Exception as error:
            message = f"JobSearch run failed: {error}"
            result["errors"].append(message)
            print(message)

        try:
            result["glorri"] = self.glorri_service.run()
        except Exception as error:
            message = f"Glorri run failed: {error}"
            result["errors"].append(message)
            print(message)

        finished_at = datetime.now(timezone.utc)
        result["finished_at"] = finished_at.isoformat()
        print(f"[{finished_at.isoformat()}] scrape cycle finished")

        return result
