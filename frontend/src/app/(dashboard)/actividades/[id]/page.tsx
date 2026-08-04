"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Upload, Link as LinkIcon, MessageSquare, History, CheckCircle, AlertCircle, Play, Square, Timer } from "lucide-react";
import { activitiesApi, evidencesApi, commentsApi, projectsApi } from "@/lib/api";
import type { Activity, Evidence, Comment, ActivityHistory as HistEntry } from "@/types";
import { ACTIVITY_TYPE_LABELS, ACTIVITY_STATUS_LABELS } from "@/types";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatDateTime, formatFileSize } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const actId = Number(id);

  const [activity, setActivity] = useState<Activity | null>(null);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<HistEntry[]>([]);
  const [tab, setTab] = useState<"info" | "evidencias" | "comentarios" | "historial">("info");
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [driveNote, setDriveNote] = useState("");
  const [fileNote, setFileNote] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [currentTimerSeconds, setCurrentTimerSeconds] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const aRes = await activitiesApi.get(actId);
      const act = aRes.data;
      
      const [eRes, cRes, hRes] = await Promise.all([
        projectsApi.getEvidences(act.project_id),
        commentsApi.list(actId),
        activitiesApi.getHistory(actId),
      ]);
      setActivity(act);
      setEvidences(eRes.data);
      setComments(cRes.data);
      setHistory(hRes.data);
      
      // Auto-iniciar cronómetro si es el responsable, está en_proceso y no está corriendo
      if (act && act.assigned_user_id === user?.user_id && act.status === "en_proceso" && !act.timer_started_at) {
        activitiesApi.startTimer(actId).then(() => {
          activitiesApi.get(actId).then(r => setActivity(r.data));
        }).catch(() => {});
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { if (actId && user) load(); }, [actId, user]);

  const showToast = (msg: any, type: "success" | "error" = "success") => {
    let errorMsg = msg;
    if (Array.isArray(msg)) {
      errorMsg = msg[0]?.msg || "Error de validación";
    } else if (typeof msg === "object" && msg !== null) {
      errorMsg = JSON.stringify(msg);
    }
    setToast({ msg: String(errorMsg), type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activity?.timer_started_at) {
      const updateTimer = () => {
        const start = new Date(activity.timer_started_at!).getTime();
        const now = new Date().getTime();
        const elapsed = Math.floor((now - start) / 1000);
        setCurrentTimerSeconds((activity.time_spent_seconds || 0) + elapsed);
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setCurrentTimerSeconds(activity?.time_spent_seconds || 0);
    }
    return () => clearInterval(interval);
  }, [activity]);

  const handleStart = async () => {
    try {
      await activitiesApi.start(actId);
      // Also start the timer automatically when starting the activity
      await activitiesApi.startTimer(actId).catch(() => {});
      showToast("Actividad iniciada ▶️");
      load();
    }
    catch (e: any) { showToast(e?.response?.data?.detail || "Error", "error"); }
  };

  const handleSendReview = async () => {
    try {
      // Stop the timer automatically when sending to review
      if (activity?.timer_started_at) {
        await activitiesApi.stopTimer(actId).catch(() => {});
      }
      await activitiesApi.sendReview(actId);
      showToast("Enviado a revisión");
      load();
    }
    catch (e: any) { showToast(e?.response?.data?.detail || "Error", "error"); }
  };

  const handleApprove = async () => {
    try { await activitiesApi.approve(actId); showToast("✅ Aprobada"); load(); }
    catch (e: any) { showToast(e?.response?.data?.detail || "Error", "error"); }
  };

  const handleStartTimer = async () => {
    try { await activitiesApi.startTimer(actId); showToast("Cronómetro iniciado ▶️"); load(); }
    catch (e: any) { showToast(e?.response?.data?.detail || "Error", "error"); }
  };

  const handleStopTimer = async () => {
    try { await activitiesApi.stopTimer(actId); showToast("Cronómetro detenido ⏹️"); load(); }
    catch (e: any) { showToast(e?.response?.data?.detail || "Error", "error"); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    if (fileNote) fd.append("note", fileNote);
    try { await evidencesApi.uploadFile(actId, fd); showToast("Archivo subido"); load(); setTab("evidencias"); }
    catch (err: any) { showToast(err?.response?.data?.detail || "Error al subir", "error"); }
  };

  const handleAddLink = async () => {
    if (!driveUrl.trim()) return;
    try {
      await evidencesApi.addLink(actId, { evidence_type: "link_drive", drive_url: driveUrl, note: driveNote });
      showToast("Link registrado"); setDriveUrl(""); setDriveNote(""); load(); setTab("evidencias");
    } catch (e: any) { showToast(e?.response?.data?.detail || "Error", "error"); }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    try { await commentsApi.create(actId, comment); setComment(""); load(); }
    catch (e: any) { showToast(e?.response?.data?.detail || "Error", "error"); }
  };

  if (loading) return (
    <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" /></div>
  );
  if (!activity) return <div className="text-center py-20 text-slate-400">Actividad no encontrada</div>;

  const isOwner = activity.assigned_user_id === user?.user_id;
  const canStart = isOwner && activity.status === "asignada";
  const canSendReview = isOwner && activity.status === "en_proceso";
  const canApprove = (isAdmin || (user?.role === 'cliente' && (activity.node_type === 'end' || activity.current_stage?.node_type === 'end'))) && activity.status === "en_revision";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      {activity.status === "observada" && history.length > 0 && (() => {
        const obsHistory = [...history].reverse().find(h => h.action.toLowerCase() === "observada" || h.new_status === "observada");
        if (obsHistory && obsHistory.description) {
          return (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3 items-start animate-fade-in shadow-[0_4px_20px_rgba(245,158,11,0.1)]">
              <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-amber-500 font-bold text-sm">Actividad Observada por {obsHistory.user?.name || "Administrador"}</h4>
                <p className="text-amber-200/90 text-sm mt-1 whitespace-pre-wrap">{obsHistory.description}</p>
              </div>
            </div>
          );
        }
        return null;
      })()}

      <div className="flex items-start gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-[#1C2C4D] text-slate-400 hover:text-slate-300 transition-colors mt-1">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={activity.status} />
            <PriorityBadge priority={activity.priority} />
            <span className="text-xs text-slate-400 bg-[#1C2C4D] px-2 py-1 rounded-full">{ACTIVITY_TYPE_LABELS[activity.activity_type]}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{activity.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{activity.project_name} · {activity.company_name}</p>
        </div>
        
        {/* Botón Producto Final si aplica */}
        {(activity.node_type === 'end' || activity.current_stage?.node_type === 'end') && activity.latest_evidence_url && (
          <div className="flex-shrink-0 self-center">
            <a href={activity.latest_evidence_url.startsWith('http') ? activity.latest_evidence_url : `${process.env.NEXT_PUBLIC_API_URL}${activity.latest_evidence_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white hover:bg-violet-700 font-semibold text-sm rounded-xl transition-colors shadow-sm">
              <span className="text-lg">⭐</span> Ver Producto Final
            </a>
          </div>
        )}
        
        {/* Botones de acción directos */}
        <div className="flex flex-col gap-2 items-end">
          {canStart && (
            <button onClick={handleStart} className="flex items-center gap-2 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-5 py-2.5 rounded-xl text-sm font-extrabold hover:opacity-90 transition-all shadow-lg shadow-[#20CDFE]/20 w-full justify-center">
              <Play size={15} /> Iniciar Trabajo
            </button>
          )}
          {canSendReview && (
            <button onClick={handleSendReview} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-extrabold hover:bg-blue-700 transition-all w-full justify-center shadow-lg">
              <AlertCircle size={15} /> Enviar a Revisión
            </button>
          )}
          {canApprove && (
            <button onClick={handleApprove} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-extrabold hover:bg-emerald-700 transition-all w-full justify-center shadow-lg">
              <CheckCircle size={15} /> Aprobar Trabajo
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/50 gap-1">
        {(["info", "evidencias", "comentarios", "historial"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium capitalize rounded-t-lg transition-colors ${tab === t ? "text-[#20CDFE] border-b-2 border-[#20CDFE] bg-[#20CDFE]/10 font-bold" : "text-slate-400 hover:text-white"}`}>
            {t === "evidencias" ? `Evidencias (${evidences.length})` : t === "comentarios" ? `Comentarios (${comments.length})` : t}
          </button>
        ))}
      </div>

      {/* Tab Info */}
      {tab === "info" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-white text-base">Información del Trabajo</h3>
            
            {/* Concepto / Descripción Destacado */}
            {activity.description ? (
              <div className="bg-[#15233D]/80 border border-slate-800 p-4 rounded-xl space-y-1.5 shadow-md">
                <span className="text-[#20CDFE] text-xs font-black uppercase tracking-wider block flex items-center gap-1.5">
                  📝 Concepto / Descripción del Trabajo:
                </span>
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {activity.description}
                </p>
              </div>
            ) : (
              <div className="text-slate-500 text-xs italic bg-[#15233D]/30 p-3 rounded-xl border border-slate-800/50">
                Sin descripción adicional registrada para esta actividad.
              </div>
            )}

            <div className="space-y-3 text-sm pt-2">
              {[
                { label: "Responsable Asignado", value: activity.assigned_user?.name || "Sin asignar" },
                { label: "Creado por",  value: activity.created_by?.name },
                { label: "Fecha inicio", value: formatDate(activity.start_date) },
                { label: "Fecha límite", value: formatDate(activity.deadline) },
                { label: "Aprobado por", value: activity.approved_by?.name || "-" },
                { label: "Aprobado el", value: formatDateTime(activity.approved_at) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-4 border-b border-slate-800/40 pb-2 last:border-0">
                  <span className="text-slate-400 shrink-0 font-medium">{label}</span>
                  <span className="text-white font-bold text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Subir evidencia (operativo) */}
          {(isOwner || isAdmin) && !["aprobada", "cancelada"].includes(activity.status) && (
            <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm p-5 space-y-4">
              <h3 className="font-semibold text-white">Subir evidencia</h3>
              <div>
                <p className="text-xs text-slate-400 mb-2">Archivo (imagen, PDF, video, etc.)</p>
                <input type="text" value={fileNote} onChange={e => setFileNote(e.target.value)} placeholder="Nota opcional..." className="w-full px-3 py-2 border border-slate-800/50 rounded-xl text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-violet-200" />
                <label className="flex items-center gap-2 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 transition-all w-full justify-center">
                  <Upload size={14} /> Subir archivo
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              <div className="border-t border-slate-800/50 pt-4">
                <p className="text-xs text-slate-400 mb-2">Link de Google Drive</p>
                <input type="url" value={driveUrl} onChange={e => setDriveUrl(e.target.value)} placeholder="https://drive.google.com/..." className="w-full px-3 py-2 border border-slate-800/50 rounded-xl text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-violet-200" />
                <input type="text" value={driveNote} onChange={e => setDriveNote(e.target.value)} placeholder="Nota del link..." className="w-full px-3 py-2 border border-slate-800/50 rounded-xl text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-violet-200" />
                <button onClick={handleAddLink} disabled={!driveUrl.trim()} className="flex items-center gap-2 w-full justify-center bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                  <LinkIcon size={14} /> Registrar link
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Evidencias */}
      {tab === "evidencias" && (
        <div className="space-y-3">
          {evidences.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50">
              <Upload size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sin evidencias en el proyecto</p>
              <p className="text-sm mt-1">Aún no se han subido evidencias en ninguna tarea de este proyecto</p>
            </div>
          ) : evidences.map((ev) => (
            <div key={ev.id} className="bg-[#0A101D]/80 rounded-xl border border-slate-800/50 p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#20CDFE]/20 flex items-center justify-center shrink-0">
                {ev.evidence_type === "imagen" ? "🖼️" : ev.evidence_type === "link_drive" ? "📁" : ev.evidence_type === "archivo" ? "📄" : "🔗"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">{ev.file_name || ev.drive_url || "Evidencia"}</span>
                  {ev.file_size && <span className="text-xs text-slate-400">{formatFileSize(ev.file_size)}</span>}
                </div>
                {ev.note && <p className="text-slate-400 text-xs mt-0.5">{ev.note}</p>}
                <p className="text-slate-400 text-xs mt-1">Por {ev.user?.name} · {formatDateTime(ev.created_at)}</p>
                {ev.file_url && (
                  <a href={`${process.env.NEXT_PUBLIC_API_URL}${ev.file_url}`} target="_blank" rel="noopener noreferrer" className="text-[#20CDFE] text-xs hover:underline mt-1 inline-block">Ver archivo →</a>
                )}
                {ev.drive_url && (
                  <a href={ev.drive_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline mt-1 inline-block">Abrir en Drive →</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Comentarios */}
      {tab === "comentarios" && (
        <div className="space-y-4">
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="text-center py-10 text-slate-400 bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin comentarios aún</p>
              </div>
            ) : comments.map((c) => (
              <div key={c.id} className="bg-[#0A101D]/80 rounded-xl border border-slate-800/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] rounded-lg flex items-center justify-center text-white text-xs font-bold">
                    {c.user.name.charAt(0)}
                  </div>
                  <span className="font-medium text-white text-sm">{c.user.name}</span>
                  <span className="text-slate-400 text-xs ml-auto">{formatDateTime(c.created_at)}</span>
                </div>
                <p className="text-slate-300 text-sm">{c.content}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#0A101D]/80 rounded-xl border border-slate-800/50 p-4">
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Escribe un comentario..." className="w-full px-3 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none mb-3" />
            <button onClick={handleComment} disabled={!comment.trim()} className="bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50">
              Enviar comentario
            </button>
          </div>
        </div>
      )}

      {/* Tab Historial */}
      {tab === "historial" && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-10 text-slate-400 bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50">
              <History size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin historial</p>
            </div>
          ) : history.map((h) => (
            <div key={h.id} className="bg-[#0A101D]/80 rounded-xl border border-slate-800/50 p-4 flex items-start gap-3">
              <div className="w-2 h-2 bg-violet-400 rounded-full mt-2 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white text-sm">{h.user?.name}</span>
                  <span className="text-slate-400 text-xs">{h.action.replace(/_/g, " ")}</span>
                  {h.previous_status && h.new_status && (
                    <span className="text-xs text-slate-400">{h.previous_status} → {h.new_status}</span>
                  )}
                  <span className="text-slate-400 text-xs ml-auto">{formatDateTime(h.created_at)}</span>
                </div>
                {h.description && <p className="text-slate-400 text-xs mt-1">{h.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
