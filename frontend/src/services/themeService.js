const STORAGE_KEY = "jobscan_theme";

export class ThemeService {
  constructor() {
    this.systemQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.userTheme = window.localStorage.getItem(STORAGE_KEY) || "system";
    this.systemListener = () => {
      if (this.userTheme === "system") {
        this.apply(this.userTheme);
      }
    };

    this.systemQuery.addEventListener("change", this.systemListener);
    this.apply(this.userTheme);
  }

  resolveTheme(theme) {
    if (theme === "dark" || theme === "light") {
      return theme;
    }
    return this.systemQuery.matches ? "dark" : "light";
  }

  apply(theme) {
    this.userTheme = ["system", "light", "dark"].includes(theme) ? theme : "system";
    const resolved = this.resolveTheme(this.userTheme);

    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.setAttribute("data-theme", resolved);
    window.localStorage.setItem(STORAGE_KEY, this.userTheme);

    return { selected: this.userTheme, resolved };
  }

  getSelectedTheme() {
    return this.userTheme;
  }
}
