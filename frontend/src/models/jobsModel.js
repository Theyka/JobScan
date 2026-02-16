import { normalizeText } from "../utils/format.js";

export class JobsModel {
  constructor() {
    this.allJobs = [];
    this.filteredJobs = [];
    this.filters = {
      search: "",
      source: "all",
      salaryMin: null,
      salaryMax: null,
      companies: [],
      techs: [],
      pageSize: 20,
      page: 1,
    };
  }

  setJobs(jobs) {
    this.allJobs = Array.isArray(jobs) ? jobs : [];
    this.applyFilters();
  }

  setFilter(key, value) {
    this.filters[key] = value;
    if (key !== "page") {
      this.filters.page = 1;
    }
    this.applyFilters();
  }

  setFilters(nextFilters) {
    this.filters = {
      ...this.filters,
      ...nextFilters,
      page: 1,
    };
    this.applyFilters();
  }

  setPage(page) {
    this.filters.page = page;
    this.applyFilters();
  }

  getFilterOptions() {
    const companies = [...new Set(this.allJobs.map((job) => job.company).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    );

    const techSet = new Set();
    for (const job of this.allJobs) {
      for (const tech of job.techStack || []) {
        techSet.add(tech);
      }
    }

    const techs = [...techSet].sort((a, b) => a.localeCompare(b));
    return { companies, techs };
  }

  applyFilters() {
    const search = normalizeText(this.filters.search);
    const min = Number.isFinite(this.filters.salaryMin) ? this.filters.salaryMin : null;
    const max = Number.isFinite(this.filters.salaryMax) ? this.filters.salaryMax : null;

    this.filteredJobs = this.allJobs.filter((job) => {
      if (this.filters.source !== "all" && job.source !== this.filters.source) {
        return false;
      }

      if (this.filters.companies.length && !this.filters.companies.includes(job.company)) {
        return false;
      }

      if (this.filters.techs.length) {
        const techStack = Array.isArray(job.techStack) ? job.techStack : [];
        const hasSelectedTech = this.filters.techs.some((tech) => techStack.includes(tech));
        if (!hasSelectedTech) {
          return false;
        }
      }

      const salaryMin = Number.isFinite(job.salaryMin) ? job.salaryMin : null;
      const salaryMax = Number.isFinite(job.salaryMax) ? job.salaryMax : null;

      if (min !== null) {
        if (salaryMin === null && salaryMax === null) {
          return false;
        }
        if ((salaryMax ?? salaryMin ?? 0) < min) {
          return false;
        }
      }

      if (max !== null) {
        if (salaryMin === null && salaryMax === null) {
          return false;
        }
        if ((salaryMin ?? salaryMax ?? Number.MAX_SAFE_INTEGER) > max) {
          return false;
        }
      }

      if (!search) {
        return true;
      }

      const searchBlob = normalizeText(
        [
          job.title,
          job.company,
          job.source,
          job.sourceLabel,
          job.salaryText,
          job.salaryMin,
          job.salaryMax,
          (job.techStack || []).join(" "),
        ].join(" "),
      );

      return searchBlob.includes(search);
    });

    const totalPages = this.getTotalPages();
    if (this.filters.page > totalPages) {
      this.filters.page = totalPages;
    }
    if (this.filters.page < 1) {
      this.filters.page = 1;
    }
  }

  getTotalPages() {
    return Math.max(1, Math.ceil(this.filteredJobs.length / this.filters.pageSize));
  }

  getPagedJobs() {
    const start = (this.filters.page - 1) * this.filters.pageSize;
    return this.filteredJobs.slice(start, start + this.filters.pageSize);
  }

  getCollection(scope = "filtered") {
    return scope === "all" ? this.allJobs : this.filteredJobs;
  }

  getPaginationState() {
    const totalItems = this.filteredJobs.length;
    const totalPages = this.getTotalPages();
    return {
      page: this.filters.page,
      pageSize: this.filters.pageSize,
      totalItems,
      totalPages,
      hasPrev: this.filters.page > 1,
      hasNext: this.filters.page < totalPages,
    };
  }

  getTechFrequency(limit = null, scope = "filtered") {
    const collection = this.getCollection(scope);
    const counter = new Map();
    for (const job of collection) {
      for (const tech of job.techStack || []) {
        counter.set(tech, (counter.get(tech) || 0) + 1);
      }
    }

    const sorted = [...counter.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
    if (typeof limit === "number" && Number.isFinite(limit) && limit >= 0) {
      return sorted.slice(0, limit);
    }
    return sorted;
  }

  getSourceBreakdown(scope = "filtered") {
    const collection = this.getCollection(scope);
    const summary = { glorri: 0, jobsearch: 0, total: 0 };

    for (const job of collection) {
      if (job.source === "glorri") {
        summary.glorri += 1;
      } else if (job.source === "jobsearch") {
        summary.jobsearch += 1;
      }
    }

    summary.total = summary.glorri + summary.jobsearch;

    return summary;
  }

  getStats(scope = "filtered") {
    const collection = this.getCollection(scope);
    const techFrequency = this.getTechFrequency(null, scope);
    const jobsWithTechStack = collection.filter((job) => Array.isArray(job.techStack) && job.techStack.length > 0).length;

    return {
      jobsAnalyzed: collection.length,
      mostPopularLanguage: techFrequency.length ? techFrequency[0].name : "-",
      jobsWithTechStack,
      technologiesFound: techFrequency.length,
    };
  }
}
