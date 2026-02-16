import re
from collections import defaultdict
from difflib import SequenceMatcher
from html import unescape

from app.repositories.supabase_repository import SupabaseRepository


class DuplicateDetectionService:
    COMPANY_BLOCK_THRESHOLD = 0.35
    QUICK_SCORE_THRESHOLD = 0.35
    SCORE_THRESHOLD = 0.72

    MAX_TEXT_COMPARE_CHARS = 4000
    MAX_CANDIDATES_PER_GLORRI_JOB = 40

    def __init__(self, repository: SupabaseRepository):
        self.repository = repository

    @staticmethod
    def _to_int(value) -> int | None:
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _normalize_text(value) -> str:
        raw = str(value or "")
        raw = unescape(raw).replace("\xa0", " ")
        raw = re.sub(r"(?is)<[^>]+>", " ", raw)
        raw = re.sub(r"[\u200B-\u200D\u2060\uFEFF]", "", raw)
        raw = raw.lower()
        raw = re.sub(r"[^\w\s]", " ", raw, flags=re.UNICODE)
        raw = re.sub(r"\s+", " ", raw)
        return raw.strip()

    @staticmethod
    def _ratio(left: str, right: str) -> float:
        if not left or not right:
            return 0.0
        if left == right:
            return 1.0
        return SequenceMatcher(None, left, right).ratio()

    @staticmethod
    def _tech_set(value) -> set[str]:
        if not isinstance(value, list):
            return set()
        return {str(item).strip().lower() for item in value if str(item).strip()}

    @staticmethod
    def _jaccard(left: set[str], right: set[str]) -> float:
        if not left or not right:
            return 0.0
        intersection = len(left.intersection(right))
        union = len(left.union(right))
        if union == 0:
            return 0.0
        return intersection / union

    def _prepare_company_names(self, rows: list[dict], name_key: str) -> dict[int, str]:
        names: dict[int, str] = {}
        for row in rows:
            company_id = self._to_int(row.get("id"))
            if company_id is None:
                continue
            names[company_id] = self._normalize_text(row.get(name_key))
        return names

    def _prepare_vacancies(self, rows: list[dict], company_names: dict[int, str]) -> list[dict]:
        jobs: list[dict] = []
        for row in rows:
            vacancy_id = self._to_int(row.get("id"))
            company_id = self._to_int(row.get("company_id"))
            if vacancy_id is None or company_id is None:
                continue

            jobs.append(
                {
                    "id": vacancy_id,
                    "company_id": company_id,
                    "company_name": company_names.get(company_id, ""),
                    "title": self._normalize_text(row.get("title")),
                    "text": self._normalize_text(row.get("text"))[: self.MAX_TEXT_COMPARE_CHARS],
                    "tech": self._tech_set(row.get("tech_stack")),
                }
            )
        return jobs

    def _select_duplicate_pairs(self, glorri_jobs: list[dict], jobsearch_jobs: list[dict]) -> list[dict]:
        if not glorri_jobs or not jobsearch_jobs:
            return []

        js_by_id = {job["id"]: job for job in jobsearch_jobs}
        js_ids_by_company: dict[int, set[int]] = defaultdict(set)
        js_ids_by_tech: dict[str, set[int]] = defaultdict(set)

        for js in jobsearch_jobs:
            js_ids_by_company[js["company_id"]].add(js["id"])
            for tech in js["tech"]:
                js_ids_by_tech[tech].add(js["id"])

        js_company_ids = sorted(js_ids_by_company.keys())
        company_similarity_cache: dict[tuple[int, int], float] = {}
        pair_candidates: list[dict] = []

        for glorri in glorri_jobs:
            candidate_ids: set[int] = set()
            glorri_company_id = glorri["company_id"]
            glorri_company_name = glorri["company_name"]

            for js_company_id in js_company_ids:
                key = (glorri_company_id, js_company_id)
                company_sim = company_similarity_cache.get(key)
                if company_sim is None:
                    js_company_name = js_by_id[next(iter(js_ids_by_company[js_company_id]))]["company_name"]
                    company_sim = self._ratio(glorri_company_name, js_company_name)
                    company_similarity_cache[key] = company_sim

                if company_sim >= self.COMPANY_BLOCK_THRESHOLD:
                    candidate_ids.update(js_ids_by_company[js_company_id])

            for tech in glorri["tech"]:
                candidate_ids.update(js_ids_by_tech.get(tech, set()))

            if not candidate_ids:
                continue

            quick_scored: list[tuple[float, int, float, float, float]] = []
            for js_id in candidate_ids:
                js = js_by_id[js_id]
                company_sim = self._ratio(glorri["company_name"], js["company_name"])
                title_sim = self._ratio(glorri["title"], js["title"])
                tech_sim = self._jaccard(glorri["tech"], js["tech"])
                quick_score = (0.55 * company_sim) + (0.30 * title_sim) + (0.15 * tech_sim)
                if quick_score < self.QUICK_SCORE_THRESHOLD:
                    continue
                quick_scored.append((quick_score, js_id, company_sim, title_sim, tech_sim))

            quick_scored.sort(reverse=True, key=lambda item: item[0])

            for _, js_id, company_sim, title_sim, tech_sim in quick_scored[: self.MAX_CANDIDATES_PER_GLORRI_JOB]:
                js = js_by_id[js_id]
                text_sim = self._ratio(glorri["text"], js["text"])
                score = (0.55 * text_sim) + (0.20 * company_sim) + (0.15 * title_sim) + (0.10 * tech_sim)

                if score < self.SCORE_THRESHOLD:
                    continue

                pair_candidates.append(
                    {
                        "glorri_id": glorri["id"],
                        "jobsearch_id": js["id"],
                        "score": round(score, 4),
                    }
                )

        pair_candidates.sort(key=lambda item: item["score"], reverse=True)

        selected_pairs: list[dict] = []
        used_glorri_ids: set[int] = set()
        used_jobsearch_ids: set[int] = set()

        for pair in pair_candidates:
            glorri_id = pair["glorri_id"]
            jobsearch_id = pair["jobsearch_id"]
            if glorri_id in used_glorri_ids or jobsearch_id in used_jobsearch_ids:
                continue

            selected_pairs.append(pair)
            used_glorri_ids.add(glorri_id)
            used_jobsearch_ids.add(jobsearch_id)

        return selected_pairs

    def run(self) -> dict[str, int]:
        if not self.repository.is_configured:
            print("Duplicate check skipped: missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
            return {"jobsearch": 0, "glorri": 0, "matched": 0}

        js_company_rows = self.repository.fetch_js_companies_for_duplicate_scan()
        glorri_company_rows = self.repository.fetch_glorri_companies_for_duplicate_scan()
        js_vacancy_rows = self.repository.fetch_js_vacancies_for_duplicate_scan()
        glorri_vacancy_rows = self.repository.fetch_glorri_vacancies_for_duplicate_scan()

        js_company_names = self._prepare_company_names(js_company_rows, "title")
        glorri_company_names = self._prepare_company_names(glorri_company_rows, "name")
        js_jobs = self._prepare_vacancies(js_vacancy_rows, js_company_names)
        glorri_jobs = self._prepare_vacancies(glorri_vacancy_rows, glorri_company_names)

        duplicate_pairs = self._select_duplicate_pairs(glorri_jobs, js_jobs)
        self.repository.replace_duplicate_jobs(duplicate_pairs)

        print(
            "Duplicate check: "
            f"jobsearch={len(js_jobs)}, glorri={len(glorri_jobs)}, matched={len(duplicate_pairs)}"
        )

        return {
            "jobsearch": len(js_jobs),
            "glorri": len(glorri_jobs),
            "matched": len(duplicate_pairs),
        }
