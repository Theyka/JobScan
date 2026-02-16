import { normalizeText } from "../utils/format.js";

const ACTIVE_BUTTON_CLASSES = [
  "bg-blue-50",
  "dark:bg-blue-900/30",
  "text-blue-600",
  "dark:text-blue-400",
  "border-blue-200",
  "dark:border-blue-800",
];

const INACTIVE_BUTTON_CLASSES = [
  "border-gray-200",
  "dark:border-gray-700",
  "text-gray-600",
  "dark:text-gray-400",
  "hover:bg-gray-50",
  "dark:hover:bg-gray-700",
];

const TAG_BASE_CLASSES = [
  "inline-flex",
  "items-center",
  "px-3",
  "py-1",
  "rounded-full",
  "text-sm",
  "font-medium",
  "cursor-pointer",
  "transition-colors",
  "border",
];

const TAG_INACTIVE_CLASSES = [
  "bg-gray-100",
  "dark:bg-gray-700",
  "text-gray-700",
  "dark:text-gray-300",
  "border-gray-200",
  "dark:border-gray-600",
  "hover:bg-gray-200",
  "dark:hover:bg-gray-600",
];

const COMPANY_ACTIVE_CLASSES = [
  "bg-purple-100",
  "dark:bg-purple-900",
  "text-purple-800",
  "dark:text-purple-100",
  "border-purple-200",
  "dark:border-purple-700",
  "ring-2",
  "ring-purple-500",
  "ring-offset-1",
  "dark:ring-offset-gray-800",
];

const TECH_ACTIVE_CLASSES = [
  "bg-blue-100",
  "dark:bg-blue-900",
  "text-blue-800",
  "dark:text-blue-100",
  "border-blue-200",
  "dark:border-blue-700",
  "ring-2",
  "ring-blue-500",
  "ring-offset-1",
  "dark:ring-offset-gray-800",
];

export class FiltersView {
  constructor() {
    this.searchInputs = [...document.querySelectorAll(".search-input")];

    this.sourceFilterGroup = document.getElementById("sourceFilterGroup");
    this.sourceButtons = this.sourceFilterGroup
      ? [...this.sourceFilterGroup.querySelectorAll(".source-filter-btn")]
      : [];

    this.salaryRangeGroup = document.getElementById("salaryRangeGroup");
    this.salaryButtons = this.salaryRangeGroup
      ? [...this.salaryRangeGroup.querySelectorAll(".salary-filter-btn")]
      : [];

    this.companyFilterInput = document.getElementById("company-filter");
    this.companiesContainer = document.getElementById("all-companies-container");

    this.techFilterInput = document.getElementById("tech-filter");
    this.techsContainer = document.getElementById("all-techs-container");

    this.toggleAllCompaniesBtn = document.getElementById("toggle-all-companies");
    this.companyFilterWrapper = document.getElementById("company-filter-wrapper");

    this.toggleAllTechsBtn = document.getElementById("toggle-all-techs");
    this.techFilterWrapper = document.getElementById("tech-filter-wrapper");

    this.activeFilter = document.getElementById("active-filter");
    this.filterText = document.getElementById("filter-text");
    this.clearFilterBtn = document.getElementById("clear-filter-btn");

    this.sidebar = document.getElementById("filters-sidebar");
    this.mobileFilterBtn = document.getElementById("mobile-filter-btn");
    this.closeSidebarBtn = document.getElementById("close-sidebar");
    this.sidebarOverlay = document.getElementById("sidebar-overlay");

    this.selectedSource = "all";
    this.selectedSalaryMin = null;
    this.selectedSalaryMax = null;
    this.selectedCompanies = new Set();
    this.selectedTechs = new Set();

    this.allCompanies = [];
    this.allTechs = [];

    this.applySourceSelection();
    this.applySalarySelection();
    this.bindSidebarControls();
    this.bindToggleControls();
    this.updateActiveFilterBadge();
  }

  renderCompanies(companies) {
    this.allCompanies = Array.isArray(companies) ? [...companies] : [];

    const available = new Set(this.allCompanies);
    this.selectedCompanies = new Set([...this.selectedCompanies].filter((item) => available.has(item)));

    this.renderCompanyTags();
    this.updateActiveFilterBadge();
  }

  renderTechs(techs) {
    this.allTechs = Array.isArray(techs) ? [...techs] : [];

    const available = new Set(this.allTechs);
    this.selectedTechs = new Set([...this.selectedTechs].filter((item) => available.has(item)));

    this.renderTechTags();
    this.updateActiveFilterBadge();
  }

  bindFiltersChanged(handler) {
    const trigger = () => {
      this.updateActiveFilterBadge();
      handler(this.getFilterState());
    };

    for (const input of this.searchInputs) {
      input.addEventListener("input", () => {
        for (const other of this.searchInputs) {
          if (other !== input) {
            other.value = input.value;
          }
        }
        trigger();
      });
    }

    if (this.sourceFilterGroup) {
      this.sourceFilterGroup.addEventListener("click", (event) => {
        const button = event.target.closest(".source-filter-btn");
        if (!(button instanceof HTMLButtonElement)) {
          return;
        }

        this.selectedSource = button.dataset.value || "all";
        this.applySourceSelection();
        trigger();
      });
    }

    if (this.salaryRangeGroup) {
      this.salaryRangeGroup.addEventListener("click", (event) => {
        const button = event.target.closest(".salary-filter-btn");
        if (!(button instanceof HTMLButtonElement)) {
          return;
        }

        this.selectedSalaryMin = this.parseNumber(button.dataset.min);
        this.selectedSalaryMax = this.parseNumber(button.dataset.max);
        this.applySalarySelection();
        trigger();
      });
    }

    if (this.companyFilterInput) {
      this.companyFilterInput.addEventListener("input", () => {
        this.renderCompanyTags();
      });
    }

    if (this.techFilterInput) {
      this.techFilterInput.addEventListener("input", () => {
        this.renderTechTags();
      });
    }

    if (this.companiesContainer) {
      this.companiesContainer.addEventListener("click", (event) => {
        const button = event.target.closest(".company-tag-btn");
        if (!(button instanceof HTMLButtonElement)) {
          return;
        }

        const value = button.dataset.value || "";
        this.toggleSetValue(this.selectedCompanies, value);
        this.renderCompanyTags();
        trigger();
      });
    }

    if (this.techsContainer) {
      this.techsContainer.addEventListener("click", (event) => {
        const button = event.target.closest(".tech-tag-btn");
        if (!(button instanceof HTMLButtonElement)) {
          return;
        }

        const value = button.dataset.value || "";
        this.toggleSetValue(this.selectedTechs, value);
        this.renderTechTags();
        trigger();
      });
    }

    if (this.clearFilterBtn) {
      this.clearFilterBtn.addEventListener("click", () => {
        this.resetAll();
        trigger();
      });
    }
  }

  resetAll() {
    this.selectedSource = "all";
    this.selectedSalaryMin = null;
    this.selectedSalaryMax = null;
    this.selectedCompanies.clear();
    this.selectedTechs.clear();

    if (this.companyFilterInput) {
      this.companyFilterInput.value = "";
    }
    if (this.techFilterInput) {
      this.techFilterInput.value = "";
    }

    for (const input of this.searchInputs) {
      input.value = "";
    }

    this.applySourceSelection();
    this.applySalarySelection();
    this.renderCompanyTags();
    this.renderTechTags();
    this.updateActiveFilterBadge();
  }

  toggleTechFilter(techName) {
    const value = String(techName || "").trim();
    if (!value) {
      return;
    }

    this.toggleSetValue(this.selectedTechs, value);
    this.renderTechTags();
    this.updateActiveFilterBadge();
  }

  getFilterState() {
    return {
      search: this.searchInputs[0]?.value || "",
      source: this.selectedSource,
      salaryMin: this.selectedSalaryMin,
      salaryMax: this.selectedSalaryMax,
      companies: [...this.selectedCompanies],
      techs: [...this.selectedTechs],
    };
  }

  bindSidebarControls() {
    if (!this.sidebar || !this.mobileFilterBtn || !this.closeSidebarBtn || !this.sidebarOverlay) {
      return;
    }

    const openSidebar = () => {
      this.sidebar.classList.remove("translate-x-full");
      this.sidebarOverlay.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    };

    const closeSidebar = () => {
      this.sidebar.classList.add("translate-x-full");
      this.sidebarOverlay.classList.add("hidden");
      document.body.style.overflow = "";
    };

    this.mobileFilterBtn.addEventListener("click", openSidebar);
    this.closeSidebarBtn.addEventListener("click", closeSidebar);
    this.sidebarOverlay.addEventListener("click", closeSidebar);
  }

  bindToggleControls() {
    if (this.toggleAllCompaniesBtn) {
      this.toggleAllCompaniesBtn.addEventListener("click", () => {
        this.toggleList(
          this.toggleAllCompaniesBtn,
          this.companiesContainer,
          this.companyFilterWrapper,
        );
      });
    }

    if (this.toggleAllTechsBtn) {
      this.toggleAllTechsBtn.addEventListener("click", () => {
        this.toggleList(this.toggleAllTechsBtn, this.techsContainer, this.techFilterWrapper);
      });
    }
  }

  toggleList(button, list, filterWrapper) {
    if (!button || !list) {
      return;
    }

    const isHidden = list.classList.contains("hidden");
    list.classList.toggle("hidden", !isHidden);

    if (filterWrapper) {
      filterWrapper.classList.toggle("hidden", !isHidden);
    }

    button.textContent = isHidden ? "Hide All" : "Show All";
  }

  renderCompanyTags() {
    if (!this.companiesContainer) {
      return;
    }

    const query = normalizeText(this.companyFilterInput?.value || "");
    const display = this.allCompanies.filter((company) => normalizeText(company).includes(query));

    this.companiesContainer.innerHTML = "";

    if (!display.length) {
      const empty = document.createElement("span");
      empty.className = "text-gray-500 text-sm";
      empty.textContent = "No companies found.";
      this.companiesContainer.appendChild(empty);
      return;
    }

    for (const company of display) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.value = company;
      button.classList.add("company-tag-btn", ...TAG_BASE_CLASSES);

      const isActive = this.selectedCompanies.has(company);
      button.classList.add(...(isActive ? COMPANY_ACTIVE_CLASSES : TAG_INACTIVE_CLASSES));
      button.textContent = company;

      this.companiesContainer.appendChild(button);
    }
  }

  renderTechTags() {
    if (!this.techsContainer) {
      return;
    }

    const query = normalizeText(this.techFilterInput?.value || "");
    const display = this.allTechs.filter((tech) => normalizeText(tech).includes(query));

    this.techsContainer.innerHTML = "";

    if (!display.length) {
      const empty = document.createElement("span");
      empty.className = "text-gray-500 text-sm";
      empty.textContent = "No techs found.";
      this.techsContainer.appendChild(empty);
      return;
    }

    for (const tech of display) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.value = tech;
      button.classList.add("tech-tag-btn", ...TAG_BASE_CLASSES);

      const isActive = this.selectedTechs.has(tech);
      button.classList.add(...(isActive ? TECH_ACTIVE_CLASSES : TAG_INACTIVE_CLASSES));
      button.textContent = tech;

      this.techsContainer.appendChild(button);
    }
  }

  toggleSetValue(set, value) {
    if (!value) {
      return;
    }

    if (set.has(value)) {
      set.delete(value);
    } else {
      set.add(value);
    }
  }

  parseNumber(value) {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    const parsed = Number.parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : null;
  }

  applySourceSelection() {
    for (const button of this.sourceButtons) {
      const isActive = (button.dataset.value || "") === this.selectedSource;
      this.applyButtonState(button, isActive, "source-dot");
    }
  }

  applySalarySelection() {
    for (const button of this.salaryButtons) {
      const min = this.parseNumber(button.dataset.min);
      const max = this.parseNumber(button.dataset.max);
      const isActive = this.selectedSalaryMin === min && this.selectedSalaryMax === max;
      this.applyButtonState(button, isActive, "salary-dot");
    }
  }

  applyButtonState(button, isActive, dotClass) {
    button.classList.remove(...(isActive ? INACTIVE_BUTTON_CLASSES : ACTIVE_BUTTON_CLASSES));
    button.classList.add(...(isActive ? ACTIVE_BUTTON_CLASSES : INACTIVE_BUTTON_CLASSES));

    const dot = button.querySelector(`.${dotClass}`);
    if (dot) {
      dot.classList.toggle("hidden", !isActive);
    }
  }

  updateActiveFilterBadge() {
    if (!this.activeFilter || !this.filterText) {
      return;
    }

    const parts = [];

    if (this.selectedSource !== "all") {
      parts.push(`Source: ${this.selectedSource === "jobsearch" ? "JobSearch.az" : "Glorri"}`);
    }

    if (this.selectedCompanies.size > 0) {
      const first = [...this.selectedCompanies][0];
      const suffix = this.selectedCompanies.size > 1 ? ` +${this.selectedCompanies.size - 1}` : "";
      parts.push(`Company: ${first}${suffix}`);
    }

    if (this.selectedTechs.size > 0) {
      const first = [...this.selectedTechs][0];
      const suffix = this.selectedTechs.size > 1 ? ` +${this.selectedTechs.size - 1}` : "";
      parts.push(`Tech: ${first}${suffix}`);
    }

    if (parts.length > 0) {
      this.filterText.textContent = parts.join(" | ");
      this.activeFilter.classList.remove("hidden");
      this.activeFilter.classList.add("flex");
    } else {
      this.activeFilter.classList.add("hidden");
      this.activeFilter.classList.remove("flex");
      this.filterText.textContent = "";
    }
  }
}
