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
  const dStr = typeof deadline === "string" ? deadline.substring(0, 10) : "";
  if (!dStr) return false;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return todayStr > dStr;
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const STATUS_COLORS: Record<ActivityStatus, string> = {
  pendiente:    "bg-slate-500/20 text-slate-300 border-slate-500/30",
  bloqueada:    "bg-stone-500/20 text-stone-300 border-stone-500/30",
  asignada:     "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  en_proceso:   "bg-[#20CDFE]/20 text-[#20CDFE] border-[#20CDFE]/30",
  en_revision:  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  observada:    "bg-amber-500/20 text-amber-300 border-amber-500/30",
  aprobada:     "bg-[#1ED1B4]/20 text-[#1ED1B4] border-[#1ED1B4]/30",
  cancelada:    "bg-red-500/20 text-red-300 border-red-500/30",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  baja:    "bg-slate-500/20 text-slate-300",
  media:   "bg-blue-500/20 text-blue-300",
  alta:    "bg-orange-500/20 text-orange-300",
  urgente: "bg-red-500/20 text-red-300",
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
