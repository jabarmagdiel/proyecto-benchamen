import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isAfter, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { ActivityStatus, Priority } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date?: string | null): string {
  if (!date) return "-";
  try {
    return format(parseISO(date), "dd/MM/yyyy", { locale: es });
  } catch {
    return date;
  }
}

export function formatDateTime(date?: string | null): string {
  if (!date) return "-";
  try {
    return format(parseISO(date), "dd/MM/yyyy HH:mm", { locale: es });
  } catch {
    return date;
  }
}

export function isOverdue(deadline?: string | null, status?: ActivityStatus): boolean {
  if (!deadline || status === "aprobada" || status === "cancelada") return false;
  return isAfter(new Date(), parseISO(deadline));
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const STATUS_COLORS: Record<ActivityStatus, string> = {
  pendiente:    "bg-slate-100 text-slate-700 border-slate-200",
  bloqueada:    "bg-stone-100 text-stone-600 border-stone-200",
  asignada:     "bg-indigo-100 text-indigo-700 border-indigo-200",
  en_proceso:   "bg-violet-100 text-violet-700 border-violet-200",
  en_revision:  "bg-blue-100 text-blue-700 border-blue-200",
  observada:    "bg-amber-100 text-amber-700 border-amber-200",
  aprobada:     "bg-green-100 text-green-700 border-green-200",
  cancelada:    "bg-red-100 text-red-700 border-red-200",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  baja:    "bg-slate-100 text-slate-600",
  media:   "bg-blue-100 text-blue-700",
  alta:    "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700",
};

export const STATUS_DOT_COLORS: Record<ActivityStatus, string> = {
  pendiente:   "bg-slate-400",
  bloqueada:   "bg-stone-400",
  asignada:    "bg-indigo-500",
  en_proceso:  "bg-violet-500",
  en_revision: "bg-blue-500",
  observada:   "bg-amber-500",
  aprobada:    "bg-green-500",
  cancelada:   "bg-red-500",
};

// Colores para gráficas Recharts
export const CHART_COLORS = [
  "#7c3aed", "#6366f1", "#3b82f6", "#f59e0b", "#22c55e", "#ef4444", "#94a3b8",
];
