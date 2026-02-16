import { loadAppConfig, validateConfig } from "./config.js";
import { JobsController } from "./controllers/jobsController.js";
import { JobsModel } from "./models/jobsModel.js";
import { ApiService } from "./services/apiService.js";
import { ThemeService } from "./services/themeService.js";
import { DashboardView } from "./views/dashboardView.js";
import { FiltersView } from "./views/filtersView.js";
import { JobDetailView } from "./views/jobDetailView.js";
import { TableView } from "./views/tableView.js";

const model = new JobsModel();
const dashboardView = new DashboardView();
const filtersView = new FiltersView();
const tableView = new TableView();
const jobDetailView = new JobDetailView();
const themeService = new ThemeService();

const appConfig = loadAppConfig();
const configStatus = validateConfig(appConfig);
if (!configStatus.ok) {
  dashboardView.renderError(configStatus.message);
}

const apiService = new ApiService({
  supabaseUrl: appConfig.supabaseUrl,
  supabaseAnonKey: appConfig.supabaseAnonKey,
});

const controller = new JobsController({
  model,
  apiService,
  filtersView,
  dashboardView,
  tableView,
  themeService,
  jobDetailView,
});

if (configStatus.ok) {
  controller.init();
} else {
  controller.bindThemeControls();
  controller.bindFilters();
  controller.bindTableControls();
  controller.bindRouteControls();
  filtersView.renderCompanies([]);
  filtersView.renderTechs([]);
  controller.renderAll();
  dashboardView.hideLoading();
}
