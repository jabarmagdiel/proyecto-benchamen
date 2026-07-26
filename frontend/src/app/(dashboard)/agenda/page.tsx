"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { appointmentsApi } from "@/lib/api";
import type { Appointment } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  Calendar as CalendarIcon, Clock, User, Plus, Trash2,
  CalendarCheck, HelpCircle, X, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  Building2, FileText, Bell
} from "lucide-react";

import { useWebSocket } from "@/context/WebSocketContext";

/* ───── Helpers ───── */
const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];
const DAY_NAMES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const HOURS: string[] = [];
for (let h = 7; h <= 19; h++) {
  HOURS.push(`${String(h).padStart(2,"0")}:00`);
  HOURS.push(`${String(h).padStart(2,"0")}:30`);
}

/* ───── Page ───── */
export default function AgendaPage() {
  const { user } = useAuth();
  const { subscribe } = useWebSocket();
  const isAdmin = user?.role === "administrador";

  /* Datos */
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  /* Calendarios */
  const now = new Date();
  const [calYear, setCalYear]   = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string>("");

  /* Formulario admin: nueva disponibilidad */
  const [adminStart, setAdminStart] = useState("09:00");
  const [adminEnd,   setAdminEnd]   = useState("10:00");
  const [submitting, setSubmitting] = useState(false);

  /* Modal cliente: reservar */
  const [selectedSlot, setSelectedSlot]   = useState<Appointment | null>(null);
  const [bookTitle,    setBookTitle]       = useState("");
  const [bookNotes,    setBookNotes]       = useState("");

  /* Toast */
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Carga de datos ── */
  const loadData = async () => {
    setLoading(true);
    try {
      const myRes = await appointmentsApi.my();
      setAppointments(myRes.data);
      if (!isAdmin) {
        const avail = await appointmentsApi.getAvailability();
        setAvailableSlots(avail.data);
      }
    } catch (err) {
      console.error("Error cargando agenda:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const unsubscribe = subscribe("appointments", () => {
      loadData();
    });
    return () => unsubscribe();
  }, [subscribe]);

  /* ── Acciones ── */
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay) { showToast("Selecciona una fecha en el calendario", "error"); return; }
    if (adminStart >= adminEnd) { showToast("La hora de inicio debe ser anterior a la hora de fin", "error"); return; }
    setSubmitting(true);
    try {
      await appointmentsApi.createAvailability({ date: selectedDay, start_time: adminStart, end_time: adminEnd });
      showToast("✅ Disponibilidad publicada correctamente");
      loadData();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Error al publicar horario", "error");
    } finally { setSubmitting(false); }
  };

  const handleDeleteSlot = async (id: number) => {
    if (!confirm("¿Eliminar esta ranura de disponibilidad?")) return;
    try {
      await appointmentsApi.delete(id);
      showToast("Ranura eliminada");
      loadData();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Error al eliminar", "error");
    }
  };

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !bookTitle) { showToast("El título es obligatorio", "error"); return; }
    setSubmitting(true);
    try {
      await appointmentsApi.book(selectedSlot.id, { title: bookTitle, notes: bookNotes });
      showToast("🎉 ¡Cita reservada con éxito!");
      setSelectedSlot(null); setBookTitle(""); setBookNotes("");
      loadData();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Error al reservar", "error");
    } finally { setSubmitting(false); }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("¿Cancelar esta cita?")) return;
    try {
      await appointmentsApi.cancel(id);
      showToast("Cita cancelada");
      loadData();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Error al cancelar", "error");
    }
  };

  /* ── Helpers de calendario ── */
  const daysInMonth  = getDaysInMonth(calYear, calMonth);
  const firstDayOfMonth = getFirstDayOfMonth(calYear, calMonth);

  const slotsForDay = (dateStr: string) =>
    appointments.filter(a => a.date === dateStr);

  const availForDay = (dateStr: string) =>
    availableSlots.filter(a => a.date === dateStr);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelectedDay("");
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelectedDay("");
  };

  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

  /* ── Slots del día seleccionado ── */
  const daySlots = selectedDay
    ? (isAdmin ? slotsForDay(selectedDay) : availForDay(selectedDay))
    : [];

  /* ── SlotsByDate for client overview ── */
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, Appointment[]>);

  /* ── Conteos para el resumen del admin ── */
  const totalSlots     = appointments.filter(a => a.status !== "cancelled").length;
  const bookedSlots    = appointments.filter(a => a.status === "booked").length;
  const availableCount = appointments.filter(a => a.status === "available").length;

  /* ─────────────────────────────────────────── RENDER ─── */
  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold transition-all duration-300
          ${toast.type === "success" ? "bg-emerald-500 shadow-emerald-500/25" : "bg-red-500 shadow-red-500/25"}`}>
          {toast.msg}
        </div>
      )}

      {/* ─ Header ─ */}
      <div className="bg-[#0A101D]/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-[0_10px_40px_rgba(32,205,254,0.1)] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#20CDFE]/10 rounded-full blur-3xl -translate-y-8 translate-x-8 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <CalendarCheck size={22} className="text-[#20CDFE]" />
            <span className="font-black text-xl">
              {isAdmin ? "Módulo de Calendario / Agenda (Disponibilidad)" : "Módulo de Calendario — Solicitar Cita"}
            </span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
            {isAdmin
              ? "Módulo principal de calendario para administración. Selecciona un día en el calendario y publica los horarios en los que estás disponible para reuniones con clientes."
              : "Módulo principal de calendario y agenda para clientes. Consulta los días y horarios disponibles del administrador y reserva la cita que mejor se adapte a tus necesidades."}
          </p>
          {isAdmin && (
            <div className="flex flex-wrap gap-4 mt-5">
              <div className="bg-[#07060B]/50 backdrop-blur-md border border-slate-800/50 rounded-2xl px-4 py-3 text-center">
                <p className="text-2xl font-black">{totalSlots}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Slots</p>
              </div>
              <div className="bg-[#07060B]/50 backdrop-blur-md border border-slate-800/50 rounded-2xl px-4 py-3 text-center">
                <p className="text-2xl font-black text-[#1ED1B4]">{bookedSlots}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reservadas</p>
              </div>
              <div className="bg-[#07060B]/50 backdrop-blur-md border border-slate-800/50 rounded-2xl px-4 py-3 text-center">
                <p className="text-2xl font-black text-[#20CDFE]">{availableCount}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Disponibles</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
        </div>
      ) : isAdmin ? (

        /* ══════════════════════ VISTA ADMIN ══════════════════════ */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ─ Columna Izquierda: Calendario + Formulario ─ */}
          <div className="xl:col-span-1 space-y-4">

            {/* Calendario */}
            <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm p-5">
              {/* Nav mes */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#1C2C4D] text-slate-400 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <span className="font-bold text-white text-sm">{MONTHS[calMonth]} {calYear}</span>
                <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#1C2C4D] text-slate-400 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Nombres de días */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">{d}</div>
                ))}
              </div>

              {/* Celdas */}
              <div className="grid grid-cols-7 gap-0.5">
                {/* Espacios vacíos al inicio */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {/* Días */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d   = i + 1;
                  const ds  = toDateStr(calYear, calMonth, d);
                  const hasSlots   = slotsForDay(ds).length > 0;
                  const hasBooked  = slotsForDay(ds).some(a => a.status === "booked");
                  const isToday    = ds === today;
                  const isSelected = ds === selectedDay;
                  const isPast     = ds < today;
                  return (
                    <button
                      key={d}
                      disabled={isPast}
                      onClick={() => setSelectedDay(ds)}
                      className={`relative h-9 w-full rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all duration-200
                        ${isSelected ? "bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] shadow-lg shadow-[#20CDFE]/20" :
                          isToday    ? "bg-[#20CDFE]/10 text-[#20CDFE] ring-2 ring-[#20CDFE]/30" :
                          isPast     ? "text-slate-500 cursor-not-allowed" :
                          hasSlots   ? "text-white hover:bg-[#15233D]" :
                                       "text-slate-300 hover:bg-[#15233D]"}
                      `}
                    >
                      {d}
                      {hasSlots && !isSelected && (
                        <span className={`absolute bottom-1 w-1 h-1 rounded-full ${hasBooked ? "bg-[#1ED1B4]" : "bg-[#20CDFE]"}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Leyenda */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800/50 text-[10px] font-semibold text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#20CDFE] inline-block" />Disponible</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1ED1B4] inline-block" />Reservada</span>
              </div>
            </div>

            {/* Formulario: Publicar Disponibilidad */}
            <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm p-5">
              <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                <Plus size={16} className="text-[#20CDFE]" />
                Publicar Disponibilidad
              </h3>
              <form onSubmit={handleCreateSlot} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fecha seleccionada</label>
                  <div className={`px-3.5 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-2
                    ${selectedDay
                      ? "border-slate-800 bg-[#20CDFE]/10 text-[#20CDFE]"
                      : "border-slate-800/50 bg-[#0A101D]/80 text-slate-400"}`}>
                    <CalendarIcon size={14} />
                    {selectedDay ? formatDate(selectedDay) : "Haz clic en un día del calendario"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hora inicio *</label>
                    <select
                      value={adminStart}
                      onChange={e => setAdminStart(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE] bg-[#0A101D]/80"
                    >
                      {HOURS.map(h => <option key={`s-${h}`} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hora fin *</label>
                    <select
                      value={adminEnd}
                      onChange={e => setAdminEnd(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE] bg-[#0A101D]/80"
                    >
                      {HOURS.map(h => <option key={`e-${h}`} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedDay}
                  className="w-full bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 shadow-lg shadow-[#20CDFE]/20 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={15} />
                  {submitting ? "Publicando..." : "Publicar este horario"}
                </button>
              </form>
            </div>
          </div>

          {/* ─ Columna Derecha: Lista de citas / Panel del día ─ */}
          <div className="xl:col-span-2 space-y-4">

            {/* Panel del día seleccionado */}
            {selectedDay && (
              <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <CalendarIcon size={16} className="text-[#20CDFE]" />
                    {formatDate(selectedDay)}
                  </h3>
                  <button onClick={() => setSelectedDay("")} className="text-slate-400 hover:text-slate-300 transition-colors">
                    <X size={16} />
                  </button>
                </div>

                {daySlots.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    <Clock size={28} className="mx-auto mb-2 opacity-25" />
                    <p className="font-semibold">No hay slots publicados para este día.</p>
                    <p className="mt-1">Usa el formulario de la izquierda para agregar uno.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {daySlots.map(apt => (
                      <div
                        key={apt.id}
                        className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all
                          ${apt.status === "booked" ? "border-emerald-100 bg-emerald-50/30" :
                            apt.status === "cancelled" ? "border-slate-800/50 bg-[#0F192E] opacity-50" :
                            "border-slate-800/50 bg-[#0A101D]/80 hover:border-slate-800"}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-[#20CDFE] bg-[#20CDFE]/10 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0">
                            <Clock size={11} />
                            {apt.start_time} – {apt.end_time}
                          </span>
                          {apt.status === "booked" ? (
                            <span className="text-[10px] font-bold text-[#07060B] bg-[#1ED1B4] px-2 py-0.5 rounded-full uppercase">Reservada</span>
                          ) : apt.status === "cancelled" ? (
                            <span className="text-[10px] font-bold text-slate-400 bg-[#1C2C4D] px-2 py-0.5 rounded-full uppercase">Cancelada</span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#20CDFE] bg-[#20CDFE]/10 px-2 py-0.5 rounded-full uppercase">Disponible</span>
                          )}
                        </div>

                        {apt.status === "booked" && (
                          <div className="space-y-1">
                            {apt.title && <p className="text-xs font-bold text-white truncate">{apt.title}</p>}
                            {apt.notes && <p className="text-[11px] text-slate-400 line-clamp-2">{apt.notes}</p>}
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium pt-1 border-t border-slate-800/50">
                              <User size={11} className="text-slate-400 shrink-0" />
                              <span className="truncate">{apt.client_name} · {apt.company_name}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          {apt.status === "available" && (
                            <button
                              onClick={() => handleDeleteSlot(apt.id)}
                              className="text-[11px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                            >
                              <Trash2 size={12} /> Eliminar
                            </button>
                          )}
                          {apt.status === "booked" && (
                            <button
                              onClick={() => handleCancel(apt.id)}
                              className="text-[11px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                            >
                              <XCircle size={12} /> Cancelar cita
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Listado completo de citas */}
            <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm p-5">
              <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                <CalendarCheck size={16} className="text-[#20CDFE]" />
                Mi Agenda Completa
                {appointments.length > 0 && (
                  <span className="ml-auto text-xs bg-[#20CDFE]/20 text-[#20CDFE] font-bold px-2.5 py-0.5 rounded-full">
                    {appointments.length} slot{appointments.length !== 1 ? "s" : ""}
                  </span>
                )}
              </h3>

              {appointments.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <CalendarIcon size={40} className="mx-auto mb-3 opacity-20" />
                  <p className="font-semibold text-sm">No hay slots publicados todavía.</p>
                  <p className="text-xs mt-1">Selecciona un día en el calendario y publica tu disponibilidad.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {[...appointments]
                    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
                    .map(apt => (
                      <div
                        key={apt.id}
                        className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all
                          ${apt.status === "booked" ? "border-emerald-100 bg-emerald-50/20" :
                            apt.status === "cancelled" ? "border-slate-800/50 bg-[#15233D]/40 opacity-55" :
                            "border-slate-800/50 bg-[#0A101D]/80 hover:bg-[#0F192E]"}`}
                      >
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-slate-300 bg-[#1C2C4D] px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0">
                            <CalendarIcon size={11} />
                            {formatDate(apt.date)}
                          </span>
                          <span className="text-xs font-bold text-[#20CDFE] bg-[#20CDFE]/10 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0">
                            <Clock size={11} />
                            {apt.start_time} – {apt.end_time}
                          </span>
                          {apt.status === "booked" && apt.client_name && (
                            <span className="text-xs text-slate-300 flex items-center gap-1 truncate">
                              <User size={11} className="text-slate-400 shrink-0" />
                              {apt.client_name} ({apt.company_name})
                            </span>
                          )}
                          {apt.status === "booked" && apt.title && (
                            <span className="text-xs text-slate-400 italic truncate max-w-xs">"{apt.title}"</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {apt.status === "booked" ? (
                            <>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">Reservada</span>
                              <button onClick={() => handleCancel(apt.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancelar"><XCircle size={15} /></button>
                            </>
                          ) : apt.status === "available" ? (
                            <>
                              <span className="text-[10px] font-bold text-[#20CDFE] bg-[#20CDFE]/10 px-2 py-0.5 rounded-full uppercase">Disponible</span>
                              <button onClick={() => handleDeleteSlot(apt.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><Trash2 size={15} /></button>
                            </>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 bg-[#1C2C4D] px-2 py-0.5 rounded-full uppercase">Cancelada</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

      ) : (

        /* ══════════════════════ VISTA CLIENTE ══════════════════════ */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Disponibles */}
          <div className="lg:col-span-2 space-y-4">

            {/* Calendario de selección */}
            <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#1C2C4D] text-slate-400 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <span className="font-bold text-white text-sm">{MONTHS[calMonth]} {calYear}</span>
                <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#1C2C4D] text-slate-400 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d   = i + 1;
                  const ds  = toDateStr(calYear, calMonth, d);
                  const hasAvail   = availForDay(ds).length > 0;
                  const isToday    = ds === today;
                  const isSelected = ds === selectedDay;
                  const isPast     = ds < today;
                  return (
                    <button
                      key={d}
                      disabled={isPast || !hasAvail}
                      onClick={() => setSelectedDay(ds)}
                      className={`relative h-10 w-full rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all duration-200
                        ${isSelected ? "bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] shadow-lg shadow-[#20CDFE]/20" :
                          isToday    ? "bg-[#20CDFE]/10 text-[#20CDFE] ring-2 ring-[#20CDFE]/30" :
                          isPast     ? "text-slate-500 cursor-not-allowed" :
                                       "text-white hover:bg-[#20CDFE]/10 hover:text-[#20CDFE] cursor-pointer"}`}
                    >
                      {d}
                      {/* Puntito si hay disponibilidad */}
                      {hasAvail && !isSelected && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#20CDFE]" />
                      )}
                    </button>
                  );
                })}
              </div>
              {availableSlots.length === 0 && (
                <p className="text-center text-xs text-slate-400 mt-4 pt-3 border-t border-[#2E455C]/20">
                  No hay días con disponibilidad publicada en este momento.
                </p>
              )}
            </div>

            {/* Slots del día seleccionado */}
            {selectedDay && (
              <div className="bg-[#0A101D]/80 rounded-2xl border border-slate-800 shadow-sm p-5">
                <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                  <Clock size={15} className="text-[#20CDFE]" />
                  Horarios disponibles — {formatDate(selectedDay)}
                </h3>
                {daySlots.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-8">No hay horarios disponibles para este día.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {daySlots.map(slot => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-slate-800 bg-[#20CDFE]/10 hover:bg-[#20CDFE] hover:text-[#07060B] hover:border-[#20CDFE] rounded-xl text-xs font-bold text-[#20CDFE] transition-all duration-200 shadow-sm"
                      >
                        <Clock size={12} />
                        {slot.start_time} – {slot.end_time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Vista general por fecha */}
            {!selectedDay && Object.keys(slotsByDate).length > 0 && (
              <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm p-5">
                <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                  <Bell size={15} className="text-[#20CDFE]" />
                  Próximas Disponibilidades
                </h3>
                <div className="space-y-4">
                  {Object.entries(slotsByDate).sort(([a], [b]) => a.localeCompare(b)).map(([dateStr, slots]) => (
                    <div key={dateStr} className="space-y-2 pb-4 border-b border-[#2E455C]/20 last:border-0 last:pb-0">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{formatDate(dateStr)}</h4>
                      <div className="flex flex-wrap gap-2">
                        {slots.map(slot => (
                          <button
                            key={slot.id}
                            onClick={() => { setSelectedDay(dateStr); setSelectedSlot(slot); }}
                            className="flex items-center gap-1.5 px-3 py-2 border border-slate-800 bg-[#20CDFE]/10 hover:bg-[#20CDFE] hover:text-[#07060B] hover:border-[#20CDFE] rounded-xl text-xs font-bold text-[#20CDFE] transition-all duration-200"
                          >
                            <Clock size={11} />
                            {slot.start_time} – {slot.end_time}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!selectedDay && Object.keys(slotsByDate).length === 0 && (
              <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm p-10 text-center text-slate-400">
                <HelpCircle size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-semibold text-sm">No hay horarios disponibles en este momento.</p>
                <p className="text-xs mt-1">Por favor, contacta al administrador para coordinar una reunión.</p>
              </div>
            )}
          </div>

          {/* Panel de citas del cliente */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm p-5">
              <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                <CalendarCheck size={15} className="text-[#20CDFE]" />
                Mis Citas Programadas
                {appointments.filter(a => a.status === "booked").length > 0 && (
                  <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full">
                    {appointments.filter(a => a.status === "booked").length}
                  </span>
                )}
              </h3>

              {appointments.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <CalendarIcon size={32} className="mx-auto mb-2 opacity-20" />
                  <p>Aún no tienes citas agendadas.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {[...appointments]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map(apt => (
                      <div
                        key={apt.id}
                        className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all
                          ${apt.status === "cancelled" ? "border-slate-800/50 bg-[#0F192E] opacity-60" : "border-emerald-100 bg-emerald-50/20"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                            ${apt.status === "booked" ? "text-emerald-700 bg-emerald-100" : "text-slate-400 bg-[#1C2C4D]"}`}>
                            {apt.status === "booked" ? "Agendada" : "Cancelada"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{formatDate(apt.date)}</span>
                        </div>
                        <h4 className={`font-bold text-white text-sm leading-tight ${apt.status === "cancelled" ? "line-through text-slate-400" : ""}`}>
                          {apt.title || "Reunión"}
                        </h4>
                        {apt.notes && <p className="text-[11px] text-slate-400 line-clamp-2">{apt.notes}</p>}
                        <div className="flex items-center justify-between border-t border-slate-800/50 pt-2 text-xs">
                          <span className="text-[#20CDFE] font-bold flex items-center gap-1">
                            <Clock size={11} /> {apt.start_time} – {apt.end_time}
                          </span>
                          {apt.status === "booked" && (
                            <button onClick={() => handleCancel(apt.id)} className="text-[10px] font-bold text-red-500 hover:text-red-700">
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Tip card */}
            <div className="bg-[#0A101D]/50 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-1.5">
              <p className="font-bold text-[#20CDFE] flex items-center gap-1.5"><FileText size={13} />¿Cómo reservar?</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
                <li>Selecciona un día <strong>marcado</strong> en el calendario.</li>
                <li>Haz clic en el horario que prefieras.</li>
                <li>Completa el título y notas de la reunión.</li>
                <li>Confirma y ¡listo!</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Reservar Cita ── */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D]/90 backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_rgba(32,205,254,0.15)] border border-slate-800/50 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
              <div>
                <h3 className="text-lg font-bold text-white">Solicitar Cita</h3>
                <p className="text-xs text-slate-400 mt-0.5">Completa los datos de tu reunión.</p>
              </div>
              <button onClick={() => setSelectedSlot(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#1C2C4D] text-slate-400 hover:text-slate-300 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBookSlot} className="p-6 space-y-4">
              <div className="bg-[#0A101D]/50 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                <p className="font-bold text-[#20CDFE] flex items-center gap-1.5"><HelpCircle size={14} /> ¿Qué ocurre ahora?</p>
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <CalendarIcon size={13} className="shrink-0" />
                  {formatDate(selectedSlot.date)}
                </div>
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <Clock size={13} className="shrink-0" />
                  {selectedSlot.start_time} – {selectedSlot.end_time}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Motivo o título de la reunión *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Revisión de avance del proyecto"
                  value={bookTitle}
                  onChange={e => setBookTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notas adicionales</label>
                <textarea
                  placeholder="Ej. Queremos revisar los entregables y el cronograma de la próxima fase."
                  value={bookNotes}
                  onChange={e => setBookNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE] transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-800/50 rounded-xl text-sm text-slate-300 hover:bg-[#15233D] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !bookTitle}
                  className="flex-1 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all shadow-lg shadow-[#20CDFE]/15 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={15} />
                  {submitting ? "Confirmando..." : "Confirmar Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
