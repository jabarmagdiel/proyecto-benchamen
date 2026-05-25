import { cn } from "@/lib/utils";
import type { ActivityStatus, Priority, ACTIVITY_STATUS_LABELS } from "@/types";
import { ACTIVITY_STATUS_LABELS as STATUS_LABELS, PRIORITY_LABELS } from "@/types";
import { STATUS_COLORS, PRIORITY_COLORS } from "@/lib/utils";

interface StatusBadgeProps {
  status: ActivityStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
        STATUS_COLORS[status],
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status]}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const icons: Record<Priority, string> = {
    baja: "↓",
    media: "→",
    alta: "↑",
    urgente: "⚡",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
        PRIORITY_COLORS[priority],
        className
      )}
    >
      {icons[priority]} {PRIORITY_LABELS[priority]}
    </span>
  );
}
