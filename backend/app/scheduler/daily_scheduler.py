import time
from collections.abc import Callable
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


class DailyScheduler:
    def __init__(self, time_of_day: str, timezone_name: str = "Asia/Baku"):
        hour, minute = self._parse_time_of_day(time_of_day)
        self.hour = hour
        self.minute = minute
        self.timezone_name = timezone_name or "UTC"
        self.timezone = self._load_timezone(self.timezone_name)

    @staticmethod
    def _parse_time_of_day(value: str) -> tuple[int, int]:
        raw = str(value or "09:00").strip()
        parts = raw.split(":", 1)
        if len(parts) != 2:
            return 9, 0

        try:
            hour = int(parts[0])
            minute = int(parts[1])
        except ValueError:
            return 9, 0

        if not (0 <= hour <= 23 and 0 <= minute <= 59):
            return 9, 0

        return hour, minute

    @staticmethod
    def _load_timezone(name: str) -> ZoneInfo:
        try:
            return ZoneInfo(name)
        except ZoneInfoNotFoundError:
            print(f"Unknown timezone '{name}', falling back to UTC")
            return ZoneInfo("UTC")

    def _next_run_at(self) -> datetime:
        now = datetime.now(self.timezone)
        next_run = now.replace(hour=self.hour, minute=self.minute, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(days=1)
        return next_run

    def run_forever(self, task: Callable[[], object]):
        while True:
            next_run = self._next_run_at()
            sleep_seconds = max(0.0, (next_run - datetime.now(self.timezone)).total_seconds())
            print(
                "Next daily task at "
                f"{next_run.isoformat()} ({sleep_seconds / 60:.1f} minutes from now)"
            )
            time.sleep(sleep_seconds)
            task()
