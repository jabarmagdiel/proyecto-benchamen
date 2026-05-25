"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { notificationsApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { NotificationItem } from "@/types";


const PAGE_TITLES: Record<string, string> = {
  "/dashboard":      "Dashboard",
  "/empresas":       "Gestión de Empresas",
  "/proyectos":      "Gestión de Proyectos",
  "/actividades":    "Gestión de Actividades",
  "/mis-actividades":"Mis Actividades",
  "/agenda":         "Agenda & Disponibilidad",
  "/usuarios":       "Gestión de Usuarios",
  "/reportes":       "Reportes",
  "/perfil":         "Mi Perfil",
};

export default function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const title = PAGE_TITLES[pathname] || "TuCreatega";

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        notificationsApi.unreadCount(),
        notificationsApi.list(10), // obtener las últimas 10 notificaciones
      ]);
      setUnreadCount(countRes.data.count);
      setNotifications(listRes.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Consultar cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.readAll();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    try {
      if (!notif.is_read) {
        await notificationsApi.read(notif.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      }
      setIsOpen(false);
      if (notif.link) {
        router.push(notif.link);
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
      {/* Título de la página */}
      <h1 className="text-lg font-semibold text-slate-800 pl-8 lg:pl-0">{title}</h1>

      {/* Acciones */}
      <div className="flex items-center gap-3">
        {/* Notificaciones */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700 cursor-pointer",
              isOpen && "bg-slate-100 text-slate-800"
            )}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-600 rounded-full" />
            )}
          </button>

          {/* Dropdown de Notificaciones */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 animate-fade-in flex flex-col max-h-[80vh] overflow-hidden">
              {/* Encabezado */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
                <span className="font-bold text-slate-800 text-sm">Notificaciones</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-violet-600 hover:text-violet-700 hover:underline font-semibold cursor-pointer"
                  >
                    Marcar todo como leído
                  </button>
                )}
              </div>

              {/* Lista */}
              <div className="flex-1 overflow-y-auto max-h-[350px]">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Bell size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-medium">No tienes notificaciones</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          "w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex flex-col gap-0.5 cursor-pointer",
                          !n.is_read && "bg-violet-50/20"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={cn("text-xs font-semibold text-slate-800", !n.is_read && "text-violet-900")}>
                            {n.title}
                          </span>
                          {!n.is_read && (
                            <span className="w-1.5 h-1.5 bg-violet-600 rounded-full shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-normal">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Usuario */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-100">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700 leading-none">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize mt-0.5">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
