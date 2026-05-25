"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, FolderKanban, ClipboardList,
  CheckSquare, Users, BarChart3, LogOut, ChevronLeft,
  ChevronRight, Menu, X, User, Calendar, GitMerge
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/dashboard",        icon: LayoutDashboard, label: "Dashboard" },
  { href: "/empresas",         icon: Building2,       label: "Empresas" },
  { href: "/proyectos",        icon: FolderKanban,    label: "Proyectos" },
  { href: "/actividades",      icon: ClipboardList,   label: "Actividades" },
  { href: "/workflows",        icon: GitMerge,        label: "Flujos" },
  { href: "/departamentos",    icon: Building2,       label: "Departamentos" },
  { href: "/aprobaciones",     icon: CheckSquare,     label: "Aprobaciones" },
  { href: "/agenda",           icon: Calendar,        label: "Agenda" },
  { href: "/usuarios",         icon: Users,           label: "Usuarios" },
  { href: "/capacidad",        icon: BarChart3,       label: "Capacidad" },
  { href: "/reportes",         icon: BarChart3,       label: "Reportes" },
];

const operativeLinks = [
  { href: "/dashboard",        icon: LayoutDashboard, label: "Dashboard" },
  { href: "/mis-actividades",  icon: CheckSquare,     label: "Mis Actividades" },
];

const clientLinks = [
  { href: "/dashboard",        icon: LayoutDashboard, label: "Dashboard" },
  { href: "/aprobaciones",     icon: CheckSquare,     label: "Aprobaciones" },
  { href: "/agenda",           icon: Calendar,        label: "Agenda" },
];

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  let links = operativeLinks;
  if (user?.role === "administrador") {
    links = adminLinks;
  } else if (user?.role === "cliente") {
    links = clientLinks;
  }


  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-slate-700/50",
        collapsed && "justify-center px-0"
      )}>
        <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shrink-0">
          <BarChart3 size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-white text-sm leading-none">TuCreatega</p>
            <p className="text-slate-400 text-xs mt-0.5">Project Manager</p>
          </div>
        )}
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
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-900/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-slate-700/50 p-3">
        <Link
          href="/perfil"
          title={collapsed ? "Mi Perfil" : undefined}
          className={cn(
            "flex items-center gap-3 px-2 py-2 mb-2 rounded-xl hover:bg-slate-800 transition-all group",
            collapsed && "justify-center",
            pathname === "/perfil" && "bg-slate-800"
          )}
        >
          <div className="w-8 h-8 rounded-xl bg-violet-600/30 group-hover:bg-violet-600/40 flex items-center justify-center shrink-0 transition-colors">
            <User size={15} className="text-violet-300" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate group-hover:text-violet-200 transition-colors">{user?.name}</p>
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
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full items-center justify-center text-slate-400 hover:text-white transition-colors z-10"
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
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-lg"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col sticky top-0 h-screen bg-slate-900 border-r border-slate-700/50 transition-all duration-300 z-30 shrink-0",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        <NavContent />
      </aside>

      {/* Sidebar mobile */}
      <aside
        className={cn(
          "lg:hidden flex flex-col fixed left-0 top-0 h-full w-[260px] bg-slate-900 border-r border-slate-700/50 transition-all duration-300 z-50",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
// Trigger reload
