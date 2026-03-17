import os
from dataclasses import dataclass
from pathlib import Path

DEFAULT_SCRAPE_INTERVAL_SECONDS = 600


def _clean_env_value(raw: str) -> str:
    value = raw.strip()
    if not value:
        return ""

    quoted = (
        (value.startswith('"') and value.endswith('"'))
        or (value.startswith("'") and value.endswith("'"))
    )
    if quoted and len(value) >= 2:
        return value[1:-1].strip()

    if "#" in value:
        value = value.split("#", 1)[0].strip()

    return value.strip().strip('"').strip("'")


def load_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values

    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue

        key, raw_value = stripped.split("=", 1)
        key = key.strip()
        if not key:
            continue

        values[key] = _clean_env_value(raw_value)

    return values


def _parse_positive_int(value: str, default: int) -> int:
    try:
        parsed = int(str(value).strip())
        return parsed if parsed > 0 else default
    except (TypeError, ValueError):
        return default


@dataclass
class Settings:
    supabase_url: str
    supabase_service_key: str
    scrape_interval_seconds: int
    telegram_bot_token: str
    telegram_channel_id: str
    telegram_bot_username: str
    telegram_digest_time: str
    telegram_timezone: str
    telegram_digest_limit: int



def load_settings(env_path: Path | None = None) -> Settings:
    if env_path is None:
        env_path = Path(__file__).resolve().parents[1] / ".env"

    env_values = load_env_file(env_path)

    supabase_url = (os.getenv("SUPABASE_URL") or env_values.get("SUPABASE_URL") or "").rstrip("/")
    supabase_service_key = (
        os.getenv("SUPABASE_SERVICE_KEY")
        or env_values.get("SUPABASE_SERVICE_KEY")
        or os.getenv("SUPABASE_KEY")
        or env_values.get("SUPABASE_KEY")
        or ""
    )

    interval_raw = os.getenv("SCRAPE_TIME_INTERVAL") or env_values.get("SCRAPE_TIME_INTERVAL", "")
    scrape_interval_seconds = _parse_positive_int(interval_raw, DEFAULT_SCRAPE_INTERVAL_SECONDS)
    telegram_bot_token = os.getenv("TELEGRAM_BOT_TOKEN") or env_values.get("TELEGRAM_BOT_TOKEN") or ""
    telegram_channel_id = os.getenv("TELEGRAM_CHANNEL_ID") or env_values.get("TELEGRAM_CHANNEL_ID") or ""
    telegram_bot_username = os.getenv("TELEGRAM_BOT_USERNAME") or env_values.get("TELEGRAM_BOT_USERNAME") or ""
    telegram_digest_time = os.getenv("TELEGRAM_DIGEST_TIME") or env_values.get("TELEGRAM_DIGEST_TIME") or "09:00"
    telegram_timezone = os.getenv("TELEGRAM_TIMEZONE") or env_values.get("TELEGRAM_TIMEZONE") or "Asia/Baku"
    telegram_digest_limit = _parse_positive_int(
        os.getenv("TELEGRAM_DIGEST_LIMIT") or env_values.get("TELEGRAM_DIGEST_LIMIT", ""),
        5,
    )

    return Settings(
        supabase_url=supabase_url,
        supabase_service_key=supabase_service_key,
        scrape_interval_seconds=scrape_interval_seconds,
        telegram_bot_token=telegram_bot_token,
        telegram_channel_id=telegram_channel_id,
        telegram_bot_username=telegram_bot_username,
        telegram_digest_time=telegram_digest_time,
        telegram_timezone=telegram_timezone,
        telegram_digest_limit=telegram_digest_limit,
    )
