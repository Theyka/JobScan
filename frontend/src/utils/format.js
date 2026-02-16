export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function compactNumber(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0";
  }
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function parseSalaryFromUnknown(value) {
  if (value === null || value === undefined || value === "") {
    return { min: null, max: null, text: "-" };
  }

  if (typeof value === "number") {
    const normalized = Math.round(value);
    return {
      min: normalized,
      max: normalized,
      text: `${compactNumber(normalized)} AZN`,
    };
  }

  const raw = String(value).trim();
  const matches = raw.match(/\d+/g) || [];
  const numbers = matches.map((item) => Number.parseInt(item, 10)).filter((item) => Number.isFinite(item));

  if (!numbers.length) {
    return { min: null, max: null, text: raw || "-" };
  }

  const min = Math.min(...numbers);
  const max = Math.max(...numbers);

  if (min === max) {
    return {
      min,
      max,
      text: `${compactNumber(min)} AZN`,
    };
  }

  return {
    min,
    max,
    text: `${compactNumber(min)} - ${compactNumber(max)} AZN`,
  };
}

export function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeTechStack(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}
