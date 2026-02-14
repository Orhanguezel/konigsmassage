// =============================================================
// FILE: src/integrations/endpoints/admin/dashboard_admin.endpoints.ts
// =============================================================
import { baseApi } from "@/integrations/baseApi";
import type { DashboardSummary } from "@/integrations/shared";
import { normalizeDashboardSummary } from "@/integrations/shared";

// ---- API -----------------------------------------------------
export const dashboardAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/dashboard/analytics
    getDashboardSummaryAdmin: b.query<DashboardSummary, void>({
      query: () => ({ url: "/admin/dashboard/analytics" }),
      transformResponse: (res: unknown) => normalizeDashboardSummary(res),
      providesTags: [{ type: "Dashboard" as const, id: "SUMMARY" }],
    }),
  }),
  overrideExisting: true,
});

export const { useGetDashboardSummaryAdminQuery } = dashboardAdminApi;
