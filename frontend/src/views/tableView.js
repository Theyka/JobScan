import { compactNumber, escapeHtml } from "../utils/format.js";

function formatCardDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function sourceMeta(source) {
  if (source === "glorri") {
    return {
      name: "Glorri",
      icon: "https://jobs.glorri.com/favicon.ico",
    };
  }

  return {
    name: "JobSearch.az",
    icon: "https://jobsearch.az/favicon.ico",
  };
}

function normalizeSafeImageUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }

  return "";
}

export class TableView {
  constructor() {
    this.jobsGrid = document.getElementById("jobs-grid");
    this.jobsTitle = document.getElementById("jobs-title");

    this.prevPageBtn = document.getElementById("prev-page");
    this.nextPageBtn = document.getElementById("next-page");
    this.pageInfo = document.getElementById("page-info");

    this.selectWrapper = document.getElementById("custom-select-wrapper");
    this.selectTrigger = document.getElementById("custom-select-trigger");
    this.selectOptions = document.getElementById("custom-select-options");
    this.selectDisplay = document.getElementById("items-per-page-display");
  }

  bindPageSizeChanged(handler) {
    if (!this.selectTrigger || !this.selectOptions) {
      return;
    }

    this.selectTrigger.addEventListener("click", (event) => {
      event.stopPropagation();
      this.toggleSelectMenu();
    });

    this.selectOptions.addEventListener("click", (event) => {
      const option = event.target.closest(".custom-option");
      if (!(option instanceof HTMLElement)) {
        return;
      }

      const value = Number.parseInt(option.dataset.value || "", 10);
      if (Number.isFinite(value)) {
        handler(value);
      }

      this.closeSelectMenu();
    });

    document.addEventListener("click", (event) => {
      if (!this.selectWrapper) {
        return;
      }

      const target = event.target;
      if (target instanceof Node && this.selectWrapper.contains(target)) {
        return;
      }

      this.closeSelectMenu();
    });
  }

  bindPagination(handler) {
    if (this.prevPageBtn) {
      this.prevPageBtn.addEventListener("click", () => {
        if (!this.prevPageBtn.disabled) {
          handler("prev");
        }
      });
    }

    if (this.nextPageBtn) {
      this.nextPageBtn.addEventListener("click", () => {
        if (!this.nextPageBtn.disabled) {
          handler("next");
        }
      });
    }
  }

  bindJobSelected(handler) {
    if (!this.jobsGrid) {
      return;
    }

    const resolveCard = (target) => {
      const card = target.closest("[data-job-source][data-job-slug][data-job-route]");
      if (!(card instanceof HTMLElement) || !this.jobsGrid.contains(card)) {
        return null;
      }

      const source = card.dataset.jobSource || "";
      const slug = card.dataset.jobSlug || "";
      const routePath = card.dataset.jobRoute || "";
      if (!source || !slug || !routePath) {
        return null;
      }

      return { source, slug, routePath };
    };

    this.jobsGrid.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest("[data-external-link]")) {
        return;
      }

      const selected = resolveCard(target);
      if (!selected) {
        return;
      }

      event.preventDefault();
      handler(selected);
    });

    this.jobsGrid.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest("[data-external-link]")) {
        return;
      }

      const selected = resolveCard(target);
      if (!selected) {
        return;
      }

      event.preventDefault();
      handler(selected);
    });
  }

  renderRows(rows) {
    if (!this.jobsGrid) {
      return;
    }

    if (!rows.length) {
      this.jobsGrid.innerHTML =
        '<div class="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">No jobs match your filters.</div>';
      return;
    }

    this.jobsGrid.innerHTML = rows
      .map((job) => {
        const meta = sourceMeta(job.source);
        const postedDate = formatCardDate(job.postedAt);

        const techStack = Array.isArray(job.techStack) ? job.techStack : [];
        const techs = techStack.slice(0, 5);
        const extraCount = Math.max(0, techStack.length - techs.length);

        const techMarkup = techs
          .map(
            (tech) =>
              `<span class="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 transition-colors">${escapeHtml(tech)}</span>`,
          )
          .join("");

        const extraMarkup =
          extraCount > 0
            ? `<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">+${extraCount}</span>`
            : "";

        const routePath = job.routePath ? escapeHtml(job.routePath) : "";
        const hasInternalRoute = Boolean(routePath);
        const routeAttributes = hasInternalRoute
          ? `data-job-source="${escapeHtml(job.source || "")}" data-job-slug="${escapeHtml(job.slug || "")}" data-job-route="${routePath}" tabindex="0" role="button" aria-label="Open ${escapeHtml(job.title || "Untitled")} details"`
          : "";
        const cardCursorClass = hasInternalRoute
          ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/70"
          : "";
        const companyLogoUrl = normalizeSafeImageUrl(job.companyLogo);
        const companyAvatar = companyLogoUrl
          ? `<img src="${escapeHtml(companyLogoUrl)}" alt="" class="w-6 h-6 object-contain rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-0.5" />`
          : '<div class="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md"><svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div>';

        return `
          <article class="block p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 group flex flex-col h-full ${cardCursorClass}" ${routeAttributes}>
            <div class="flex justify-between items-start mb-3">
              <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 leading-tight" title="${escapeHtml(job.title || "Untitled")}">${escapeHtml(job.title || "Untitled")}</h3>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap ml-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 px-2 py-1 rounded-full shadow-sm">${escapeHtml(postedDate)}</span>
            </div>

            <div class="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-300 text-sm font-medium">
              ${companyAvatar}
              <span class="truncate">${escapeHtml(job.company || "Unknown")}</span>
            </div>

            <div class="flex flex-wrap gap-2 mt-auto mb-3">
              ${techMarkup || '<span class="text-xs text-gray-400 dark:text-gray-500">No tech stack</span>'}
              ${extraMarkup}
            </div>

            <div class="flex justify-between items-center mt-2 pt-3 border-t border-gray-100 dark:border-gray-700 group-hover:border-gray-200 dark:group-hover:border-gray-600 transition-colors text-xs text-gray-400 dark:text-gray-500">
              <div class="flex flex-wrap gap-1.5 max-w-[70%]">
                <div class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600" title="${meta.name}">
                  <img src="${meta.icon}" class="w-3.5 h-3.5 rounded-sm" alt="" />
                  <span class="font-medium text-gray-500 dark:text-gray-400 text-[10px]">${meta.name}</span>
                </div>
              </div>
              ${
                hasInternalRoute
                  ? `<a href="${routePath}" class="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 px-3 py-1 rounded-md font-medium text-xs group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-500 dark:group-hover:text-white transition-all whitespace-nowrap">Details</a>`
                  : ""
              }
            </div>
          </article>
        `;
      })
      .join("");
  }

  renderPagination(state) {
    if (this.jobsTitle) {
      this.jobsTitle.textContent = `Jobs (${compactNumber(state.totalItems)})`;
    }

    if (this.pageInfo) {
      this.pageInfo.textContent = `Page ${state.page} of ${state.totalPages}`;
    }

    if (this.prevPageBtn) {
      this.prevPageBtn.disabled = !state.hasPrev;
    }

    if (this.nextPageBtn) {
      this.nextPageBtn.disabled = !state.hasNext;
    }

    if (this.selectDisplay) {
      this.selectDisplay.textContent = String(state.pageSize);
    }

    const options = this.selectOptions ? [...this.selectOptions.querySelectorAll(".custom-option")] : [];
    for (const option of options) {
      const selected = Number.parseInt(option.dataset.value || "", 10) === state.pageSize;
      option.classList.toggle("bg-blue-50", selected);
      option.classList.toggle("dark:bg-blue-900/30", selected);
      option.classList.toggle("text-blue-600", selected);
      option.classList.toggle("dark:text-blue-400", selected);
    }
  }

  toggleSelectMenu() {
    if (!this.selectOptions) {
      return;
    }

    const isHidden = this.selectOptions.classList.contains("hidden");
    if (isHidden) {
      this.selectOptions.classList.remove("hidden");
      window.setTimeout(() => {
        this.selectOptions.classList.remove("scale-95", "opacity-0");
        this.selectOptions.classList.add("scale-100", "opacity-100");
      }, 10);
      return;
    }

    this.closeSelectMenu();
  }

  closeSelectMenu() {
    if (!this.selectOptions || this.selectOptions.classList.contains("hidden")) {
      return;
    }

    this.selectOptions.classList.add("scale-95", "opacity-0");
    this.selectOptions.classList.remove("scale-100", "opacity-100");

    window.setTimeout(() => {
      this.selectOptions.classList.add("hidden");
    }, 200);
  }
}
