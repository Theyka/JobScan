import re
from html import unescape

from app.models.technologies import TECHNOLOGIES


class TechnologyService:
    def __init__(self, technologies: dict[str, list[str]] | None = None):
        self.technologies = technologies or TECHNOLOGIES
        self._compiled_patterns: list[tuple[str, list[re.Pattern[str]]]] = []

        for tech, keywords in self.technologies.items():
            patterns = [re.compile(self._build_regex_pattern(keyword), re.IGNORECASE) for keyword in keywords if keyword]
            self._compiled_patterns.append((tech, patterns))

    @staticmethod
    def strip_html(text: str) -> str:
        if not isinstance(text, str):
            return ""
        text = re.sub(r"(?is)<!--.*?-->", " ", text)
        text = re.sub(r"(?is)<br\s*/?>", "\n", text)
        text = re.sub(r"(?is)<[^>]+>", " ", text)
        text = unescape(text).replace("\xa0", " ")
        text = re.sub(r"\s+", " ", text)
        return text.strip()

    @staticmethod
    def _build_regex_pattern(keyword: str) -> str:
        pattern = re.escape(keyword)

        if keyword[0].isalnum() or keyword[0] == "_":
            pattern = r"\b" + pattern
        else:
            pattern = r"(?:^|\s)" + pattern

        if keyword[-1].isalnum() or keyword[-1] == "_":
            pattern = pattern + r"\b"
        else:
            pattern = pattern + r"(?:$|[\s,.;/\(\)])"

        return pattern

    def extract(self, text: str) -> list[str]:
        clean_text = self.strip_html(text)
        if not clean_text:
            return []

        found: list[str] = []
        for tech, patterns in self._compiled_patterns:
            if any(pattern.search(clean_text) for pattern in patterns):
                found.append(tech)
        return found
