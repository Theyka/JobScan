import time
from collections.abc import Callable


class IntervalScheduler:
    def __init__(self, interval_seconds: int):
        self.interval_seconds = max(1, int(interval_seconds))

    def run_forever(self, task: Callable[[], object]):
        while True:
            cycle_start = time.monotonic()
            task()
            elapsed = time.monotonic() - cycle_start
            sleep_seconds = max(0.0, self.interval_seconds - elapsed)
            print(f"Next scrape cycle in {sleep_seconds:.1f} seconds")
            time.sleep(sleep_seconds)
