"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, FolderKanban, ClipboardList,
  CheckSquare, Users, BarChart3, LogOut, ChevronLeft,
  ChevronRight, Menu, X, User, Calendar, GitMerge, Package, DollarSign, ShieldCheck, Sparkles,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/dashboard",              icon: LayoutDashboard, label: "Dashboard" },
  { href: "/finanzas",               icon: DollarSign,      label: "Finanzas General" },
  { href: "/finanzas/ingresos",      icon: ArrowUpRight,    label: "Ingresos" },
  { href: "/finanzas/egresos",       icon: ArrowDownRight,  label: "Egresos" },
  { href: "/empresas",               icon: Building2,       label: "Empresas" },
  { href: "/proyectos",              icon: FolderKanban,    label: "Proyectos" },
  { href: "/actividades",            icon: ClipboardList,   label: "Actividades" },
  { href: "/calendario-actividades", icon: Calendar,        label: "Calendario Actividades" },
  { href: "/departamentos",          icon: Building2,       label: "Roles Operativos" },
  { href: "/paquetes",               icon: Package,         label: "Paquetes" },
  { href: "/suscripciones",          icon: ShieldCheck,     label: "Suscripciones" },
  { href: "/aprobaciones",           icon: CheckSquare,     label: "Aprobaciones" },
  { href: "/agenda",                 icon: Calendar,        label: "Agenda & Disponibilidad" },
  { href: "/usuarios",               icon: Users,           label: "Usuarios" },
  { href: "/reportes",               icon: BarChart3,       label: "Reportes" },
];

const gerenciaLinks = [
  { href: "/dashboard",              icon: LayoutDashboard, label: "Dashboard" },
  { href: "/proyectos",              icon: FolderKanban,    label: "Proyectos" },
  { href: "/actividades",            icon: ClipboardList,   label: "Gestión de Actividades" },
  { href: "/calendario-actividades", icon: Calendar,        label: "Calendario Actividades" },
  { href: "/mis-actividades",        icon: CheckSquare,     label: "Mis Tareas / Entregas" },
  { href: "/aprobaciones",           icon: CheckSquare,     label: "Aprobaciones" },
  { href: "/agenda",                 icon: Calendar,        label: "Agenda & Disponibilidad" },
  { href: "/reportes",               icon: BarChart3,       label: "Reportes" },
];

const operativeLinks = [
  { href: "/dashboard",              icon: LayoutDashboard, label: "Dashboard" },
  { href: "/mis-actividades",        icon: CheckSquare,     label: "Mis Actividades" },
  { href: "/calendario-actividades", icon: Calendar,        label: "Calendario Actividades" },
  { href: "/agenda",                 icon: Calendar,        label: "Mi Disponibilidad / Agenda" },
];

const clientLinks = [
  { href: "/dashboard",              icon: LayoutDashboard, label: "Dashboard" },
  { href: "/mis-paquetes",           icon: Package,         label: "Mis Paquetes" },
  { href: "/mis-servicios",          icon: Sparkles,        label: "Solicitar Servicios" },
  { href: "/calendario-actividades", icon: Calendar,        label: "Calendario Actividades" },
  { href: "/aprobaciones",           icon: CheckSquare,     label: "Aprobaciones" },
  { href: "/agenda",                 icon: Calendar,        label: "Citas / Agenda" },
];

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  let links = operativeLinks;
  if (user?.role === "administrador") {
    links = adminLinks;
  } else if (user?.role === "gerencia") {
    links = gerenciaLinks;
  } else if (user?.role === "cliente") {
    links = clientLinks;
  }


  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center px-4 py-5 border-b border-slate-800/50",
        collapsed ? "justify-center px-0" : "justify-center"
      )}>
        <div className={cn(
          "flex shrink-0 items-center justify-center relative overflow-hidden transition-all duration-300",
          collapsed ? "w-10 h-10" : "w-48 h-16"
        )}>
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
                active
                  ? "bg-gradient-to-r from-[#20CDFE]/20 to-[#1ED1B4]/10 text-[#20CDFE] border border-slate-800/50 shadow-[0_0_20px_rgba(32,205,254,0.1)]"
                  : "text-slate-400 hover:text-white hover:bg-[#15233D]",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon size={18} className={cn("shrink-0 transition-colors", active ? "text-[#20CDFE]" : "text-slate-400 group-hover:text-[#1ED1B4]")} />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 bg-[#1ED1B4] rounded-full shadow-[0_0_10px_#1ED1B4]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-slate-800/50 p-3">
        <Link
          href="/perfil"
          title={collapsed ? "Mi Perfil" : undefined}
          className={cn(
            "flex items-center gap-3 px-2 py-2 mb-2 rounded-xl hover:bg-[#15233D] transition-all group border border-transparent hover:border-slate-800/50",
            collapsed && "justify-center",
            pathname === "/perfil" && "bg-[#15233D] border-slate-800/50"
          )}
        >
          <div className="w-8 h-8 rounded-xl bg-[#2E455C]/40 group-hover:bg-[#2E455C]/60 border border-slate-800/50 flex items-center justify-center shrink-0 transition-colors">
            <User size={15} className="text-[#20CDFE]" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate group-hover:text-[#20CDFE] transition-colors">{user?.name}</p>
              <p className="text-slate-400 text-[10px] capitalize">{user?.role}</p>
            </div>
          )}
        </Link>
        <button
          onClick={logout}
          title={collapsed ? "Cerrar sesión" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm",
            collapsed && "justify-center"
          )}
        >
          <LogOut size={16} />
          {!collapsed && "Cerrar sesión"}
        </button>
      </div>

      {/* Collapse button (desktop) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-[#0A101D] border border-slate-800/50 rounded-full items-center justify-center text-slate-400 hover:text-[#20CDFE] transition-colors z-10 hover:border-[#20CDFE]/50"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[#0A101D] border border-slate-800/50 text-white rounded-xl flex items-center justify-center shadow-lg"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col sticky top-0 h-screen bg-[#0A101D]/80 backdrop-blur-2xl border-r border-slate-800/50 transition-all duration-300 z-30 shrink-0",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        <NavContent />
      </aside>

      {/* Sidebar mobile */}
      <aside
        className={cn(
          "lg:hidden flex flex-col fixed left-0 top-0 h-full w-[260px] bg-[#0A101D] border-r border-slate-800/50 transition-all duration-300 z-50",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
// Trigger reload
