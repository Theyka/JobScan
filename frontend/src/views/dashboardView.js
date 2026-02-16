import { compactNumber } from "../utils/format.js";

const CHART_COLOR = "#2563eb";

export class DashboardView {
  constructor() {
    this.jobsAnalyzed = document.getElementById("total-jobs");
    this.mostPopularLanguage = document.getElementById("top-language");
    this.jobsWithTechStack = document.getElementById("tech-jobs");
    this.technologiesFound = document.getElementById("total-techs");

    this.sourceGlorri = document.getElementById("stat-glorri");
    this.sourceJobsearch = document.getElementById("stat-jsaz");

    this.chartCanvas = document.getElementById("barChart");
    this.chart = null;
    this.onTechSelected = null;

    this.errorContainer = document.getElementById("errorContainer");
    this.errorNode = null;

    this.updatedTime = document.getElementById("last-updated");
    this.loadingOverlay = document.getElementById("loading");

    this.startClock();
  }

  bindTechSelection(handler) {
    this.onTechSelected = typeof handler === "function" ? handler : null;
  }

  startClock() {
    if (!this.updatedTime) {
      return;
    }

    const tick = () => {
      const now = new Date();
      this.updatedTime.textContent = now.toLocaleTimeString("en-GB", { hour12: false });
    };

    tick();
    window.setInterval(tick, 1000);
  }

  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add("hidden");
    }
  }

  renderStats(stats) {
    if (this.jobsAnalyzed) {
      this.jobsAnalyzed.textContent = compactNumber(stats.jobsAnalyzed);
    }
    if (this.mostPopularLanguage) {
      this.mostPopularLanguage.textContent = stats.mostPopularLanguage || "-";
    }
    if (this.jobsWithTechStack) {
      this.jobsWithTechStack.textContent = compactNumber(stats.jobsWithTechStack);
    }
    if (this.technologiesFound) {
      this.technologiesFound.textContent = compactNumber(stats.technologiesFound);
    }
  }

  renderTechChart(items) {
    if (!this.chartCanvas || typeof window.Chart === "undefined") {
      return;
    }

    const labels = items.map((item) => item.name);
    const values = items.map((item) => item.count);

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = values;
      this.refreshTheme();
      this.chart.update();
      return;
    }

    const colors = this.getChartColors();

    this.chart = new window.Chart(this.chartCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Mentions",
            data: values,
            backgroundColor: CHART_COLOR,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_event, elements) => {
          if (!elements || !elements.length || !this.onTechSelected) {
            return;
          }

          const index = elements[0].index;
          const selected = labels[index];
          if (selected) {
            this.onTechSelected(selected);
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            padding: 10,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.text },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: colors.text,
              stepSize: 1,
            },
            grid: {
              color: colors.grid,
              drawBorder: false,
            },
          },
        },
      },
    });
  }

  refreshTheme() {
    if (!this.chart) {
      return;
    }

    const colors = this.getChartColors();
    this.chart.options.scales.x.ticks.color = colors.text;
    this.chart.options.scales.y.ticks.color = colors.text;
    this.chart.options.scales.y.grid.color = colors.grid;
    this.chart.options.plugins.tooltip.backgroundColor = colors.tooltipBg;
    this.chart.options.plugins.tooltip.titleColor = colors.tooltipText;
    this.chart.options.plugins.tooltip.bodyColor = colors.tooltipText;
    this.chart.options.plugins.tooltip.borderColor = colors.tooltipBorder;
    this.chart.update();
  }

  getChartColors() {
    const isDark = document.documentElement.classList.contains("dark");
    return {
      text: isDark ? "#9ca3af" : "#6b7280",
      grid: isDark ? "#374151" : "#e5e7eb",
      tooltipBg: isDark ? "#1f2937" : "#ffffff",
      tooltipText: isDark ? "#f9fafb" : "#1f2937",
      tooltipBorder: isDark ? "#374151" : "#e5e7eb",
    };
  }

  renderSourceBreakdown(sourceBreakdown) {
    if (this.sourceGlorri) {
      this.sourceGlorri.textContent = compactNumber(sourceBreakdown.glorri || 0);
    }
    if (this.sourceJobsearch) {
      this.sourceJobsearch.textContent = compactNumber(sourceBreakdown.jobsearch || 0);
    }
  }

  renderError(message) {
    if (!this.errorContainer) {
      return;
    }

    if (!message) {
      if (this.errorNode) {
        this.errorNode.remove();
        this.errorNode = null;
      }
      return;
    }

    if (!this.errorNode) {
      this.errorNode = document.createElement("div");
      this.errorNode.className =
        "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200";
      this.errorContainer.appendChild(this.errorNode);
    }

    this.errorNode.textContent = message;
  }
}
