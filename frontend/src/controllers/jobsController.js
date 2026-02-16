export class JobsController {
  constructor({ model, apiService, filtersView, dashboardView, tableView, themeService, jobDetailView }) {
    this.model = model;
    this.apiService = apiService;
    this.filtersView = filtersView;
    this.dashboardView = dashboardView;
    this.tableView = tableView;
    this.themeService = themeService;
    this.jobDetailView = jobDetailView;
    this.filterDebounce = null;
    this.detailRequestToken = 0;
    this.basePath = this.detectBasePath();
  }

  async init() {
    this.bindThemeControls();
    this.bindFilters();
    this.bindDashboardControls();
    this.bindTableControls();
    this.bindRouteControls();
    await this.loadJobs();
    await this.syncRouteWithView();
  }

  bindThemeControls() {
    const toggleButton = document.getElementById("theme-toggle");
    if (toggleButton) {
      const iconNode = toggleButton.querySelector(".theme-toggle-icon");

      const applyUiState = (state) => {
        const isDark = state.resolved === "dark";

        if (iconNode) {
          iconNode.textContent = isDark ? "☀️" : "🌙";
        }

        toggleButton.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
      };

      const initialState = this.themeService.apply(this.themeService.getSelectedTheme());
      applyUiState(initialState);

      toggleButton.addEventListener("click", () => {
        const resolved = document.documentElement.classList.contains("dark") ? "dark" : "light";
        const nextTheme = resolved === "dark" ? "light" : "dark";
        const nextState = this.themeService.apply(nextTheme);
        applyUiState(nextState);
        this.dashboardView.refreshTheme();
      });

      return;
    }

    const buttons = [...document.querySelectorAll(".theme-btn")];
    if (!buttons.length) {
      return;
    }

    const activeClasses = [
      "bg-brand-50",
      "text-brand-600",
      "dark:bg-brand-500/20",
      "dark:text-brand-300",
    ];
    const inactiveClasses = [
      "text-slate-600",
      "hover:bg-slate-100",
      "dark:text-slate-300",
      "dark:hover:bg-slate-800",
    ];

    const refreshButtons = (selectedTheme) => {
      buttons.forEach((button) => {
        const isActive = button.dataset.theme === selectedTheme;
        button.classList.remove(...(isActive ? inactiveClasses : activeClasses));
        button.classList.add(...(isActive ? activeClasses : inactiveClasses));
      });
    };

    refreshButtons(this.themeService.getSelectedTheme());

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const selected = button.dataset.theme || "system";
        const state = this.themeService.apply(selected);
        refreshButtons(state.selected);
        this.dashboardView.refreshTheme();
      });
    });
  }

  bindFilters() {
    this.filtersView.bindFiltersChanged((filters) => {
      window.clearTimeout(this.filterDebounce);
      this.filterDebounce = window.setTimeout(() => {
        this.model.setFilters(filters);
        this.renderAll();
      }, 120);
    });
  }

  bindDashboardControls() {
    this.dashboardView.bindTechSelection((techName) => {
      this.filtersView.toggleTechFilter(techName);
      this.model.setFilters(this.filtersView.getFilterState());
      this.renderAll();
    });
  }

  bindTableControls() {
    this.tableView.bindPageSizeChanged((pageSize) => {
      this.model.setFilter("pageSize", pageSize);
      this.renderAll();
    });

    this.tableView.bindPagination((action) => {
      const { page } = this.model.getPaginationState();
      if (action === "prev") {
        this.model.setPage(page - 1);
      } else if (action === "next") {
        this.model.setPage(page + 1);
      }
      this.renderAll();
    });

    this.tableView.bindJobSelected(async ({ source, slug, routePath }) => {
      await this.openJobRoute(source, slug, routePath);
    });
  }

  bindRouteControls() {
    if (this.jobDetailView) {
      this.jobDetailView.bindClose(() => {
        this.closeJobDetail(true);
      });
    }

    window.addEventListener("popstate", () => {
      this.syncRouteWithView();
    });
  }

  async loadJobs() {
    this.dashboardView.renderError("");

    try {
      const jobs = await this.apiService.getJobs();
      this.model.setJobs(jobs);

      const options = this.model.getFilterOptions();
      this.filtersView.renderCompanies(options.companies);
      this.filtersView.renderTechs(options.techs);

      this.renderAll();
    } catch (error) {
      this.model.setJobs([]);
      this.renderAll();
      this.dashboardView.renderError(error instanceof Error ? error.message : String(error));
    } finally {
      this.dashboardView.hideLoading();
    }
  }

  renderAll() {
    const pagedJobs = this.model.getPagedJobs();
    const paginationState = this.model.getPaginationState();
    const stats = this.model.getStats("all");
    const techFrequency = this.model.getTechFrequency(15);
    const sourceBreakdown = this.model.getSourceBreakdown("all");

    this.tableView.renderRows(pagedJobs);
    this.tableView.renderPagination(paginationState);
    this.dashboardView.renderStats(stats);
    this.dashboardView.renderTechChart(techFrequency);
    this.dashboardView.renderSourceBreakdown(sourceBreakdown);
  }

  parseDetailRoute(pathname) {
    const normalized = String(pathname || "")
      .replace(/^\/+|\/+$/g, "")
      .trim();

    const baseSegment = this.basePath.replace(/^\/+/, "");

    if (
      !normalized ||
      normalized === "index.html" ||
      (baseSegment && (normalized === baseSegment || normalized === `${baseSegment}/index.html`))
    ) {
      return null;
    }

    const rawSegments = normalized.split("/");
    const segments = baseSegment && rawSegments[0] === baseSegment ? rawSegments.slice(1) : rawSegments;

    if (segments.length !== 2) {
      return null;
    }

    let source = "";
    let slug = "";
    try {
      source = decodeURIComponent(segments[0] || "").toLowerCase();
      slug = decodeURIComponent(segments[1] || "").trim();
    } catch (_error) {
      return null;
    }

    if (!slug || (source !== "jobsearch" && source !== "glorri")) {
      return null;
    }

    return { source, slug };
  }

  async syncRouteWithView() {
    const route = this.parseDetailRoute(window.location.pathname);
    if (!route) {
      this.closeJobDetail(false);
      return;
    }

    await this.loadJobDetail(route.source, route.slug);
  }

  async openJobRoute(source, slug, routePath = "") {
    const normalizedSource = String(source || "").toLowerCase().trim();
    const normalizedSlug = String(slug || "").trim();

    if (!normalizedSource || !normalizedSlug) {
      return;
    }

    const nextPath = this.getDetailPath(normalizedSource, normalizedSlug);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ source: normalizedSource, slug: normalizedSlug }, "", nextPath);
    }

    await this.loadJobDetail(normalizedSource, normalizedSlug);
  }

  closeJobDetail(updateHistory) {
    this.detailRequestToken += 1;

    if (this.jobDetailView) {
      this.jobDetailView.hide();
    }

    const dashboardPath = this.getDashboardPath();
    if (updateHistory && window.location.pathname !== dashboardPath) {
      window.history.pushState({}, "", dashboardPath);
    }
  }

  async loadJobDetail(source, slug) {
    if (!this.jobDetailView) {
      return;
    }

    const currentToken = ++this.detailRequestToken;
    this.jobDetailView.showLoading(source, slug);

    try {
      const detail = await this.apiService.getJobDetail(source, slug);
      if (currentToken !== this.detailRequestToken) {
        return;
      }

      if (!detail) {
        this.jobDetailView.showError(`Vacancy not found for route "${source}/${slug}".`);
        return;
      }

      this.jobDetailView.render(detail);
    } catch (error) {
      if (currentToken !== this.detailRequestToken) {
        return;
      }

      this.jobDetailView.showError(error instanceof Error ? error.message : String(error));
    }
  }

  detectBasePath() {
    const pathname = String(window.location.pathname || "/");
    if (pathname === "/frontend" || pathname.startsWith("/frontend/")) {
      return "/frontend";
    }

    return "";
  }

  getDashboardPath() {
    return this.basePath ? `${this.basePath}/` : "/";
  }

  getDetailPath(source, slug) {
    const slugPart = encodeURIComponent(String(slug || "").trim());
    const sourcePart = String(source || "").toLowerCase().trim();
    const base = this.basePath || "";
    return `${base}/${sourcePart}/${slugPart}`.replace(/\/+/g, "/");
  }
}
