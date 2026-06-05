import axios from "@/lib/config/axios-config";

// ---------------------------------------------------------------------------
// Refine Agent monitoring types (admin /refine-chat API)
// ---------------------------------------------------------------------------

export interface RefineChatSummary {
  totalSessions: number;
  uniqueUsers: number;
  avgQualityScore: number | null;
  avgMessagesPerSession: number | null;
  sessionsToday: number;
  totalRefinements: number;
}

export interface RefineChatQualityBreakdown {
  clarity: number | null;
  specificity: number | null;
  completeness: number | null;
  reusability: number | null;
}

export interface RefineChatByProvider {
  provider: string;
  sessions: number;
  avgQuality: number | null;
}

export interface RefineChatByPlan {
  plan: string;
  sessions: number;
}

export interface RefineChatTimeSeriesPoint {
  date: string;
  sessions: number;
  messages: number;
  uniqueUsers: number;
}

export interface RefineChatStatsData {
  summary: RefineChatSummary;
  qualityBreakdown: RefineChatQualityBreakdown;
  byProvider: RefineChatByProvider[];
  byPlan: RefineChatByPlan[];
  timeSeries: RefineChatTimeSeriesPoint[];
}

export interface RefineChatSession {
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  provider: string | null;
  messageCount: number;
  qualityScore: number | null;
  totalRefinements: number;
  createdAt: string;
  updatedAt: string;
}

export interface RefineChatSessionsData {
  sessions: RefineChatSession[];
  total: number;
  page: number;
  pages: number;
}

// ---------------------------------------------------------------------------
// Personal Brain monitoring types (admin /personal-brain API)
// ---------------------------------------------------------------------------

export interface PersonalBrainSummary {
  totalBrains: number;
  activeBrains: number;
  initializedBrains: number;
  errorBrains: number;
  staleBrains: number;
  connectedIntegrations: number;
  chatMessagesMonth: number;
  templatesGeneratedMonth: number;
  syncsToday: number;
  runtimeBetaEnabled: boolean;
}

export interface PersonalBrainByStatus {
  status: string;
  count: number;
}

export interface PersonalBrainByConnector {
  connectorId: string;
  connections: number;
}

export interface PersonalBrainTimeSeriesPoint {
  date: string;
  brainsUpdated: number;
  syncs: number;
}

export interface PersonalBrainStatsData {
  summary: PersonalBrainSummary;
  byStatus: PersonalBrainByStatus[];
  byConnector: PersonalBrainByConnector[];
  timeSeries: PersonalBrainTimeSeriesPoint[];
}

export interface PersonalBrainUserRow {
  brainId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPlan: string;
  status: string;
  connectorCount: number;
  staleConnectors: number;
  pendingTemplatesCount: number;
  activeRecommendationCount: number;
  pendingActionCount: number;
  memoryEpisodes: number;
  lastFullSyncAt: string | null;
  lastError: string | null;
  failedPipelineStages: string[];
  runtimeStatus: string;
  updatedAt: string;
  createdAt: string;
}

export interface PersonalBrainUsersData {
  brains: PersonalBrainUserRow[];
  total: number;
  page: number;
  pages: number;
}

export interface PersonalBrainSyncIssue extends PersonalBrainUserRow {
  pipelineErrors: Array<{ stage: string; message: string | null }>;
  errorConnectors: string[];
}

export interface PersonalBrainSyncIssuesData {
  issues: PersonalBrainSyncIssue[];
  total: number;
  page: number;
  pages: number;
}

export interface PersonalBrainUserDetailData {
  exists: boolean;
  runtimeBetaEnabled: boolean;
  brain?: Record<string, unknown>;
  integrations: Array<Record<string, unknown>>;
  usage: {
    chatMessagesMonth: number;
    templatesGeneratedMonth: number;
    connectedIntegrations?: number;
  };
}

export interface PublicRefinementAnalyticsData {
  summary: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    avgResponseTimeMs: number | null;
    avgOriginalLength: number | null;
    avgRefinedLength: number | null;
    windowDays: number;
  };
  timeSeries: Array<{
    date: string;
    total: number;
    successful: number;
    failed: number;
  }>;
  byProvider: Array<{ provider: string; count: number }>;
  byModel: Array<{ model: string; count: number }>;
  byPreset: Array<{ preset: string; count: number }>;
  bySource: Array<{ source: string; count: number }>;
}

export interface AdminOverviewData {
  kpis: Array<{ key: string; label: string; value: number; unit?: string }>;
  promptsByStatus?: Record<string, number>;
  platformStatus: {
    authStatus: { googleOAuth: boolean; emailAuth: boolean };
    apiUptimeSeconds: number;
    backgroundJobs: { status: string; note?: string };
    extensionVersionHealth: { currentVersion?: string | null; lastReportedAt?: string | null };
  };
  publicRefineRequests30d: number;
  activityFeed: Array<{ type: string; label: string; createdAt: string }>;
  generatedAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminFeedbackUser {
  _id: string;
  name?: string;
  email?: string;
}

export interface AdminFeedbackItem {
  _id: string;
  userId?: AdminFeedbackUser | null;
  category: "general" | "feature-request" | "bug-report";
  subject: string;
  message: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in-progress" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
}

export type CreatorApplicationStatus = "pending" | "invited" | "rejected";
export type CreatorSubmissionStatus = "pending" | "approved" | "rejected";

export interface CreatorApplication {
  id: string;
  name: string;
  email: string;
  primaryPlatform: "x" | "instagram" | "tiktok";
  handle: string;
  followerRange: string;
  contentNiche: string[];
  motivation: string;
  recentPostUrl: string;
  status: CreatorApplicationStatus;
  reviewerNotes: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorSubmissionBrief {
  id: string;
  title: string;
  pointsReward: number;
  platform: string;
  format: string;
}

export interface CreatorSubmissionCreator {
  id: string;
  name: string;
  email: string;
  tier: string;
}

export interface CreatorSubmission {
  id: string;
  creatorId: string;
  creator: CreatorSubmissionCreator | null;
  briefId: string;
  brief: CreatorSubmissionBrief | null;
  platform: string;
  contentUrl: string;
  captionText: string;
  screenshotUrl: string | null;
  status: CreatorSubmissionStatus;
  pointsAwarded: number;
  reviewerNotes: string;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface CreatorInviteResult {
  invitation: {
    id: string;
    email: string;
    applicationId: string | null;
    status: string;
    expiresAt: string;
    acceptedAt?: string | null;
    activationUrl?: string;
  };
}

export const adminService = {
  getOverview: async (): Promise<AdminOverviewData> => {
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
  blockUser: async (userId: string, isBlocked: boolean) => {
    const response = await axios.patch(`/admin/block-user/${userId}`, { isBlocked });
    return response.data;
  },
  editBalance: async (userId: string, amount: number) => {
    const response = await axios.patch(`/admin/edit-balance/${userId}`, { amount });
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
  getAnalyticsRefineAgent: async (days: number) => {
    const response = await axios.get("/admin/analytics/refine-agent", { params: { days } });
    return response.data;
  },
  getAnalyticsPublicRefinements: async (days: number): Promise<{ success: boolean; data: PublicRefinementAnalyticsData }> => {
    const response = await axios.get("/admin/analytics/public-refinements", { params: { days } });
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
  getRefineChatStats: async (days: number): Promise<{ success: boolean; data: RefineChatStatsData }> => {
    const response = await axios.get("/admin/refine-chat/stats", { params: { days } });
    return response.data;
  },
  getRefineChatSessions: async (params: {
    page?: number;
    limit?: number;
    provider?: string;
    minQuality?: number;
    days?: number;
    sort?: string;
  }): Promise<{ success: boolean; data: RefineChatSessionsData }> => {
    const response = await axios.get("/admin/refine-chat/sessions", { params });
    return response.data;
  },
  getPersonalBrainStats: async (
    days: number
  ): Promise<{ success: boolean; data: PersonalBrainStatsData }> => {
    const response = await axios.get("/admin/personal-brain/stats", { params: { days } });
    return response.data;
  },
  getPersonalBrainUsers: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    days?: number;
  }): Promise<{ success: boolean; data: PersonalBrainUsersData }> => {
    const response = await axios.get("/admin/personal-brain/users", { params });
    return response.data;
  },
  getPersonalBrainSyncIssues: async (params: {
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: PersonalBrainSyncIssuesData }> => {
    const response = await axios.get("/admin/personal-brain/sync-issues", { params });
    return response.data;
  },
  getPersonalBrainByUserId: async (
    userId: string
  ): Promise<{ success: boolean; data: PersonalBrainUserDetailData }> => {
    const response = await axios.get(`/admin/personal-brain/users/${userId}`);
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
  getPlanLimits: async () => {
    const response = await axios.get("/admin/billing/plan-limits");
    return response.data;
  },
  getBillingChurn: async () => {
    const response = await axios.get("/admin/billing/churn");
    return response.data;
  },
  getBillingTrialConversion: async () => {
    const response = await axios.get("/admin/billing/trial-conversion");
    return response.data;
  },
  getBillingPaymentHealth: async () => {
    const response = await axios.get("/admin/billing/payment-health");
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
  getWorkspaces: async (params?: Record<string, string | number | undefined>) => {
    const response = await axios.get("/admin/workspaces", { params });
    return response.data;
  },
  getWorkspaceStats: async () => {
    const response = await axios.get("/admin/workspaces/stats");
    return response.data;
  },
  getCollections: async (params?: Record<string, string | number | undefined>) => {
    const response = await axios.get("/admin/collections", { params });
    return response.data;
  },
  getFeedback: async (params?: Record<string, string | number | undefined>) => {
    const response = await axios.get("/admin/feedback", { params });
    return response.data as {
      success: boolean;
      feedback: AdminFeedbackItem[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  },
  getCollectionStats: async () => {
    const response = await axios.get("/admin/collections/stats");
    return response.data;
  },
  getTemplateStats: async () => {
    const response = await axios.get("/admin/templates/stats");
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
  getAIHealth: async () => {
    const response = await axios.get("/admin/system/ai-health");
    return response.data;
  },
  getSuspiciousActivity: async () => {
    const response = await axios.get("/admin/security/suspicious-activity");
    return response.data;
  },
  getAbuseSignals: async () => {
    const response = await axios.get("/admin/security/abuse-signals");
    return response.data;
  },
  getInjectionAttempts: async () => {
    const response = await axios.get("/admin/security/injection-attempts");
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
  getCreatorApplications: async (params?: { status?: string; limit?: number }) => {
    const response = await axios.get("/admin/creator-applications", { params });
    return response.data as { applications: CreatorApplication[] };
  },
  inviteCreatorEmail: async (email: string) => {
    const response = await axios.post("/admin/creator-applications/invite", { email });
    return response.data as CreatorInviteResult;
  },
  inviteCreatorApplication: async (applicationId: string) => {
    const response = await axios.post(
      `/admin/creator-applications/${applicationId}/invite`
    );
    return response.data as CreatorInviteResult;
  },
  rejectCreatorApplication: async (
    applicationId: string,
    reviewerNotes?: string
  ) => {
    const response = await axios.post(
      `/admin/creator-applications/${applicationId}/reject`,
      { reviewerNotes: reviewerNotes || "" }
    );
    return response.data as { application: CreatorApplication };
  },
  getCreatorSubmissions: async (params?: { status?: string; limit?: number }) => {
    const response = await axios.get("/admin/creator-submissions", { params });
    return response.data as { submissions: CreatorSubmission[] };
  },
  reviewCreatorSubmission: async (
    submissionId: string,
    payload: { status: "approved" | "rejected"; reviewerNotes?: string }
  ) => {
    const response = await axios.post(
      `/admin/creator-submissions/${submissionId}/review`,
      payload
    );
    return response.data as { submission: CreatorSubmission };
  },
};
