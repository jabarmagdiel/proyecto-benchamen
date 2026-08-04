"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { appointmentsApi, operativeAvailabilityApi } from "@/lib/api";
import type { Appointment, OperativeAvailability, OperativeAvailabilitySummary } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  Calendar as CalendarIcon, Clock, User, Plus, Trash2,
  CalendarCheck, HelpCircle, X, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  Building2, FileText, Bell, Users, ShieldAlert, ShieldCheck, Briefcase, Lock,
  AlertTriangle, RefreshCw
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
for (let h = 7; h <= 20; h++) {
  HOURS.push(`${String(h).padStart(2,"0")}:00`);
  HOURS.push(`${String(h).padStart(2,"0")}:30`);
}

/* ───── Page ───── */
export default function AgendaPage() {
  const { user } = useAuth();
  const { subscribe } = useWebSocket();
  const isAdmin = user?.role === "administrador";

  /* Pestaña Principal: 'citas' vs 'disponibilidad' */
  const [mainTab, setMainTab] = useState<"citas" | "disponibilidad">("citas");

  /* ─── PESTAÑA 1: CITAS ADMIN/CLIENTE ─── */
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [calYear, setCalYear]   = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string>("");

  const [adminStart, setAdminStart] = useState("09:00");
  const [adminEnd,   setAdminEnd]   = useState("10:00");
  const [submitting, setSubmitting] = useState(false);

  const [selectedSlot, setSelectedSlot]   = useState<Appointment | null>(null);
  const [bookStartTime, setBookStartTime] = useState("");
  const [bookEndTime, setBookEndTime]     = useState("");
  const [bookTitle,    setBookTitle]       = useState("");
  const [bookNotes,    setBookNotes]       = useState("");

  /* ─── PESTAÑA 2: DISPONIBILIDAD FREELANCE DEL EQUIPO ─── */
  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
  const [opDate, setOpDate] = useState<string>(todayStr);
  const [teamMatrix, setTeamMatrix] = useState<OperativeAvailabilitySummary[]>([]);
  const [myBusyBlocks, setMyBusyBlocks] = useState<OperativeAvailability[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  /* Formulario Bloqueo Freelance */
  const [blockStart, setBlockStart] = useState("14:00");
  const [blockEnd, setBlockEnd]     = useState("18:00");
  const [isFullDay, setIsFullDay]   = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [submittingBlock, setSubmittingBlock] = useState(false);

  /* Toast */
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Carga de citas ── */
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

  /* ── Carga de disponibilidad freelance del equipo ── */
  const loadTeamMatrix = async (dateParam?: string) => {
    const target = dateParam || opDate || todayStr;
    setLoadingTeam(true);
    try {
      const [matrixRes, myRes] = await Promise.all([
        operativeAvailabilityApi.team(target),
        operativeAvailabilityApi.my(target)
      ]);
      setTeamMatrix(matrixRes.data);
      setMyBusyBlocks(myRes.data);
    } catch (err) {
      console.error("Error cargando disponibilidad del equipo:", err);
    } finally {
      setLoadingTeam(false);
    }
  };

  useEffect(() => {
    loadData();
    loadTeamMatrix(todayStr);
  }, []);

  useEffect(() => {
    if (opDate) {
      loadTeamMatrix(opDate);
    }
  }, [opDate]);

  useEffect(() => {
    const unsubscribe = subscribe("appointments", () => {
      loadData();
      loadTeamMatrix();
    });
    return () => unsubscribe();
  }, [subscribe]);

  /* ── Acciones Citas ── */
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
    if (bookStartTime >= bookEndTime) {
      showToast("La hora de inicio debe ser anterior a la hora de fin", "error");
      return;
    }
    setSubmitting(true);
    try {
      await appointmentsApi.book(selectedSlot.id, {
        title: bookTitle,
        notes: bookNotes,
        start_time: bookStartTime,
        end_time: bookEndTime,
      });
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

  /* ── Acciones Bloqueo Freelance ── */
  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opDate) { showToast("Selecciona una fecha", "error"); return; }
    if (!isFullDay && blockStart >= blockEnd) {
      showToast("La hora de inicio debe ser anterior a la hora de fin", "error");
      return;
    }
    setSubmittingBlock(true);
    try {
      await operativeAvailabilityApi.create({
        date: opDate,
        start_time: isFullDay ? "00:00" : blockStart,
        end_time: isFullDay ? "23:59" : blockEnd,
        is_full_day: isFullDay,
        status: "busy",
        reason: blockReason || "Trabajo externo / Personal"
      });
      showToast("✅ Horario ocupado registrado correctamente");
      setBlockReason("");
      loadTeamMatrix(opDate);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Error al guardar el bloqueo", "error");
    } finally {
      setSubmittingBlock(false);
    }
  };

  const handleDeleteBlock = async (id: number) => {
    if (!confirm("¿Eliminar este bloqueo de horario?")) return;
    try {
      await operativeAvailabilityApi.delete(id);
      showToast("Bloqueo eliminado");
      loadTeamMatrix(opDate);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Error al eliminar", "error");
    }
  };

  /* ── Helpers Citas ── */
  const daysInMonth  = getDaysInMonth(calYear, calMonth);
  const firstDayOfMonth = getFirstDayOfMonth(calYear, calMonth);

  const slotsForDay = (dateStr: string) =>
    appointments.filter(a => a.date === dateStr);

  const availForDay = (dateStr: string) =>
    availableSlots.filter(a => a.date === dateStr && a.date >= todayStr);

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

  const daySlots = selectedDay
    ? (isAdmin ? slotsForDay(selectedDay) : availForDay(selectedDay))
    : [];

  const slotsByDate = availableSlots
    .filter(slot => slot.date >= todayStr)
    .reduce((acc, slot) => {
      if (!acc[slot.date]) acc[slot.date] = [];
      acc[slot.date].push(slot);
      return acc;
    }, {} as Record<string, Appointment[]>);

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

      {/* ─ Header Principal con Pestañas ─ */}
      <div className="bg-[#0A101D]/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-[0_10px_40px_rgba(32,205,254,0.1)] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#20CDFE]/10 rounded-full blur-3xl -translate-y-8 translate-x-8 pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CalendarCheck size={24} className="text-[#20CDFE]" />
                <span className="font-black text-2xl tracking-tight">
                  Módulo de Calendario y Disponibilidad del Equipo
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                Agenda integrada de reuniones con clientes y matriz de disponibilidad en tiempo real para trabajadores freelancers e híbridos.
              </p>
            </div>

              {/* Alternador de Pestañas Principales */}
              <button
                onClick={() => setMainTab("citas")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  mainTab === "citas"
                    ? "bg-gradient-to-r from-[#20CDFE]/20 to-[#1ED1B4]/10 text-[#20CDFE] border border-[#20CDFE]/30 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <CalendarIcon size={15} />
                Citas con Clientes
              </button>

              {/* Solo Admin y Operativo ven la disponibilidad del equipo */}
              {user?.role !== "cliente" && (
                <button
                  onClick={() => setMainTab("disponibilidad")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                    mainTab === "disponibilidad"
                      ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 border border-emerald-500/30 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Users size={15} />
                  Disponibilidad del Equipo Freelance
                </button>
              )}
          </div>

          {isAdmin && mainTab === "citas" && (
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="bg-[#07060B]/50 backdrop-blur-md border border-slate-800/50 rounded-2xl px-4 py-2.5 text-center">
                <p className="text-xl font-black">{totalSlots}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Slots</p>
              </div>
              <div className="bg-[#07060B]/50 backdrop-blur-md border border-slate-800/50 rounded-2xl px-4 py-2.5 text-center">
                <p className="text-xl font-black text-[#1ED1B4]">{bookedSlots}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reservadas</p>
              </div>
              <div className="bg-[#07060B]/50 backdrop-blur-md border border-slate-800/50 rounded-2xl px-4 py-2.5 text-center">
                <p className="text-xl font-black text-[#20CDFE]">{availableCount}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Disponibles</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* ════════════ PESTAÑA 1: CITAS ADMIN / CLIENTE ════════════ */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {mainTab === "citas" && (
        loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
          </div>
        ) : isAdmin ? (

          /* ── VISTA ADMIN CITAS ── */
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1 space-y-4">
              {/* Calendario Citas */}
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
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const d   = i + 1;
                    const ds  = toDateStr(calYear, calMonth, d);
                    const hasSlots   = slotsForDay(ds).length > 0;
                    const hasBooked  = slotsForDay(ds).some(a => a.status === "booked");
                    const isToday    = ds === todayStr;
                    const isSelected = ds === selectedDay;
                    const isPast     = ds < todayStr;
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
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800/50 text-[10px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#20CDFE] inline-block" />Disponible</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1ED1B4] inline-block" />Reservada</span>
                </div>
              </div>

              {/* Formulario: Publicar Cita */}
              <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm p-5">
                <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                  <Plus size={16} className="text-[#20CDFE]" />
                  Publicar Disponibilidad de Cita
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

            <div className="xl:col-span-2 space-y-4">
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
                              <button onClick={() => handleDeleteSlot(apt.id)} className="text-[11px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-1">
                                <Trash2 size={12} /> Eliminar
                              </button>
                            )}
                            {apt.status === "booked" && (
                              <button onClick={() => handleCancel(apt.id)} className="text-[11px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-1">
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

              {/* Listado Citas */}
              <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm p-5">
                <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                  <CalendarCheck size={16} className="text-[#20CDFE]" />
                  Mi Agenda Completa de Citas
                </h3>
                {appointments.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <CalendarIcon size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="font-semibold text-sm">No hay slots publicados todavía.</p>
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
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {apt.status === "booked" ? (
                              <button onClick={() => handleCancel(apt.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancelar"><XCircle size={15} /></button>
                            ) : apt.status === "available" ? (
                              <button onClick={() => handleDeleteSlot(apt.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><Trash2 size={15} /></button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        ) : (

          /* ── VISTA CLIENTE CITAS ── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
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
                    const isToday    = ds === todayStr;
                    const isSelected = ds === selectedDay;
                    const isPast     = ds < todayStr;
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
                        {hasAvail && !isSelected && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#20CDFE]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

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
                          onClick={() => {
                            setSelectedSlot(slot);
                            setBookStartTime(slot.start_time);
                            setBookEndTime(slot.end_time);
                            setBookTitle("");
                            setBookNotes("");
                          }}
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
            </div>

            <div className="lg:col-span-1 space-y-4">
              <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm p-5">
                <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                  <CalendarCheck size={15} className="text-[#20CDFE]" />
                  Mis Citas Programadas
                </h3>
                {appointments.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <CalendarIcon size={32} className="mx-auto mb-2 opacity-20" />
                    <p>Aún no tienes citas agendadas.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {appointments.map(apt => (
                      <div key={apt.id} className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/20 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs text-[#20CDFE] font-bold">
                          <span>{formatDate(apt.date)}</span>
                          <span>{apt.start_time} – {apt.end_time}</span>
                        </div>
                        <h4 className="font-bold text-white text-sm">{apt.title || "Reunión"}</h4>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* ════════ PESTAÑA 2: DISPONIBILIDAD FREELANCE DEL EQUIPO ════════ */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {mainTab === "disponibilidad" && (
        <div className="space-y-6">

          {/* Selector de Fecha de la Matriz */}
          <div className="bg-[#0A101D]/60 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Matriz de Disponibilidad del Equipo</h3>
                <p className="text-xs text-slate-400">Identifica trabajadores libres u ocupados para la asignación eficiente de trabajo.</p>
              </div>
            </div>

            {/* Fecha Selector */}
            <div className="flex items-center gap-2 bg-[#15233D]/60 border border-slate-800 rounded-xl p-1.5">
              <span className="text-xs font-bold text-slate-400 pl-2">Fecha:</span>
              <input
                type="date"
                value={opDate}
                onChange={e => setOpDate(e.target.value)}
                className="bg-[#0A101D] border border-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-[#20CDFE] outline-none"
              />
              <button
                onClick={() => loadTeamMatrix(opDate)}
                className="p-1.5 bg-[#20CDFE]/10 hover:bg-[#20CDFE]/20 text-[#20CDFE] rounded-lg transition-colors"
                title="Actualizar"
              >
                <RefreshCw size={14} className={loadingTeam ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Columna Izquierda: Formulario Marcar Ocupado (Para Operativos / Freelancers) */}
            <div className="xl:col-span-1 space-y-4">
              <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Lock size={16} className="text-amber-400" />
                    Registrar Mi Horario Ocupado
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Freelance / Híbrido
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  ¿Tienes otro rodaje, evento o compromiso externo? Registra tus horas ocupadas para que el administrador pueda coordinar la asignación.
                </p>

                <form onSubmit={handleCreateBlock} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Fecha a bloquear</label>
                    <div className="px-3.5 py-2 rounded-xl border border-slate-800 bg-[#15233D]/60 text-white text-xs font-bold flex items-center gap-2">
                      <CalendarIcon size={14} className="text-[#20CDFE]" />
                      {formatDate(opDate)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="fullDay"
                      checked={isFullDay}
                      onChange={e => setIsFullDay(e.target.checked)}
                      className="rounded bg-[#15233D] border-slate-800 text-[#20CDFE] focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="fullDay" className="text-xs font-bold text-slate-200 cursor-pointer">
                      Ocupado todo el día
                    </label>
                  </div>

                  {!isFullDay && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Hora Inicio</label>
                        <select
                          value={blockStart}
                          onChange={e => setBlockStart(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-800/80 rounded-xl text-xs font-bold bg-[#15233D]/60 text-white focus:outline-none focus:ring-2 focus:ring-[#20CDFE]"
                        >
                          {HOURS.map(h => <option key={`bs-${h}`} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Hora Fin</label>
                        <select
                          value={blockEnd}
                          onChange={e => setBlockEnd(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-800/80 rounded-xl text-xs font-bold bg-[#15233D]/60 text-white focus:outline-none focus:ring-2 focus:ring-[#20CDFE]"
                        >
                          {HOURS.map(h => <option key={`be-${h}`} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Motivo (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. Rodaje externo / Evento freelance"
                      value={blockReason}
                      onChange={e => setBlockReason(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-800/80 rounded-xl text-xs bg-[#15233D]/60 text-white focus:outline-none focus:ring-2 focus:ring-[#20CDFE]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingBlock}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black py-2.5 rounded-xl text-xs font-extrabold hover:opacity-90 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <Lock size={14} />
                    {submittingBlock ? "Guardando..." : "Marcar como Ocupado"}
                  </button>
                </form>

                {/* Mis Bloqueos en esta fecha */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock size={13} className="text-amber-400" /> Mis Bloqueos Registrados ({formatDate(opDate)})
                  </h4>

                  {myBusyBlocks.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No tienes bloqueos registrados para este día (Estás marcado disponible por defecto).</p>
                  ) : (
                    <div className="space-y-2">
                      {myBusyBlocks.map(block => (
                        <div key={block.id} className="bg-[#15233D]/50 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-extrabold text-amber-300 block">
                              {block.is_full_day ? "Día completo ocupado" : `${block.start_time} - ${block.end_time}`}
                            </span>
                            {block.reason && <span className="text-[11px] text-slate-400">{block.reason}</span>}
                          </div>
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            className="p-1 text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Eliminar bloqueo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Columna Derecha: Matriz del Equipo (Visualizador para Admins y Coordinadores) */}
            <div className="xl:col-span-2 space-y-4">
              <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Users size={16} className="text-[#20CDFE]" />
                    Disponibilidad del Personal para {formatDate(opDate)}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    Total: {teamMatrix.length} trabajadores
                  </span>
                </div>

                {/* Leyenda de Estados */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold bg-[#15233D]/30 border border-slate-800/60 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> 🟢 LIBRE (Disponible)
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 🔴 OCUPADO (Bloqueo Freelance)
                  </div>
                  <div className="flex items-center gap-1.5 text-[#20CDFE]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#20CDFE]" /> 🟡 EN TRABAJO (Con Actividades)
                  </div>
                </div>

                {loadingTeam ? (
                  <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
                  </div>
                ) : teamMatrix.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <Users size={36} className="mx-auto mb-2 opacity-20" />
                    <p>No se encontraron trabajadores en el equipo.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamMatrix.map((worker) => {
                      const isLibre = worker.overall_status === "libre";
                      const isOcupado = worker.overall_status === "ocupado";
                      const isEnTrabajo = worker.overall_status === "en_trabajo";

                      return (
                        <div
                          key={worker.user_id}
                          className={`bg-[#15233D]/50 border rounded-2xl p-4 transition-all flex flex-col justify-between ${
                            isLibre
                              ? "border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-950/10"
                              : isOcupado
                              ? "border-amber-500/30 hover:border-amber-500/60 bg-amber-950/10"
                              : "border-[#20CDFE]/30 hover:border-[#20CDFE]/60 bg-[#20CDFE]/5"
                          }`}
                        >
                          <div>
                            {/* Header Tarjeta Trabajador */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#20CDFE] to-[#1ED1B4] text-[#07060B] font-black text-sm flex items-center justify-center shadow-md">
                                  {worker.user_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-white text-sm leading-snug">{worker.user_name}</h4>
                                  <p className="text-[11px] text-slate-400 font-medium">
                                    {worker.user_position || (worker.user_role === "administrador" ? "Administrador" : "Operativo")}
                                  </p>
                                </div>
                              </div>

                              {/* Badge Estado */}
                              {isLibre && (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase flex items-center gap-1">
                                  <ShieldCheck size={12} /> LIBRE
                                </span>
                              )}
                              {isOcupado && (
                                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase flex items-center gap-1">
                                  <Lock size={12} /> OCUPADO
                                </span>
                              )}
                              {isEnTrabajo && (
                                <span className="px-2.5 py-1 rounded-full bg-[#20CDFE]/20 text-[#20CDFE] border border-[#20CDFE]/30 text-[10px] font-black uppercase flex items-center gap-1">
                                  <Briefcase size={12} /> EN TRABAJO ({worker.assigned_activities_count})
                                </span>
                              )}
                            </div>

                            {/* Detalle de Bloqueos Ocupados */}
                            {isOcupado && worker.busy_blocks.length > 0 && (
                              <div className="space-y-1.5 border-t border-slate-800/80 pt-2.5 mt-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Horarios Ocupados:</span>
                                {worker.busy_blocks.map(b => (
                                  <div key={b.id} className="text-xs text-slate-300 bg-[#0A101D]/70 px-2.5 py-1.5 rounded-lg border border-slate-800/60 flex items-center justify-between">
                                    <span className="font-bold text-amber-300">
                                      {b.is_full_day ? "Día Completo" : `${b.start_time} - ${b.end_time}`}
                                    </span>
                                    {b.reason && <span className="text-[11px] text-slate-400 italic truncate max-w-[140px]">{b.reason}</span>}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Detalle de Actividades Asignadas */}
                            {isEnTrabajo && worker.assigned_activities_titles.length > 0 && (
                              <div className="space-y-1.5 border-t border-slate-800/80 pt-2.5 mt-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#20CDFE]">Actividades Asignadas hoy:</span>
                                <ul className="space-y-1">
                                  {worker.assigned_activities_titles.map((title, idx) => (
                                    <li key={idx} className="text-xs text-slate-300 bg-[#0A101D]/70 px-2.5 py-1.5 rounded-lg border border-slate-800/60 truncate flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#20CDFE]" />
                                      {title}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {isLibre && (
                              <div className="border-t border-slate-800/80 pt-2.5 mt-2 text-xs text-emerald-400/80 italic font-medium">
                                Sin bloqueos freelance ni actividades asignadas en esta fecha.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
                <p className="font-bold text-[#20CDFE] flex items-center gap-1.5"><HelpCircle size={14} /> Horario Disponible</p>
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <CalendarIcon size={13} className="shrink-0" />
                  {formatDate(selectedSlot.date)}
                </div>
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <Clock size={13} className="shrink-0" />
                  Rango publicado: {selectedSlot.start_time} – {selectedSlot.end_time}
                </div>
              </div>

              {/* Selección del Horario Específico de la Cita */}
              <div className="bg-[#15233D]/60 border border-slate-800/80 p-3.5 rounded-xl space-y-2">
                <label className="block text-[11px] font-black text-[#20CDFE] uppercase tracking-wider">
                  ELIGE EL HORARIO DE TU REUNIÓN
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">Hora Inicio</label>
                    <input
                      type="time"
                      required
                      value={bookStartTime}
                      min={selectedSlot.start_time}
                      max={selectedSlot.end_time}
                      onChange={e => setBookStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-800 rounded-xl bg-[#0A101D] text-white text-xs font-bold focus:ring-2 focus:ring-[#20CDFE] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">Hora Fin</label>
                    <input
                      type="time"
                      required
                      value={bookEndTime}
                      min={bookStartTime || selectedSlot.start_time}
                      max={selectedSlot.end_time}
                      onChange={e => setBookEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-800 rounded-xl bg-[#0A101D] text-white text-xs font-bold focus:ring-2 focus:ring-[#20CDFE] outline-none"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Puedes agendar la duración que necesites dentro de las {selectedSlot.start_time} y las {selectedSlot.end_time}. El tiempo restante seguirá disponible para otros clientes.
                </p>
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
