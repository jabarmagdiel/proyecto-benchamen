import axios from "axios";
import type { OperativeAvailability, OperativeAvailabilitySummary } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor: adjuntar token ──────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response interceptor: redirigir si 401 ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }),
  me: () => api.get("/api/auth/me"),
  logout: () => api.post("/api/auth/logout"),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: object) => api.get("/api/users", { params }),
  get: (id: number) => api.get(`/api/users/${id}`),
  create: (data: object) => api.post("/api/users", data),
  update: (id: number, data: object) => api.put(`/api/users/${id}`, data),
  toggle: (id: number) => api.patch(`/api/users/${id}/toggle`),
  delete: (id: number) => api.delete(`/api/users/${id}`),
  capacity: () => api.get("/api/users/capacity"),
  changePassword: (data: object) => api.patch("/api/users/me/password", data),
  updateProfile: (data: object) => api.put("/api/users/me/profile", data),
};

// ─── Companies ────────────────────────────────────────────────────────────────
export const companiesApi = {
  list: (params?: object) => api.get("/api/companies", { params }),
  get: (id: number) => api.get(`/api/companies/${id}`),
  create: (data: object) => api.post("/api/companies", data),
  update: (id: number, data: object) => api.put(`/api/companies/${id}`, data),
  delete: (id: number) => api.delete(`/api/companies/${id}`),
};

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projectsApi = {
  list: (params?: object) => api.get("/api/projects", { params }),
  get: (id: number) => api.get(`/api/projects/${id}`),
  getEvidences: (id: number) => api.get(`/api/projects/${id}/evidences`),
  create: (data: object) => api.post("/api/projects", data),
  update: (id: number, data: object) => api.put(`/api/projects/${id}`, data),
  delete: (id: number) => api.delete(`/api/projects/${id}`),
};

// ─── Activities ───────────────────────────────────────────────────────────────
export const activitiesApi = {
  list: (params?: object) => api.get("/api/activities", { params }),
  myActivities: (params?: object) => api.get("/api/activities/my", { params }),
  get: (id: number) => api.get(`/api/activities/${id}`),
  create: (data: object) => api.post("/api/activities", data),
  update: (id: number, data: object) => api.put(`/api/activities/${id}`, data),
  delete: (id: number) => api.delete(`/api/activities/${id}`),
  start: (id: number) => api.patch(`/api/activities/${id}/start`),
  sendReview: (id: number) => api.patch(`/api/activities/${id}/send-review`),
  approve: (id: number) => api.patch(`/api/activities/${id}/approve`),
  observe: (id: number, observation: string) => api.patch(`/api/activities/${id}/observe`, { status: "observada", observation }),
  cancel: (id: number) => api.patch(`/api/activities/${id}/cancel`),
  startTimer: (id: number) => api.patch(`/api/activities/${id}/timer/start`),
  stopTimer: (id: number) => api.patch(`/api/activities/${id}/timer/stop`),
  getHistory: (id: number) => api.get(`/api/activities/${id}/history`),
};

// ─── Evidences ────────────────────────────────────────────────────────────────
export const evidencesApi = {
  list: (activityId: number) =>
    api.get(`/api/activities/${activityId}/evidences`),
  uploadFile: (activityId: number, formData: FormData) =>
    api.post(`/api/activities/${activityId}/evidences/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  addLink: (activityId: number, data: object) =>
    api.post(`/api/activities/${activityId}/evidences/link`, data),
  delete: (id: number) => api.delete(`/api/evidences/${id}`),
};

// ─── Comments ─────────────────────────────────────────────────────────────────
export const commentsApi = {
  list: (activityId: number) =>
    api.get(`/api/activities/${activityId}/comments`),
  create: (activityId: number, content: string) =>
    api.post(`/api/activities/${activityId}/comments`, { content }),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (limit?: number) => api.get("/api/notifications", { params: { limit } }),
  unreadCount: () => api.get("/api/notifications/unread-count"),
  read: (id: number) => api.post(`/api/notifications/${id}/read`),
  readAll: () => api.post("/api/notifications/read-all"),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: (params?: object) => api.get("/api/dashboard/stats", { params }),
};

// ─── Appointments ─────────────────────────────────────────────────────────────
export const appointmentsApi = {
  createAvailability: (data: object) => api.post("/api/appointments/availability", data),
  createMeeting: (data: object) => api.post("/api/appointments/meeting", data),
  getAvailability: (params?: object) => api.get("/api/appointments/availability", { params }),
  book: (id: number, data: object) => api.patch(`/api/appointments/${id}/book`, data),
  my: () => api.get("/api/appointments/my"),
  cancel: (id: number) => api.patch(`/api/appointments/${id}/cancel`),
  delete: (id: number) => api.delete(`/api/appointments/${id}`),
};

// ─── Packages ──────────────────────────────────────────────────────────────────
export const packagesApi = {
  list: (params?: object) => api.get("/api/packages", { params }),
  create: (data: object) => api.post("/api/packages", data),
  update: (id: number, data: object) => api.put(`/api/packages/${id}`, data),
  toggleVisibility: (id: number) => api.patch(`/api/packages/${id}/toggle-visibility`),
  delete: (id: number) => api.delete(`/api/packages/${id}`),

  getCompanyPackages: (companyId: number) => api.get(`/api/packages/company/${companyId}`),
  assignToCompany: (data: object) => api.post("/api/packages/company", data),
  removeFromCompany: (cpId: number) => api.delete(`/api/packages/company/${cpId}`),
};

export const packageRequestsApi = {
  list: () => api.get("/api/package-requests"),
  create: (data: object) => api.post("/api/package-requests", data),
  uploadReceipt: (formData: FormData) =>
    api.post("/api/package-requests/upload-receipt", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  verifyPayment: (id: number, data: object) => api.post(`/api/package-requests/${id}/verify-payment`, data),
  workAction: (id: number, data: object) => api.post(`/api/package-requests/${id}/work-action`, data),
  updateStatus: (id: number, data: object) => api.patch(`/api/package-requests/${id}`, data),
};

// ─── Workflows ────────────────────────────────────────────────────────────────
export const workflowsApi = {
  list: (params?: object) => api.get("/api/workflows", { params }),
  get: (id: number) => api.get(`/api/workflows/${id}`),
  create: (data: object) => api.post("/api/workflows", data),
  update: (id: number, data: object) => api.put(`/api/workflows/${id}`, data),
  delete: (id: number) => api.delete(`/api/workflows/${id}`),
  addStage: (workflowId: number, data: object) => api.post(`/api/workflows/${workflowId}/stages`, data),
  updateStage: (stageId: number, data: object) => api.put(`/api/workflows/stages/${stageId}`, data),
  deleteStage: (stageId: number) => api.delete(`/api/workflows/stages/${stageId}`),
  addEdge: (workflowId: number, data: object) => api.post(`/api/workflows/${workflowId}/edges`, data),
  updateEdge: (edgeId: number, data: object) => api.put(`/api/workflows/edges/${edgeId}`, data),
  deleteEdge: (edgeId: number) => api.delete(`/api/workflows/edges/${edgeId}`),
};

export const departmentsApi = {
  getAll: () => api.get("/api/departments/"),
  create: (data: object) => api.post("/api/departments/", data),
  update: (id: number, data: object) => api.put(`/api/departments/${id}`, data),
  delete: (id: number) => api.delete(`/api/departments/${id}`),
};


// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsApi = {
  exportExcel: async (params?: object) => {
    try {
      const response = await api.get("/api/reports/activities/excel", {
        params,
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Reporte_Actividades_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting Excel:", error);
    }
  },
  exportPdf: async (params?: object) => {
    try {
      const response = await api.get("/api/reports/activities/pdf", {
        params,
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Reporte_Actividades_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting PDF:", error);
    }
  },
};

/* ── Operative Availability API ── */
export const operativeAvailabilityApi = {
  create: (data: { date: string; start_time?: string; end_time?: string; is_full_day?: boolean; status?: string; reason?: string; user_id?: number }) =>
    api.post<OperativeAvailability>("/api/operative-availability", data),
  my: (target_date?: string) =>
    api.get<OperativeAvailability[]>("/api/operative-availability/my", { params: { target_date } }),
  team: (target_date: string) =>
    api.get<OperativeAvailabilitySummary[]>("/api/operative-availability/team", { params: { target_date } }),
  delete: (id: number) => api.delete(`/api/operative-availability/${id}`),
};

/* ── Subscriptions Admin API ── */
export const subscriptionsApi = {
  list: () => api.get("/api/subscriptions"),
  renew: (cpId: number, days?: number) => api.patch(`/api/subscriptions/${cpId}/renew`, { days: days ?? 30 }),
  cancel: (cpId: number) => api.patch(`/api/subscriptions/${cpId}/cancel`),
  addQuota: (cpId: number, itemName: string, quantity: number) =>
    api.patch(`/api/subscriptions/${cpId}/add-quota`, { item_name: itemName, quantity }),
};

/* ── Finances API ── */
export const financesApi = {
  list: (params?: object) => api.get("/api/finances", { params }),
  summary: () => api.get("/api/finances/summary"),
  create: (data: object) => api.post("/api/finances", data),
  update: (id: number, data: object) => api.put(`/api/finances/${id}`, data),
  delete: (id: number) => api.delete(`/api/finances/${id}`),
  uploadReceipt: (formData: FormData) =>
    api.post("/api/finances/upload-receipt", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  exportExcel: async (params?: object) => {
    try {
      const response = await api.get("/api/finances/excel", {
        params,
        responseType: "blob",
      });

      // Si la respuesta es JSON (error devuelto como blob)
      if (response.data.type && response.data.type.includes("application/json")) {
        const text = await response.data.text();
        const json = JSON.parse(text);
        alert(`❌ Error al exportar Excel: ${json.detail || "No se pudo generar el archivo"}`);
        return;
      }

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Reporte_Financiero_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error al exportar Excel financiero:", error);
      let msg = "Error al exportar Excel";
      if (error?.response?.data instanceof Blob) {
        try {
          const txt = await error.response.data.text();
          const parsed = JSON.parse(txt);
          msg = parsed.detail || msg;
        } catch (_) {}
      } else if (error?.response?.data?.detail) {
        msg = error.response.data.detail;
      }
      alert(`❌ ${msg}`);
    }
  },
};

/* ── WhatsApp Chat API ── */
export const whatsappApi = {
  getChats: () => api.get("/api/whatsapp/chats"),
  getMessages: (phone: string) => api.get(`/api/whatsapp/messages/${encodeURIComponent(phone)}`),
  sendMessage: (data: {
    phone_number: string;
    client_name: string;
    company_id?: number | null;
    message_text: string;
    media_url?: string | null;
  }) => api.post("/api/whatsapp/send", data),
  simulateInbound: (data: {
    phone_number: string;
    client_name: string;
    company_id?: number | null;
    message_text: string;
  }) => api.post("/api/whatsapp/simulate-receive", data),
  getTemplates: () => api.get("/api/whatsapp/templates"),
  getConfig: () => api.get("/api/whatsapp/config"),
  saveConfig: (data: object) => api.post("/api/whatsapp/config", data),
};

