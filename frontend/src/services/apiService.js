import { normalizeTechStack, parseSalaryFromUnknown } from "../utils/format.js";

export class ApiService {
  constructor({ supabaseUrl, supabaseAnonKey }) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseAnonKey = supabaseAnonKey;
    this.pageSize = 1000;
    this.requestTimeoutMs = 15000;
  }

  get headers() {
    return {
      apikey: this.supabaseAnonKey,
      Authorization: `Bearer ${this.supabaseAnonKey}`,
      Accept: "application/json",
    };
  }

  async requestJson(url, contextLabel, extraHeaders = {}) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, this.requestTimeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          ...this.headers,
          ...extraHeaders,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Supabase request failed ${contextLabel}: ${response.status} ${detail}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error(`Supabase request timed out ${contextLabel} after ${this.requestTimeoutMs}ms`);
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Supabase request error ${contextLabel}: ${message}`);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async fetchAll(table, select, orderBy = "id") {
    const rows = [];
    let offset = 0;
    const maxPages = 1000;
    let page = 0;

    while (true) {
      const url = new URL(`${this.supabaseUrl}/rest/v1/${table}`);
      url.searchParams.set("select", select);
      url.searchParams.set("order", `${orderBy}.asc`);
      url.searchParams.set("limit", String(this.pageSize));
      url.searchParams.set("offset", String(offset));

      const chunk = await this.requestJson(url, `(${table})`);
      if (!Array.isArray(chunk) || chunk.length === 0) {
        break;
      }

      rows.push(...chunk);

      if (chunk.length < this.pageSize) {
        break;
      }

      offset += this.pageSize;
      page += 1;
      if (page >= maxPages) {
        throw new Error(`Supabase pagination guard triggered (${table})`);
      }
    }

    return rows;
  }

  async fetchSingle(table, select, filters = {}) {
    const url = new URL(`${this.supabaseUrl}/rest/v1/${table}`);
    url.searchParams.set("select", select);
    url.searchParams.set("limit", "1");

    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined || value === "") {
        continue;
      }

      url.searchParams.set(key, `eq.${value}`);
    }

    const rows = await this.requestJson(url, `(${table})`);
    if (!Array.isArray(rows) || !rows.length) {
      return null;
    }

    return rows[0];
  }

  static buildRoutePath(source, slug) {
    const normalizedSource = String(source || "").toLowerCase().trim();
    const normalizedSlug = String(slug || "").trim();

    if (!normalizedSource || !normalizedSlug) {
      return "";
    }

    return `/${normalizedSource}/${encodeURIComponent(normalizedSlug)}`;
  }

  static normalizeListItems(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((entry) => {
        if (typeof entry === "string") {
          return entry.trim();
        }

        if (entry && typeof entry === "object") {
          const candidate = entry.value || entry.phone || entry.number || entry.title || entry.name || "";
          return String(candidate).trim();
        }

        return "";
      })
      .filter(Boolean);
  }

  static normalizeSites(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((entry) => {
        if (typeof entry === "string") {
          const trimmed = entry.trim();
          if (!trimmed) {
            return null;
          }

          return { label: trimmed, url: trimmed };
        }

        if (!entry || typeof entry !== "object") {
          return null;
        }

        const url = String(entry.url || entry.href || "").trim();
        if (!url) {
          return null;
        }

        const label = String(entry.title || entry.name || url).trim() || url;
        return { label, url };
      })
      .filter(Boolean);
  }

  static formatAboutEntries(value, skipKeys = []) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return [];
    }

    const skipSet = new Set(skipKeys.map((item) => String(item)));

    return Object.entries(value)
      .filter(([key, rawValue]) => {
        if (skipSet.has(key)) {
          return false;
        }

        if (rawValue === null || rawValue === undefined) {
          return false;
        }

        return String(rawValue).trim() !== "";
      })
      .map(([key, rawValue]) => ({
        key,
        label: key
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replaceAll("_", " ")
          .replaceAll("-", " ")
          .replace(/\s+/g, " ")
          .trim()
          .replace(/\b\w/g, (char) => char.toUpperCase()),
        value: String(rawValue).trim(),
      }));
  }

  static toAbsoluteGlorriLogo(logo) {
    const raw = String(logo || "").trim();
    if (!raw) {
      return "";
    }

    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }

    const cleaned = raw.replace(/^\/+/, "");
    if (!cleaned) {
      return "";
    }

    if (cleaned.startsWith("public/")) {
      return `https://glorri.s3.eu-central-1.amazonaws.com/${cleaned}`;
    }

    return `https://glorri.s3.eu-central-1.amazonaws.com/public/${cleaned}`;
  }

  static toAbsoluteJobSearchLogo(logo) {
    const raw = String(logo || "").trim();
    if (!raw) {
      return "";
    }

    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }

    if (raw.startsWith("//")) {
      return `https:${raw}`;
    }

    const cleaned = raw.replace(/^\/+/, "");
    if (!cleaned) {
      return "";
    }

    return `https://jobsearch.az/${cleaned}`;
  }

  static normalizeCoordinates(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    const lat = Number(value.lat);
    const lng = Number(value.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { lat, lng };
  }

  static normalizeJobSearch(vacancy, companiesMap) {
    const salary = parseSalaryFromUnknown(vacancy.salary);
    const companyData = companiesMap.get(vacancy.company_id) || {};
    const companyName = companyData.name || "Unknown";
    const slug = String(vacancy.slug || "").trim();

    return {
      uid: `jobsearch-${vacancy.id}`,
      source: "jobsearch",
      sourceLabel: "JobSearch",
      id: vacancy.id,
      title: vacancy.title || "Untitled",
      company: companyName,
      companyLogo: companyData.logo || "",
      salaryMin: salary.min,
      salaryMax: salary.max,
      salaryText: salary.text,
      techStack: normalizeTechStack(vacancy.tech_stack),
      postedAt: vacancy.created_at || "",
      deadlineAt: vacancy.deadline_at || "",
      location: "",
      jobType: "",
      slug,
      routePath: ApiService.buildRoutePath("jobsearch", slug),
      detailUrl: slug ? `https://jobsearch.az/vacancies/${slug}` : "",
    };
  }

  static normalizeGlorri(vacancy, glorriCompaniesMap) {
    const companyId =
      typeof vacancy.company_id === "number"
        ? vacancy.company_id
        : Number.parseInt(String(vacancy.company_id || ""), 10);
    const companyData = Number.isFinite(companyId) ? glorriCompaniesMap.get(companyId) || {} : {};
    const companyName = companyData.name || "Unknown";

    const salarySource =
      vacancy?.vacancy_about && typeof vacancy.vacancy_about === "object"
        ? vacancy.vacancy_about.salary || ""
        : "";
    const salary = parseSalaryFromUnknown(salarySource);
    const slug = String(vacancy.slug || "").trim();

    const detailUrl =
      vacancy.detail_url ||
      (companyData.slug && slug
        ? `https://jobs.glorri.com/vacancies/${companyData.slug}/${slug}`
        : "");

    return {
      uid: `glorri-${vacancy.id}`,
      source: "glorri",
      sourceLabel: "Glorri",
      id: vacancy.id,
      title: vacancy.title || "Untitled",
      company: companyName,
      companyLogo: ApiService.toAbsoluteGlorriLogo(companyData.logo),
      salaryMin: salary.min,
      salaryMax: salary.max,
      salaryText: salary.text,
      techStack: normalizeTechStack(vacancy.tech_stack),
      postedAt: vacancy.postedDate || "",
      deadlineAt:
        vacancy?.vacancy_about && typeof vacancy.vacancy_about === "object"
          ? vacancy.vacancy_about.deadline || ""
          : "",
      location: vacancy.location || "",
      jobType: vacancy.type || "",
      slug,
      routePath: ApiService.buildRoutePath("glorri", slug),
      detailUrl,
    };
  }

  async getJobDetail(source, slug) {
    const normalizedSource = String(source || "").toLowerCase().trim();
    const normalizedSlug = String(slug || "").trim();

    if (!normalizedSource || !normalizedSlug) {
      return null;
    }

    if (normalizedSource === "jobsearch") {
      return this.getJobSearchDetail(normalizedSlug);
    }

    if (normalizedSource === "glorri") {
      return this.getGlorriDetail(normalizedSlug);
    }

    return null;
  }

  async getJobSearchDetail(slug) {
    const vacancy = await this.fetchSingle(
      "js_vacancies",
      "id,title,created_at,slug,salary,deadline_at,text,tech_stack,company_id",
      { slug },
    );

    if (!vacancy) {
      return null;
    }

    const company =
      vacancy.company_id !== null && vacancy.company_id !== undefined
        ? await this.fetchSingle(
            "js_companies",
            "id,title,logo,logo_mini,first_char,created_at,text,address,phones,sites,email,cover,coordinates",
            { id: vacancy.company_id },
          )
        : null;

    const normalizedSlug = String(vacancy.slug || slug).trim();
    const salary = parseSalaryFromUnknown(vacancy.salary);
    const externalUrl = normalizedSlug ? `https://jobsearch.az/vacancies/${normalizedSlug}` : "";

    return {
      source: "jobsearch",
      sourceLabel: "JobSearch.az",
      title: vacancy.title || "Untitled",
      slug: normalizedSlug,
      routePath: ApiService.buildRoutePath("jobsearch", normalizedSlug),
      postedAt: vacancy.created_at || "",
      deadlineAt: vacancy.deadline_at || "",
      salaryText: salary.text,
      location: company?.address || "",
      jobType: "",
      techStack: normalizeTechStack(vacancy.tech_stack),
      descriptionHtml: String(vacancy.text || ""),
      requirementsHtml: "",
      benefits: [],
      applyUrl: externalUrl,
      externalUrl,
      about: [],
      company: {
        id: company?.id ?? null,
        name: company?.title || "Unknown",
        firstChar: String(company?.first_char || "").trim(),
        createdAt: company?.created_at || "",
        logo: String(company?.logo_mini || company?.logo || "").trim(),
        cover: ApiService.toAbsoluteJobSearchLogo(company?.cover || ""),
        coordinates: ApiService.normalizeCoordinates(company?.coordinates),
        descriptionHtml: String(company?.text || ""),
        address: String(company?.address || "").trim(),
        phones: ApiService.normalizeListItems(company?.phones),
        sites: ApiService.normalizeSites(company?.sites),
        emails: ApiService.normalizeListItems(company?.email),
      },
    };
  }

  async getGlorriDetail(slug) {
    const vacancy = await this.fetchSingle(
      "glorri_vacancies",
      "id,title,slug,postedDate,jobFunction,careerLevel,location,type,detail_url,description_html,requirements_html,vacancy_about,benefits,apply_url,company_id,tech_stack",
      { slug },
    );

    if (!vacancy) {
      return null;
    }

    const company =
      vacancy.company_id !== null && vacancy.company_id !== undefined
        ? await this.fetchSingle("glorri_companies", "id,name,slug,logo,created_at", { id: vacancy.company_id })
        : null;

    const normalizedSlug = String(vacancy.slug || slug).trim();
    const vacancyAbout =
      vacancy.vacancy_about && typeof vacancy.vacancy_about === "object" ? vacancy.vacancy_about : {};
    const salary = parseSalaryFromUnknown(vacancyAbout.salary || "");
    const externalUrl =
      vacancy.detail_url ||
      (company?.slug && normalizedSlug ? `https://jobs.glorri.com/vacancies/${company.slug}/${normalizedSlug}` : "");

    return {
      source: "glorri",
      sourceLabel: "Glorri",
      title: vacancy.title || "Untitled",
      slug: normalizedSlug,
      routePath: ApiService.buildRoutePath("glorri", normalizedSlug),
      postedAt: vacancyAbout.posted || "",
      deadlineAt: vacancyAbout.deadline || "",
      salaryText: salary.text,
      location: vacancy.location || "",
      jobType: vacancy.type || vacancyAbout.job_type || "",
      techStack: normalizeTechStack(vacancy.tech_stack),
      descriptionHtml: String(vacancy.description_html || ""),
      requirementsHtml: String(vacancy.requirements_html || ""),
      benefits: ApiService.normalizeListItems(vacancy.benefits),
      applyUrl: String(vacancy.apply_url || externalUrl || "").trim(),
      externalUrl: String(externalUrl || "").trim(),
      about: ApiService.formatAboutEntries(vacancyAbout, ["posted", "salary", "deadline", "job_type"]),
      company: {
        id: company?.id ?? null,
        name: company?.name || "Unknown",
        firstChar: "",
        createdAt: company?.created_at || "",
        logo: ApiService.toAbsoluteGlorriLogo(company?.logo),
        cover: "",
        coordinates: null,
        descriptionHtml: "",
        address: "",
        phones: [],
        sites: [],
        emails: [],
      },
    };
  }

  async getJobs() {
    const [jsVacancies, jsCompanies, glorriVacancies, glorriCompanies] = await Promise.all([
      this.fetchAll(
        "js_vacancies",
        "id,title,created_at,slug,salary,deadline_at,tech_stack,company_id",
      ),
      this.fetchAll("js_companies", "id,title,logo,logo_mini"),
      this.fetchAll(
        "glorri_vacancies",
        "id,title,slug,postedDate,location,type,company_id,vacancy_about,detail_url,tech_stack",
      ),
      this.fetchAll("glorri_companies", "id,name,slug,logo"),
    ]);

    const companiesMap = new Map(
      jsCompanies
        .filter((company) => company && company.id !== undefined)
        .map((company) => [
          company.id,
          {
            name: company.title || "Unknown",
            logo: ApiService.toAbsoluteJobSearchLogo(company.logo_mini || company.logo || ""),
          },
        ]),
    );

    const glorriCompaniesMap = new Map(
      glorriCompanies
        .filter((company) => company && company.id !== undefined)
        .map((company) => [
          company.id,
          {
            name: company.name || "Unknown",
            slug: company.slug || "",
            logo: company.logo || "",
          },
        ]),
    );

    const normalizedJobSearch = jsVacancies.map((vacancy) => ApiService.normalizeJobSearch(vacancy, companiesMap));
    const normalizedGlorri = glorriVacancies.map((vacancy) =>
      ApiService.normalizeGlorri(vacancy, glorriCompaniesMap),
    );

    return [...normalizedJobSearch, ...normalizedGlorri].sort((a, b) => {
      const aTime = new Date(a.postedAt || 0).getTime();
      const bTime = new Date(b.postedAt || 0).getTime();
      return bTime - aTime;
    });
  }
}
