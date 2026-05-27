import axios from "@/lib/config/axios-config";

export interface ChangelogEntry {
  _id: string;
  title: string;
  slug: string;
  version?: string;
  category: "new_feature" | "improvement" | "bug_fix" | "deprecation" | "security";
  body: string;
  summary?: string;
  status: "draft" | "published";
  publishedAt?: string;
  notificationSent: boolean;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChangelogListResponse {
  data: ChangelogEntry[];
  page: number;
  totalPages: number;
  total: number;
}

export interface ChangelogPayload {
  title: string;
  version?: string;
  category: ChangelogEntry["category"];
  body: string;
  summary?: string;
  author?: string;
}

export const changelogApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    axios.get<ChangelogListResponse>("/admin/changelog", { params }).then((r) => r.data),

  getOne: (id: string) =>
    axios.get<ChangelogEntry>(`/admin/changelog/${id}`).then((r) => r.data),

  create: (payload: ChangelogPayload) =>
    axios.post<ChangelogEntry>("/admin/changelog", payload).then((r) => r.data),

  update: (id: string, payload: Partial<ChangelogPayload>) =>
    axios.put<ChangelogEntry>(`/admin/changelog/${id}`, payload).then((r) => r.data),

  remove: (id: string) =>
    axios.delete(`/admin/changelog/${id}`).then((r) => r.data),

  publish: (id: string) =>
    axios.post<ChangelogEntry>(`/admin/changelog/${id}/publish`).then((r) => r.data),

  unpublish: (id: string) =>
    axios.post<ChangelogEntry>(`/admin/changelog/${id}/unpublish`).then((r) => r.data),
};
