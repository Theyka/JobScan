import { escapeHtml, formatDate } from "../utils/format.js";

function hasRenderableContent(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim().length > 0;
}

function normalizeSafeUrl(url) {
  const raw = String(url || "").trim();
  if (!raw || /^javascript:/i.test(raw)) {
    return "";
  }

  if (/^(https?:|mailto:|tel:)/i.test(raw)) {
    return raw;
  }

  if (/^www\./i.test(raw)) {
    return `https://${raw}`;
  }

  return "";
}

function sanitizeHtml(html) {
  const source = String(html || "").trim();
  if (!source) {
    return "";
  }

  const template = document.createElement("template");
  template.innerHTML = source;

  for (const node of template.content.querySelectorAll("script,style,iframe,object,embed,link,meta")) {
    node.remove();
  }

  for (const element of template.content.querySelectorAll("*")) {
    for (const attr of [...element.attributes]) {
      const name = attr.name.toLowerCase();
      const value = attr.value;

      if (name.startsWith("on") || name === "style") {
        element.removeAttribute(attr.name);
        continue;
      }

      if ((name === "href" || name === "src") && /^javascript:/i.test(value)) {
        element.removeAttribute(attr.name);
      }
    }

    if (element.tagName.toLowerCase() === "a") {
      const safeHref = normalizeSafeUrl(element.getAttribute("href"));
      if (!safeHref) {
        element.removeAttribute("href");
      } else {
        element.setAttribute("href", safeHref);
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noreferrer");
      }
    }
  }

  return template.innerHTML;
}

function renderInfoCard(label, value, valueClass = "") {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "";
  }

  return `
    <div class="bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 min-w-0">
      <span class="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold mb-1">${escapeHtml(label)}</span>
      <span class="font-medium text-sm md:text-base break-words ${valueClass}">${escapeHtml(normalized)}</span>
    </div>
  `;
}

export class JobDetailView {
  constructor() {
    this.page = document.getElementById("job-detail-page");
    this.content = document.getElementById("job-detail-content");
    this.backButton = document.getElementById("job-detail-back");
    this.dashboardShell = document.getElementById("dashboard-shell");
    this.footer = document.getElementById("app-footer");
    this.loadingOverlay = document.getElementById("loading");
    this.loadingTitle = this.loadingOverlay ? this.loadingOverlay.querySelector("p.text-lg") : null;
    this.loadingNote = this.loadingOverlay ? this.loadingOverlay.querySelector(".loading-note") : null;
    this.defaultLoadingTitle = this.loadingTitle ? this.loadingTitle.textContent || "" : "";
    this.defaultLoadingNote = this.loadingNote ? this.loadingNote.textContent || "" : "";
    this.closeHandler = null;

    this.bindInternalEvents();
  }

  bindInternalEvents() {
    if (!this.backButton) {
      return;
    }

    this.backButton.addEventListener("click", (event) => {
      event.preventDefault();
      this.triggerClose();
    });
  }

  bindClose(handler) {
    this.closeHandler = typeof handler === "function" ? handler : null;
  }

  triggerClose() {
    if (this.closeHandler) {
      this.closeHandler();
    }
  }

  isVisible() {
    return !!this.page && !this.page.classList.contains("hidden");
  }

  showPage() {
    if (!this.page) {
      return;
    }

    if (this.dashboardShell) {
      this.dashboardShell.classList.add("hidden");
    }

    if (this.footer) {
      this.footer.classList.add("hidden");
    }

    this.page.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  hide() {
    if (!this.page) {
      return;
    }

    this.page.classList.add("hidden");

    if (this.dashboardShell) {
      this.dashboardShell.classList.remove("hidden");
    }

    if (this.footer) {
      this.footer.classList.remove("hidden");
    }

    this.hideGlobalLoading();
  }

  showLoading(source, slug) {
    this.showPage();
    this.showGlobalLoading("Loading job details...", "Fetching latest data from server...");
  }

  showError(message) {
    if (!this.content) {
      return;
    }

    this.showPage();
    this.hideGlobalLoading();
    this.content.innerHTML = `
      <div class="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6">
        <p class="text-sm font-semibold text-red-700 dark:text-red-300">Unable to load vacancy details.</p>
        <p class="mt-2 text-sm text-red-600 dark:text-red-400">${escapeHtml(message || "Unknown error.")}</p>
      </div>
    `;
  }

  render(detail) {
    if (!this.content) {
      return;
    }

    this.showPage();
    this.hideGlobalLoading();

    const postedAt = formatDate(detail?.postedAt);
    const deadlineAt = formatDate(detail?.deadlineAt);
    const salaryText = detail?.salaryText || "Not specified";
    const locationText = String(detail?.location || "").trim();
    const sourceLabel = detail?.sourceLabel || "";
    const sourceKey = String(detail?.source || "").trim().toLowerCase();
    const isGlorriSource = sourceKey === "glorri";

    const techStack = Array.isArray(detail?.techStack) ? detail.techStack.filter(Boolean) : [];
    const techMarkup = techStack.length
      ? `
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Technologies</h3>
          <div class="flex flex-wrap gap-2">
            ${techStack
              .map(
                (tech) =>
                  `<span class="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-100 dark:border-blue-800">${escapeHtml(
                    tech,
                  )}</span>`,
              )
              .join("")}
          </div>
        </div>
      `
      : "";

    const companyData = detail?.company || {};
    const companyName = companyData.name || "Unknown";
    const companyLogo = normalizeSafeUrl(companyData.logo || "");
    const companyCover = normalizeSafeUrl(companyData.cover || "");
    const companyAddress = String(companyData.address || "").trim();
    const companyCreatedAt = companyData.createdAt ? formatDate(companyData.createdAt) : "";
    const companyPhones = Array.isArray(companyData.phones)
      ? companyData.phones.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
    const companyEmails = Array.isArray(companyData.emails)
      ? companyData.emails.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
    const companySites = Array.isArray(companyData.sites)
      ? companyData.sites
          .map((site) => ({
            label: String(site?.label || site?.url || "").trim(),
            url: String(site?.url || "").trim(),
          }))
          .filter((site) => site.label && site.url)
      : [];
    const latitude = Number(companyData?.coordinates?.lat);
    const longitude = Number(companyData?.coordinates?.lng);
    const hasCoordinates =
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      (Math.abs(latitude) > 0.000001 || Math.abs(longitude) > 0.000001);
    const googleMapsUrl = hasCoordinates
      ? `https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}`
      : "";
    const osmBBox = hasCoordinates
      ? `${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}`
      : "";
    const osmEmbedUrl = hasCoordinates
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(osmBBox)}&layer=mapnik&marker=${encodeURIComponent(`${latitude},${longitude}`)}`
      : "";

    const companyRow = companyLogo
      ? `
        <img src="${escapeHtml(companyLogo)}" alt="${escapeHtml(companyName)}" class="w-12 h-12 md:w-16 md:h-16 rounded-lg object-contain bg-white p-1 border border-gray-200 dark:border-gray-600 flex-shrink-0" />
      `
      : `
        <div class="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl md:text-2xl uppercase border border-blue-200 dark:border-blue-800 flex-shrink-0">
          ${escapeHtml(companyName.slice(0, 1) || "U")}
        </div>
      `;

    const normalizeTextForCompare = (value) =>
      String(value || "")
        .toLocaleLowerCase()
        .replace(/\s+/g, " ")
        .trim();

    const hideTopLocationCard =
      !isGlorriSource &&
      locationText &&
      companyAddress &&
      normalizeTextForCompare(locationText) === normalizeTextForCompare(companyAddress);

    const infoCards = [
      renderInfoCard("Posted", postedAt),
      renderInfoCard("Deadline", deadlineAt, "text-red-500"),
      renderInfoCard("Salary", salaryText),
      renderInfoCard("Location", hideTopLocationCard ? "" : locationText),
      renderInfoCard("Type", detail?.jobType || ""),
    ].filter(Boolean);

    const aboutRows = Array.isArray(detail?.about) ? detail.about : [];
    const aboutCards = aboutRows
      .map((item) => renderInfoCard(item.label || "Detail", item.value || ""))
      .filter(Boolean);
    const metaCards = [...infoCards, ...aboutCards].join("");

    const descriptionHtml = sanitizeHtml(detail?.descriptionHtml || "");
    const requirementsHtml = sanitizeHtml(detail?.requirementsHtml || "");
    const companyDescriptionHtml = sanitizeHtml(companyData.descriptionHtml || "");
    const benefits = Array.isArray(detail?.benefits) ? detail.benefits.filter(Boolean) : [];

    const requirementsSection = hasRenderableContent(requirementsHtml)
      ? `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 break-words overflow-hidden">
          <h2 class="text-xl font-bold mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
            Requirements
          </h2>
          <div class="job-description text-gray-700 dark:text-gray-300 text-base leading-relaxed break-words overflow-hidden">
            ${requirementsHtml}
          </div>
        </div>
      `
      : "";

    const benefitsSection = benefits.length
      ? `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8">
          <h2 class="text-xl font-bold mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
            Benefits
          </h2>
          <ul class="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            ${benefits.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </div>
      `
      : "";

    const companyPhonesMarkup = companyPhones
      .map((phone) => {
        const href = normalizeSafeUrl(`tel:${phone}`);
        return href
          ? `<a href="${escapeHtml(href)}" class="text-blue-600 dark:text-blue-300 hover:underline">${escapeHtml(phone)}</a>`
          : `<span>${escapeHtml(phone)}</span>`;
      })
      .join('<span class="text-gray-400 dark:text-gray-500">, </span>');

    const companyEmailsMarkup = companyEmails
      .map((email) => {
        const href = normalizeSafeUrl(`mailto:${email}`);
        return href
          ? `<a href="${escapeHtml(href)}" class="text-blue-600 dark:text-blue-300 hover:underline">${escapeHtml(email)}</a>`
          : `<span>${escapeHtml(email)}</span>`;
      })
      .join('<span class="text-gray-400 dark:text-gray-500">, </span>');

    const companySitesMarkup = companySites
      .map((site) => {
        const href = normalizeSafeUrl(site.url) || normalizeSafeUrl(`https://${site.url}`);
        if (!href) {
          return `<span>${escapeHtml(site.label)}</span>`;
        }
        return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-300 hover:underline">${escapeHtml(site.label)}</a>`;
      })
      .join('<span class="text-gray-400 dark:text-gray-500">, </span>');

    const companyMetaCards = [
      companyCreatedAt && companyCreatedAt !== "-"
        ? `
          <div class="h-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-950/50 p-4">
            <p class="text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Created At</p>
            <p class="mt-2 text-sm md:text-base font-semibold text-gray-900 dark:text-white break-words">${escapeHtml(companyCreatedAt)}</p>
          </div>
        `
        : "",
      companyPhones.length
        ? `
          <div class="h-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-950/50 p-4">
            <p class="text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Phones</p>
            <p class="mt-2 text-sm md:text-base font-semibold text-gray-900 dark:text-white break-words">${companyPhonesMarkup}</p>
          </div>
        `
        : "",
      companyEmails.length
        ? `
          <div class="h-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-950/50 p-4">
            <p class="text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Emails</p>
            <p class="mt-2 text-sm md:text-base font-semibold text-gray-900 dark:text-white break-words">${companyEmailsMarkup}</p>
          </div>
        `
        : "",
      companySites.length
        ? `
          <div class="h-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-950/50 p-4">
            <p class="text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Sites</p>
            <p class="mt-2 text-sm md:text-base font-semibold text-gray-900 dark:text-white break-words">${companySitesMarkup}</p>
          </div>
        `
        : "",
      companyAddress
        ? `
          <div class="h-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-950/50 p-4 md:col-span-2">
            <p class="text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Address</p>
            <p class="mt-2 text-sm md:text-base font-semibold text-gray-900 dark:text-white break-words">${escapeHtml(companyAddress)}</p>
          </div>
        `
        : "",
    ]
      .filter(Boolean)
      .join("");

    const topCoverMarkup =
      !isGlorriSource && companyCover
        ? `
          <div class="relative h-44 md:h-56 lg:h-64">
            <img src="${escapeHtml(companyCover)}" alt="${escapeHtml(companyName)} cover" class="absolute inset-0 w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent"></div>
          </div>
        `
        : "";

    const companyDetailsSection =
      !isGlorriSource &&
      (companyMetaCards ||
        hasRenderableContent(companyDescriptionHtml) ||
        hasCoordinates)
        ? `
          <div class="mt-8 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800/80 overflow-hidden shadow-sm">
            <div class="h-1.5 w-full bg-gradient-to-r from-blue-500 via-teal-500 to-orange-400"></div>
            <div class="p-4 md:p-6">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">About Company</h3>
              ${
                companyMetaCards
                  ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:auto-rows-fr">${companyMetaCards}</div>`
                  : ""
              }
              ${
                hasCoordinates
                  ? `
                    <div class="mt-5">
                      <div class="w-full h-64 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <iframe
                          src="${escapeHtml(osmEmbedUrl)}"
                          class="w-full h-full border-0"
                          loading="lazy"
                          referrerpolicy="no-referrer-when-downgrade"
                          title="Company map"
                        ></iframe>
                      </div>
                      ${
                        googleMapsUrl
                          ? `<a href="${escapeHtml(googleMapsUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex mt-2 text-sm font-medium text-blue-600 dark:text-blue-300 hover:underline">Open in Google Maps</a>`
                          : ""
                      }
                    </div>
                  `
                  : ""
              }
              ${
                hasRenderableContent(companyDescriptionHtml)
                  ? `<div class="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700 job-description text-gray-700 dark:text-gray-300 text-base leading-relaxed">${companyDescriptionHtml}</div>`
                  : ""
              }
            </div>
          </div>
        `
        : "";

    const applyUrl = normalizeSafeUrl(detail?.applyUrl || "");
    const externalUrl = normalizeSafeUrl(detail?.externalUrl || "");
    const ctaUrl = applyUrl || externalUrl;
    const sourceName = detail?.sourceLabel || "Source";
    const sourceIcon =
      sourceKey === "glorri" ? "https://jobs.glorri.com/favicon.ico" : "https://jobsearch.az/favicon.ico";

    const actionsMarkup = ctaUrl
      ? `
        <div class="bg-gray-900 dark:bg-gray-800 border border-gray-800 dark:border-gray-700 rounded-2xl shadow-2xl flex flex-col md:flex-row items-stretch overflow-hidden">
          <a href="${escapeHtml(ctaUrl)}" target="_blank" class="flex-1 group flex items-center justify-center gap-3 px-8 py-5 text-base font-bold text-white transition-all hover:bg-white/10 active:opacity-90 border-b md:border-b-0 md:border-r border-gray-800 dark:border-gray-700 last:border-0" rel="noopener noreferrer">
            <img src="${escapeHtml(sourceIcon)}" class="w-6 h-6 rounded-sm brightness-125" alt="" />
            <span>Apply on ${escapeHtml(sourceName)}</span>
          </a>
        </div>
      `
      : "";

    this.content.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8 break-words overflow-hidden">
        ${topCoverMarkup}
        <div class="p-6 md:p-8">
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight break-words">${escapeHtml(detail?.title || "Untitled")}</h1>

          <div class="flex items-center gap-4 mb-6">
            ${companyRow}
            <div class="min-w-0 flex-1">
              <h2 class="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 break-words">${escapeHtml(companyName)}</h2>
              <span class="text-sm text-gray-500 dark:text-gray-400 break-words">${escapeHtml(sourceLabel)}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            ${metaCards}
          </div>

          ${techMarkup}

          ${companyDetailsSection}
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 break-words overflow-hidden">
        <h2 class="text-xl font-bold mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
          Job Description
        </h2>
        <div class="job-description text-gray-700 dark:text-gray-300 text-base leading-relaxed break-words overflow-hidden">
          ${
            hasRenderableContent(descriptionHtml)
              ? descriptionHtml
              : '<p class="text-gray-500 dark:text-gray-400">Description is not available.</p>'
          }
        </div>
      </div>

      ${requirementsSection}
      ${benefitsSection}
      ${actionsMarkup}
    `;
  }

  showGlobalLoading(title, note) {
    if (!this.loadingOverlay) {
      return;
    }

    if (this.loadingTitle && title) {
      this.loadingTitle.textContent = title;
    }

    if (this.loadingNote && note) {
      this.loadingNote.textContent = note;
    }

    this.loadingOverlay.classList.remove("hidden");
  }

  hideGlobalLoading() {
    if (!this.loadingOverlay) {
      return;
    }

    this.loadingOverlay.classList.add("hidden");

    if (this.loadingTitle && this.defaultLoadingTitle) {
      this.loadingTitle.textContent = this.defaultLoadingTitle;
    }

    if (this.loadingNote && this.defaultLoadingNote) {
      this.loadingNote.textContent = this.defaultLoadingNote;
    }
  }
}
