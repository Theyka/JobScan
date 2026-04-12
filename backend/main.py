import argparse
from pathlib import Path
from threading import Thread

from app.config import load_settings
from app.controllers.scrape_controller import ScrapeController
from app.repositories.supabase_repository import SupabaseRepository
from app.scheduler.daily_scheduler import DailyScheduler
from app.scheduler.interval_scheduler import IntervalScheduler
from app.services.duplicate_detection_service import DuplicateDetectionService
from app.services.glorri_service import GlorriService
from app.services.jobsearch_service import JobSearchService
from app.services.notification_service import NotificationService
from app.services.telegram_bot_service import TelegramBotService
from app.services.telegram_service import TelegramService
from app.services.technology_service import TechnologyService
from app.services.translation_batch_service import TranslationBatchService
from app.services.translation_service import TranslationService


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--send-telegram-digest-now",
        action="store_true",
        help="Send the Telegram jobs digest immediately, then exit.",
    )
    parser.add_argument(
        "--preview-telegram-digest",
        action="store_true",
        help="Build the Telegram jobs digest, print it, then exit without sending.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
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
    telegram_service = TelegramService(
        repository,
        settings.telegram_bot_token,
        settings.telegram_channel_id,
        settings.telegram_digest_limit,
        settings.telegram_bot_username,
        settings.telegram_timezone,
        settings.telegram_thread_id,
        settings.frontend_base_url,
    )
    telegram_bot_service = TelegramBotService(
        repository,
        settings.telegram_bot_token,
        settings.telegram_digest_limit,
        settings.telegram_timezone,
        settings.telegram_bot_username,
        settings.frontend_base_url,
    )
    controller = ScrapeController(jobsearch_service, glorri_service, duplicate_detection_service)

    notification_service = NotificationService(repository)
    translation_service = TranslationService(repository)
    translation_batch_service = TranslationBatchService(
        repository, translation_service, settings.translation_batch_size
    )

    if not repository.is_configured:
        print("Warning: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing. DB inserts will be skipped.")

    if args.preview_telegram_digest:
        preview = telegram_service.preview_latest_jobs_digest()
        print(
            f"Preview built: jobs={preview['jobs']}, message_length={preview['message_length']}"
        )
        print(str(preview["message"]))
        return

    if args.send_telegram_digest_now:
        telegram_service.send_latest_jobs_digest()
        return

    if telegram_bot_service.is_bot_configured:
        Thread(target=telegram_bot_service.start_polling, daemon=True).start()
        daily_user_scheduler = DailyScheduler(
            settings.telegram_digest_time,
            settings.telegram_timezone,
        )
        Thread(
            target=daily_user_scheduler.run_forever,
            args=(telegram_bot_service.send_daily_user_digests,),
            daemon=True,
        ).start()
    else:
        print("Telegram bot disabled: set TELEGRAM_BOT_TOKEN and Supabase config to enable it.")

    if telegram_service.is_configured:
        daily_scheduler = DailyScheduler(
            settings.telegram_digest_time,
            settings.telegram_timezone,
        )
        Thread(
            target=daily_scheduler.run_forever,
            args=(telegram_service.send_latest_jobs_digest,),
            daemon=True,
        ).start()
    else:
        print("Telegram digest disabled: set TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID to enable it.")

    # Translation batch scheduler
    translation_scheduler = IntervalScheduler(settings.translation_interval_seconds)
    Thread(
        target=translation_scheduler.run_forever,
        args=(translation_batch_service.run,),
        daemon=True,
    ).start()

    def scrape_with_notifications():
        cycle_result = controller.run_cycle()
        try:
            notification_service.run(cycle_result)
        except Exception as err:
            print(f"Notification generation failed: {err}")

    scheduler = IntervalScheduler(settings.scrape_interval_seconds)
    scheduler.run_forever(scrape_with_notifications)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Stopped by user")
