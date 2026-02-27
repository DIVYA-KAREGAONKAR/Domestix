export type AppRole = "worker" | "employer" | "agency" | "government" | "support_provider";

const ROLE_SET = new Set<AppRole>(["worker", "employer", "agency", "government", "support_provider"]);

export const normalizeRole = (role?: string): AppRole => {
  const normalized = (role || "").trim().toLowerCase();
  if (normalized === "client") return "employer";
  if (ROLE_SET.has(normalized as AppRole)) return normalized as AppRole;
  return "worker";
};

export const roleLoginPath = (role: AppRole): string => {
  if (role === "support_provider") return "/support-provider/login";
  return `/${role}/login`;
};

export const roleDashboardPath = (role: AppRole): string => {
  if (role === "support_provider") return "/support-provider/dashboard";
  return `/${role}/dashboard`;
};
