import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: "violet" | "blue" | "green" | "amber" | "red" | "slate";
  trend?: { value: number; label: string };
  className?: string;
  subtitle?: string;
}

const colorMap = {
  violet: { 
    iconBg: "bg-violet-500/10 text-violet-600 border border-violet-500/20", 
    gradient: "from-violet-500/5 to-transparent", 
    accent: "bg-violet-500",
    shadow: "hover:shadow-violet-500/5"
  },
  blue: { 
    iconBg: "bg-blue-500/10 text-blue-600 border border-blue-500/20", 
    gradient: "from-blue-500/5 to-transparent", 
    accent: "bg-blue-500",
    shadow: "hover:shadow-blue-500/5"
  },
  green: { 
    iconBg: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20", 
    gradient: "from-emerald-500/5 to-transparent", 
    accent: "bg-emerald-500",
    shadow: "hover:shadow-emerald-500/5"
  },
  amber: { 
    iconBg: "bg-amber-500/10 text-amber-600 border border-amber-500/20", 
    gradient: "from-amber-500/5 to-transparent", 
    accent: "bg-amber-500",
    shadow: "hover:shadow-amber-500/5"
  },
  red: { 
    iconBg: "bg-rose-500/10 text-rose-600 border border-rose-500/20", 
    gradient: "from-rose-500/5 to-transparent", 
    accent: "bg-rose-500",
    shadow: "hover:shadow-rose-500/5"
  },
  slate: { 
    iconBg: "bg-slate-500/10 text-slate-600 border border-slate-500/20", 
    gradient: "from-slate-500/5 to-transparent", 
    accent: "bg-slate-500",
    shadow: "hover:shadow-slate-500/5"
  },
};

export function StatCard({ title, value, icon: Icon, color = "violet", trend, className, subtitle }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn(
      "relative bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-[#20CDFE]/10 p-5 flex items-start gap-4 shadow-sm hover:shadow-[0_10px_30px_rgba(32,205,254,0.1)] hover:-translate-y-1 transition-all duration-300 overflow-hidden group",
      c.shadow,
      className
    )}>
      {/* Background Gradient Layer */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-300 group-hover:opacity-100", c.gradient)} />
      
      {/* Left Accent Line */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-full", c.accent)} />

      {/* Icon Wrapper */}
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110", c.iconBg)}>
        <Icon size={22} className="relative z-10" />
      </div>

      {/* Text Info */}
      <div className="min-w-0 relative z-10 flex-1">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-extrabold text-white mt-1 leading-tight tracking-tight">{value}</p>
        {subtitle && (
          <p className="text-slate-400 text-[11px] mt-1 truncate">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              trend.value >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
            )}>
              {trend.value >= 0 ? "▲" : "▼"} {Math.abs(trend.value)}%
            </span>
            <span className="text-[10px] text-slate-400 font-medium">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
