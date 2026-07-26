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


import { useWebSocket } from "@/context/WebSocketContext";

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
  const { subscribe } = useWebSocket();
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
    // Consultar cada 30 segundos como fallback
    const interval = setInterval(fetchNotifications, 30000);
    // Escuchar eventos en tiempo real por WebSocket
    const unsubscribe = subscribe("notifications", () => {
      fetchNotifications();
    });
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [subscribe]);

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
    <header className="h-16 bg-[#0A101D]/80 backdrop-blur-xl border-b border-slate-800/50 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
      {/* Título de la página */}
      <h1 className="text-lg font-bold text-white pl-8 lg:pl-0 tracking-wide">{title}</h1>

      {/* Acciones */}
      <div className="flex items-center gap-3">
        {/* Notificaciones */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#2E455C]/40 transition-all text-slate-400 hover:text-[#20CDFE] cursor-pointer",
              isOpen && "bg-[#2E455C]/40 text-[#20CDFE]"
            )}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#1ED1B4] rounded-full shadow-[0_0_8px_#1ED1B4]" />
            )}
          </button>

          {/* Dropdown de Notificaciones */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0A101D]/95 backdrop-blur-2xl border border-slate-800/50 rounded-2xl shadow-[0_10px_40px_rgba(32,205,254,0.1)] z-50 animate-fade-in flex flex-col max-h-[80vh] overflow-hidden">
              {/* Encabezado */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50 shrink-0">
                <span className="font-bold text-white text-sm">Notificaciones</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-[#20CDFE] hover:text-[#1ED1B4] transition-colors font-semibold cursor-pointer"
                  >
                    Marcar todo como leído
                  </button>
                )}
              </div>

              {/* Lista */}
              <div className="flex-1 overflow-y-auto max-h-[350px]">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <Bell size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-medium">No tienes notificaciones</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#2E455C]/20">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          "w-full text-left px-4 py-3 hover:bg-[#1C2C4D] transition-colors flex flex-col gap-0.5 cursor-pointer",
                          !n.is_read && "bg-[#20CDFE]/5"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={cn("text-xs font-semibold text-white", !n.is_read && "text-[#20CDFE]")}>
                            {n.title}
                          </span>
                          {!n.is_read && (
                            <span className="w-1.5 h-1.5 bg-[#1ED1B4] shadow-[0_0_8px_#1ED1B4] rounded-full shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-normal">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-500 mt-1">
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
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800/50 ml-1">
          <div className="w-9 h-9 bg-gradient-to-br from-[#20CDFE] to-[#1ED1B4] rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(32,205,254,0.3)]">
            <span className="text-[#07060B] text-sm font-black">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-white leading-none">{user?.name}</p>
            <p className="text-xs text-[#1ED1B4] font-medium capitalize mt-1 tracking-wide">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
