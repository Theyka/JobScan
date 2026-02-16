const windowConfig = window.__JOBSCAN_CONFIG__ || {};

export function loadAppConfig() {
  const supabaseUrl = (windowConfig.SUPABASE_URL || "").trim();

  const supabaseAnonKey = (windowConfig.SUPABASE_ANON_KEY || "").trim();

  return { supabaseUrl, supabaseAnonKey };
}

export function validateConfig(config) {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return {
      ok: false,
      message: "Missing Supabase config. Set SUPABASE_URL and SUPABASE_ANON_KEY in frontend/config.js.",
    };
  }

  return { ok: true, message: "" };
}
