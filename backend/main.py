from pathlib import Path

from app.config import load_settings
from app.controllers.scrape_controller import ScrapeController
from app.repositories.supabase_repository import SupabaseRepository
from app.scheduler.interval_scheduler import IntervalScheduler
from app.services.duplicate_detection_service import DuplicateDetectionService
from app.services.glorri_service import GlorriService
from app.services.jobsearch_service import JobSearchService
from app.services.technology_service import TechnologyService


def main():
    env_path = Path(__file__).resolve().with_name(".env")
    settings = load_settings(env_path)

    repository = SupabaseRepository(
        base_url=settings.supabase_url,
        service_key=settings.supabase_service_key,
        timeout=60,
    )
    technology_service = TechnologyService()

    jobsearch_service = JobSearchService(repository, technology_service)
    glorri_service = GlorriService(repository, technology_service)
    duplicate_detection_service = DuplicateDetectionService(repository)
    controller = ScrapeController(jobsearch_service, glorri_service, duplicate_detection_service)

    if not repository.is_configured:
        print("Warning: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing. DB inserts will be skipped.")

    scheduler = IntervalScheduler(settings.scrape_interval_seconds)
    scheduler.run_forever(controller.run_cycle)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Stopped by user")
