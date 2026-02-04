import axios from "@/lib/config/axios-config";

export interface PaginatedResponse<T> {
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const adminService = {
  getOverview: async () => {
    const response = await axios.get("/admin/overview");
    return response.data.data;
  },
  getUsers: async (params: Record<string, string | number | undefined>) => {
    const response = await axios.get("/admin/users", { params });
    return response.data;
  },
  getUserById: async (userId: string) => {
    const response = await axios.get(`/admin/users/${userId}`);
    return response.data;
  },
  updateUserPlan: async (userId: string, plan: string) => {
    const response = await axios.put(`/admin/users/${userId}/plan`, { plan });
    return response.data;
  },
  suspendUser: async (userId: string) => {
    const response = await axios.put(`/admin/users/${userId}/suspend`);
    return response.data;
  },
  restoreUser: async (userId: string) => {
    const response = await axios.put(`/admin/users/${userId}/restore`);
    return response.data;
  },
  getUserPrompts: async (userId: string, params?: Record<string, number>) => {
    const response = await axios.get(`/admin/users/${userId}/prompts`, { params });
    return response.data;
  },
  getUserSessions: async (userId: string, params?: Record<string, number>) => {
    const response = await axios.get(`/admin/users/${userId}/sessions`, { params });
    return response.data;
  },
  getUserBilling: async (userId: string) => {
    const response = await axios.get(`/admin/users/${userId}/billing`);
    return response.data;
  },
  getUserActivity: async (userId: string, params?: Record<string, number>) => {
    const response = await axios.get(`/admin/users/${userId}/activity`, { params });
    return response.data;
  },
  getPrompts: async (params: Record<string, string | number | undefined>) => {
    const response = await axios.get("/admin/prompts", { params });
    return response.data;
  },
  getPromptDetails: async (promptId: string) => {
    const response = await axios.get(`/admin/prompts/${promptId}`);
    return response.data;
  },
  disablePrompt: async (promptId: string) => {
    const response = await axios.put(`/admin/prompts/${promptId}/disable`);
    return response.data;
  },
  featurePrompt: async (promptId: string, featured: boolean) => {
    const response = await axios.put(`/admin/prompts/${promptId}/feature`, { featured });
    return response.data;
  },
  convertPromptToTemplate: async (
    promptId: string,
    payload: { templateType?: string; templateStructure?: string }
  ) => {
    const response = await axios.post(`/admin/prompts/${promptId}/convert-to-template`, payload);
    return response.data;
  },
  getPromptUsage: async (promptId: string) => {
    const response = await axios.get(`/admin/prompts/${promptId}/usage`);
    return response.data;
  },
  getPromptVersions: async (promptId: string) => {
    const response = await axios.get(`/admin/prompts/${promptId}/versions`);
    return response.data;
  },
  getExtensionMetrics: async () => {
    const response = await axios.get("/admin/extension/metrics");
    return response.data;
  },
  setExtensionBanner: async (payload: { message: string; enabled: boolean; level: string }) => {
    const response = await axios.post("/admin/extension/banner", payload);
    return response.data;
  },
  updateExtensionFeatureFlags: async (flags: Record<string, boolean>) => {
    const response = await axios.put("/admin/extension/feature-flags", { flags });
    return response.data;
  },
  setExtensionMaintenance: async (payload: { enabled: boolean; message?: string }) => {
    const response = await axios.post("/admin/extension/maintenance", payload);
    return response.data;
  },
  setExtensionForceUpdate: async (payload: {
    enabled: boolean;
    minVersion?: string;
    message?: string;
  }) => {
    const response = await axios.post("/admin/extension/force-update", payload);
    return response.data;
  },
  getAnalyticsPromptUsage: async (days: number) => {
    const response = await axios.get("/admin/analytics/prompt-usage", { params: { days } });
    return response.data;
  },
  getAnalyticsRefineChat: async (days: number) => {
    const response = await axios.get("/admin/analytics/refine-chat", { params: { days } });
    return response.data;
  },
  getAnalyticsTemplateAdoption: async () => {
    const response = await axios.get("/admin/analytics/template-adoption");
    return response.data;
  },
  getAnalyticsModelDistribution: async () => {
    const response = await axios.get("/admin/analytics/model-distribution");
    return response.data;
  },
  getAnalyticsFunnel: async () => {
    const response = await axios.get("/admin/analytics/funnel");
    return response.data;
  },
  getBillingRevenue: async () => {
    const response = await axios.get("/admin/billing/revenue");
    return response.data;
  },
  getBillingSubscriptions: async (params: Record<string, string | number | undefined>) => {
    const response = await axios.get("/admin/billing/subscriptions", { params });
    return response.data;
  },
  updateSubscriptionPlan: async (subscriptionId: string, payload: Record<string, string | number>) => {
    const response = await axios.put(`/admin/billing/subscriptions/${subscriptionId}/upgrade`, payload);
    return response.data;
  },
  compSubscription: async (subscriptionId: string) => {
    const response = await axios.post(`/admin/billing/subscriptions/${subscriptionId}/comp`);
    return response.data;
  },
  refundSubscription: async (subscriptionId: string) => {
    const response = await axios.post(`/admin/billing/subscriptions/${subscriptionId}/refund`);
    return response.data;
  },
  getTemplates: async (params: Record<string, number | undefined>) => {
    const response = await axios.get("/admin/templates", { params });
    return response.data;
  },
  createTemplate: async (payload: Record<string, unknown>) => {
    const response = await axios.post("/admin/templates", payload);
    return response.data;
  },
  updateTemplate: async (templateId: string, payload: Record<string, unknown>) => {
    const response = await axios.put(`/admin/templates/${templateId}`, payload);
    return response.data;
  },
  publishTemplate: async (templateId: string) => {
    const response = await axios.put(`/admin/templates/${templateId}/publish`);
    return response.data;
  },
  unpublishTemplate: async (templateId: string) => {
    const response = await axios.put(`/admin/templates/${templateId}/unpublish`);
    return response.data;
  },
  categorizeTemplate: async (templateId: string, category: string) => {
    const response = await axios.post(`/admin/templates/${templateId}/categorize`, { category });
    return response.data;
  },
  getSystemAuthStatus: async () => {
    const response = await axios.get("/admin/system/auth-status");
    return response.data;
  },
  getFailedLogins: async () => {
    const response = await axios.get("/admin/system/failed-logins");
    return response.data;
  },
  getRolesAndPermissions: async () => {
    const response = await axios.get("/admin/system/roles");
    return response.data;
  },
  updateAdminRole: async (roleId: string, payload: Record<string, unknown>) => {
    const response = await axios.put(`/admin/system/roles/${roleId}`, payload);
    return response.data;
  },
  getAuditLogs: async (params: Record<string, string | number | undefined>) => {
    const response = await axios.get("/admin/system/audit-logs", { params });
    return response.data;
  },
  createAuditLog: async (payload: Record<string, unknown>) => {
    const response = await axios.post("/admin/system/audit-logs", payload);
    return response.data;
  },
  getPlatformSettings: async () => {
    const response = await axios.get("/admin/settings");
    return response.data;
  },
  updatePlatformSettings: async (payload: Record<string, unknown>) => {
    const response = await axios.put("/admin/settings", payload);
    return response.data;
  },
  getAllFeatureFlags: async () => {
    const response = await axios.get("/admin/settings/feature-flags");
    return response.data;
  },
  updateFeatureFlag: async (flagName: string, payload: Record<string, unknown>) => {
    const response = await axios.put(`/admin/settings/feature-flags/${flagName}`, payload);
    return response.data;
  },
  getFeatureFlag: async (flagName: string) => {
    const response = await axios.get(`/admin/feature-flags/${flagName}`);
    return response.data;
  },
  sendEmail: async (payload: {
    recipients: string[] | Array<{ email: string; name?: string; company?: string }>;
    subject?: string;
    content?: string;
    templateId?: string;
  }) => {
    const response = await axios.post("/admin/email/send", payload);
    return response.data;
  },
  getEmailTemplates: async (category?: string) => {
    const params = category ? { category } : {};
    const response = await axios.get("/admin/email/templates", { params });
    return response.data;
  },
  getEmailTemplate: async (templateId: string) => {
    const response = await axios.get(`/admin/email/templates/${templateId}`);
    return response.data;
  },
  createAdmin: async (payload: {
    username: string;
    email: string;
    password: string;
    role?: string;
    permissions?: string[];
  }) => {
    const response = await axios.post("/admin/create", payload);
    return response.data;
  },
  inviteAdmin: async (payload: {
    username: string;
    email: string;
    role?: string;
    permissions?: string[];
  }) => {
    const response = await axios.post("/admin/invite", payload);
    return response.data;
  },
  verifyInvitation: async (token: string) => {
    const response = await axios.get(`/admin/invitation/${token}`);
    return response.data;
  },
  acceptInvitation: async (token: string, password: string) => {
    const response = await axios.post("/admin/invitation/accept", { token, password });
    return response.data;
  },
  getAllAdmins: async (params: Record<string, string | number | undefined>) => {
    const response = await axios.get("/admin/admins", { params });
    return response.data;
  },
  resendInvitation: async (adminId: string) => {
    const response = await axios.post(`/admin/admins/${adminId}/resend-invitation`);
    return response.data;
  },
  cancelInvitation: async (adminId: string) => {
    const response = await axios.delete(`/admin/admins/${adminId}/cancel-invitation`);
    return response.data;
  },
};
