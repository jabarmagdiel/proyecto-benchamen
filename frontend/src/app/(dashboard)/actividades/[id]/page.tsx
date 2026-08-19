"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Upload, Link as LinkIcon, MessageSquare, History, CheckCircle, AlertCircle, Play, Square, Timer, Trash2, Pencil, XCircle, Eye, Image as ImageIcon, Download } from "lucide-react";
import { activitiesApi, evidencesApi, commentsApi, projectsApi, usersApi } from "@/lib/api";
import type { Activity, Evidence, Comment, ActivityHistory as HistEntry, User } from "@/types";
import { ACTIVITY_TYPE_LABELS, ACTIVITY_STATUS_LABELS, PRIORITY_LABELS } from "@/types";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatDateTime, formatFileSize, getFileUrl, downloadFileFromUrl } from "@/lib/utils";
import { getGoogleCalendarUrl, downloadIcsFile } from "@/lib/calendarUtils";
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
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState<"info" | "evidencias" | "comentarios" | "historial">("info");
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [driveNote, setDriveNote] = useState("");
  const [fileNote, setFileNote] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [currentTimerSeconds, setCurrentTimerSeconds] = useState(0);

  /* State de Modal de Edición (Admin) */
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editReferenceLink, setEditReferenceLink] = useState("");
  const [editPriority, setEditPriority] = useState("media");
  const [editAssignedUserId, setEditAssignedUserId] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const aRes = await activitiesApi.get(actId);
      const act = aRes.data;
      
      const [eRes, cRes, hRes, uRes] = await Promise.all([
        evidencesApi.list(actId),
        commentsApi.list(actId),
        activitiesApi.getHistory(actId),
        isAdmin ? usersApi.list().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);
      setActivity(act);
      setEvidences(eRes.data);
      setComments(cRes.data);
      setHistory(hRes.data);
      if (uRes?.data) setUsers(uRes.data);
      
      // Auto-iniciar cronómetro si es el responsable, está en_proceso y no está corriendo
      if (act && act.assigned_user_id === user?.user_id && act.status === "en_proceso" && !act.timer_started_at) {
        activitiesApi.startTimer(actId).then(() => {
          activitiesApi.get(actId).then(r => setActivity(r.data));
        }).catch(() => {});
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { if (actId && user) load(); }, [actId, user]);

  const openEditModal = () => {
    if (!activity) return;
    setEditTitle(activity.title || "");
    setEditDescription(activity.description || "");
    setEditReferenceLink(activity.reference_link || "");
    setEditPriority(activity.priority || "media");
    setEditAssignedUserId(activity.assigned_user_id ? String(activity.assigned_user_id) : "");
    setEditStartDate(activity.start_date || "");
    setEditDeadline(activity.deadline || "");
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      showToast("El título es obligatorio", "error");
      return;
    }
    setSubmittingEdit(true);
    try {
      await activitiesApi.update(actId, {
        title: editTitle,
        description: editDescription,
        reference_link: editReferenceLink || null,
        priority: editPriority as any,
        assigned_user_id: editAssignedUserId ? Number(editAssignedUserId) : null,
        start_date: editStartDate || null,
        deadline: editDeadline || null,
      });
      showToast("✅ Información del trabajo actualizada correctamente");
      setEditModalOpen(false);
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error al actualizar", "error");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const renderFormattedDescription = (text?: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#20CDFE] underline hover:text-[#1ED1B4] break-all inline-flex items-center gap-1 font-bold my-0.5"
          >
            {part} ↗
          </a>
        );
      }
      return part;
    });
  };

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

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de ELIMINAR DEFINITIVAMENTE esta actividad de la base de datos? Esta acción es irreversible.")) return;
    try {
      await activitiesApi.delete(actId);
      showToast("Actividad eliminada 🗑️");
      router.push("/actividades");
    } catch (e: any) { showToast(e?.response?.data?.detail || "Error al eliminar", "error"); }
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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    let successCount = 0;
    let lastError = "";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fd = new FormData();
      fd.append("file", file);
      if (fileNote) fd.append("note", fileNote);
      try {
        await evidencesApi.uploadFile(actId, fd);
        successCount++;
      } catch (err: any) {
        lastError = err?.response?.data?.detail || `Error al subir ${file.name}`;
      }
    }

    setUploadingFile(false);
    setFileNote("");
    if (e.target) e.target.value = "";

    if (successCount > 0) {
      showToast(`✨ ${successCount} ${successCount === 1 ? "evidencia subida" : "evidencias subidas"} correctamente`);
      load();
      setTab("evidencias");
    } else if (lastError) {
      showToast(lastError, "error");
    }
  };

  const handleDeleteEvidence = async (evidenceId: number) => {
    if (!confirm("¿Estás seguro de eliminar esta evidencia?")) return;
    try {
      await evidencesApi.delete(evidenceId);
      showToast("Evidencia eliminada 🗑️");
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Error al eliminar la evidencia", "error");
    }
  };

  const isImageEvidence = (ev: Evidence) => {
    if ((ev as any).evidence_type === "imagen" || (ev as any).evidence_type === "image") return true;
    if (ev.mime_type && ev.mime_type.startsWith("image/")) return true;
    const imgExts = ["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp", "heic", "avif", "ico"];
    if (ev.file_url) {
      const ext = ev.file_url.split("?")[0].split(".").pop()?.toLowerCase();
      if (imgExts.includes(ext || "")) return true;
    }
    if (ev.file_name) {
      const ext = ev.file_name.split("?")[0].split(".").pop()?.toLowerCase();
      if (imgExts.includes(ext || "")) return true;
    }
    return false;
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
  const canStart = (isOwner || isAdmin) && activity.status === "asignada";
  const canSendReview = (isOwner || isAdmin) && ["en_proceso", "observada"].includes(activity.status);
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
          {isAdmin && (
            <button onClick={openEditModal} className="flex items-center gap-2 bg-[#1C2C4D] hover:bg-[#2A3E66] text-[#20CDFE] border border-[#20CDFE]/30 px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all w-full justify-center shadow-lg">
              <Pencil size={15} /> Editar Información
            </button>
          )}
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
          {(activity.status === "cancelada" || isAdmin) && (
            <button onClick={handleDelete} className="flex items-center gap-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all w-full justify-center shadow-lg">
              <Trash2 size={15} /> Eliminar de la Base de Datos
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
          <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm p-5 space-y-4 max-w-full overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Información del Trabajo</h3>
              {isAdmin && (
                <button onClick={openEditModal} className="text-xs font-extrabold text-[#20CDFE] hover:underline flex items-center gap-1">
                  <Pencil size={13} /> Editar
                </button>
              )}
            </div>

            {/* Concepto / Descripción Destacado */}
            {activity.description ? (
              <div className="bg-[#15233D]/80 border border-slate-800 p-4.5 rounded-2xl space-y-2 shadow-md max-w-full overflow-hidden">
                <span className="text-[#20CDFE] text-xs font-black uppercase tracking-wider block flex items-center gap-1.5">
                  📝 Concepto / Descripción del Trabajo:
                </span>
                <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium break-words overflow-hidden max-w-full">
                  {renderFormattedDescription(activity.description)}
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs italic bg-[#15233D]/30 p-3 rounded-xl border border-slate-800/50">
                Sin descripción adicional registrada para esta actividad.
              </div>
            )}

            {/* Tarjeta Dedicada de Link Referencial / Materiales */}
            {activity.reference_link && (
              <div className="bg-gradient-to-r from-blue-950/60 to-indigo-950/40 border border-blue-500/30 p-4.5 rounded-2xl space-y-2.5 shadow-md max-w-full overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[#20CDFE] text-xs font-black uppercase tracking-wider block flex items-center gap-1.5">
                    🔗 Link Referencial / Materiales de Trabajo:
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A101D]/90 border border-blue-500/20 p-3 rounded-xl max-w-full overflow-hidden">
                  <span className="text-xs font-bold text-slate-200 break-all line-clamp-2 max-w-full">
                    {activity.reference_link}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(activity.reference_link || "");
                        showToast("Link copiado al portapapeles 📋");
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 flex items-center gap-1 transition-all"
                    >
                      📋 Copiar
                    </button>
                    <a
                      href={activity.reference_link.startsWith("http") ? activity.reference_link : `https://${activity.reference_link}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] hover:opacity-90 flex items-center gap-1.5 shadow-md shadow-[#20CDFE]/20 transition-all transform hover:scale-[1.02]"
                    >
                      <LinkIcon size={14} /> Abrir Link ↗
                    </a>
                  </div>
                </div>
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
                  <div className="text-right">
                    <span className="text-white font-bold block">{value}</span>
                    {label === "Fecha límite" && activity.deadline && (
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        <a
                          href={getGoogleCalendarUrl({
                            title: `[Benchamen] ${activity.title}`,
                            description: `${activity.description || ""}\nProyecto: ${activity.project_name || ""}\nEmpresa: ${activity.company_name || ""}`,
                            date: activity.deadline,
                            startTime: "09:00",
                            endTime: "18:00"
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#4285F4]/20 text-[#4285F4] hover:bg-[#4285F4]/30 border border-[#4285F4]/30 flex items-center gap-1 transition-colors"
                          title="Añadir fecha de entrega a Google Calendar"
                        >
                          📅 Google Calendar
                        </a>
                        <button
                          onClick={() => downloadIcsFile({
                            title: `[Benchamen] ${activity.title}`,
                            description: `${activity.description || ""}\nProyecto: ${activity.project_name || ""}\nEmpresa: ${activity.company_name || ""}`,
                            date: activity.deadline!,
                            startTime: "09:00",
                            endTime: "18:00"
                          })}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 flex items-center gap-1 transition-colors"
                          title="Descargar iCal (.ics)"
                        >
                          📥 iCal
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Subir evidencia (operativo) */}
          {(isOwner || isAdmin) && (
            <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm p-5 space-y-4">
              <h3 className="font-semibold text-white">Subir evidencia</h3>
              <div>
                <p className="text-xs text-slate-400 mb-2">Archivos / Imágenes PNG, JPG, PDF (Permite seleccionar varios)</p>
                <input type="text" value={fileNote} onChange={e => setFileNote(e.target.value)} placeholder="Nota opcional..." className="w-full px-3 py-2 border border-slate-800/50 rounded-xl text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-violet-200" />
                <label className={`flex items-center gap-2 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 transition-all w-full justify-center ${uploadingFile ? "opacity-50 pointer-events-none" : ""}`}>
                  {uploadingFile ? (
                    <span>Subiendo evidencias...</span>
                  ) : (
                    <>
                      <Upload size={14} /> Subir archivos (Seleccionar varios)
                      <input type="file" multiple accept="image/*,application/pdf,video/*,.doc,.docx,.xls,.xlsx,.zip,.rar" className="hidden" onChange={handleFileUpload} />
                    </>
                  )}
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
        <div className="space-y-6">
          {/* Formulario de carga directo en la pestaña de Evidencias */}
          {(isOwner || isAdmin) && (
            <div className="bg-[#0A101D]/70 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-md p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Upload size={16} className="text-[#20CDFE]" /> Subir Nuevas Evidencias (PNG, JPG, PDFs, Videos o Drive)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 bg-[#070C18]/60 p-3.5 rounded-xl border border-slate-800/60">
                  <p className="text-xs font-bold text-slate-300">📁 Archivos / Imágenes (Permite seleccionar varios a la vez)</p>
                  <input
                    type="text"
                    value={fileNote}
                    onChange={e => setFileNote(e.target.value)}
                    placeholder="Nota u observación del archivo (opcional)..."
                    className="w-full px-3 py-2 border border-slate-800/80 rounded-xl text-xs bg-[#0A101D] text-white focus:outline-none focus:ring-2 focus:ring-[#20CDFE]"
                  />
                  <label className={`flex items-center gap-2 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer hover:opacity-90 transition-all w-full justify-center shadow-md shadow-[#20CDFE]/20 ${uploadingFile ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploadingFile ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#07060B] border-t-transparent rounded-full animate-spin" />
                        <span>Subiendo archivos...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} /> Seleccionar y Subir Imágen(es) / Archivos
                        <input
                          type="file"
                          multiple
                          accept="image/*,application/pdf,video/*,.doc,.docx,.xls,.xlsx,.zip,.rar"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </>
                    )}
                  </label>
                </div>

                <div className="space-y-2 bg-[#070C18]/60 p-3.5 rounded-xl border border-slate-800/60">
                  <p className="text-xs font-bold text-slate-300">🔗 Link de Google Drive / Externo</p>
                  <input
                    type="url"
                    value={driveUrl}
                    onChange={e => setDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3 py-2 border border-slate-800/80 rounded-xl text-xs bg-[#0A101D] text-white focus:outline-none focus:ring-2 focus:ring-[#20CDFE]"
                  />
                  <input
                    type="text"
                    value={driveNote}
                    onChange={e => setDriveNote(e.target.value)}
                    placeholder="Nota del enlace (opcional)..."
                    className="w-full px-3 py-2 border border-slate-800/80 rounded-xl text-xs bg-[#0A101D] text-white focus:outline-none focus:ring-2 focus:ring-[#20CDFE]"
                  />
                  <button
                    onClick={handleAddLink}
                    disabled={!driveUrl.trim()}
                    className="flex items-center gap-2 w-full justify-center bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-40 transition-colors"
                  >
                    <LinkIcon size={14} /> Registrar Link de Drive
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-bold text-white text-base flex items-center justify-between">
              <span>Evidencias Entregadas ({evidences.length})</span>
            </h3>

            {evidences.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50">
                <Upload size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Sin evidencias en el proyecto</p>
                <p className="text-sm mt-1">Usa la caja de arriba para subir imágenes PNG/JPG, PDFs o links de Google Drive.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evidences.map((ev) => {
                  const isImg = isImageEvidence(ev);
                  const fullFileUrl = ev.file_url ? getFileUrl(ev.file_url) : null;

                  return (
                    <div key={ev.id} className="bg-[#0A101D]/80 rounded-2xl border border-slate-800/80 p-4 flex flex-col justify-between gap-3 shadow-md hover:border-slate-700 transition-all">
                      <div>
                        {isImg && fullFileUrl ? (
                          <div className="relative group mb-3 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 h-48 flex items-center justify-center">
                            <img
                              src={fullFileUrl}
                              alt={ev.file_name || "Evidencia"}
                              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                            <div
                              onClick={() => setPreviewImage({ url: fullFileUrl, name: ev.file_name || "Evidencia" })}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer gap-2 text-white font-bold text-xs"
                            >
                              <Eye size={18} /> Ver / Ampliar imagen
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-12 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center gap-3 px-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-[#20CDFE]/20 flex items-center justify-center shrink-0 text-lg">
                              {ev.evidence_type === "link_drive" || ev.drive_url ? "📁" : "📄"}
                            </div>
                            <span className="text-xs font-bold text-slate-300 truncate flex-1">
                              {ev.file_name || ev.drive_url || "Archivo adjunto"}
                            </span>
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-white text-sm break-all line-clamp-1">
                              {ev.file_name || ev.drive_url || "Evidencia"}
                            </span>
                            {ev.file_size && (
                              <span className="text-[11px] font-bold text-slate-400 shrink-0 bg-slate-800/60 px-2 py-0.5 rounded-md">
                                {formatFileSize(ev.file_size)}
                              </span>
                            )}
                          </div>
                          {ev.note && <p className="text-slate-300 text-xs font-medium bg-[#15233D]/50 p-2 rounded-lg border border-slate-800/60">{ev.note}</p>}
                          <p className="text-slate-400 text-[11px]">Por <strong className="text-slate-300">{ev.user?.name}</strong> · {formatDateTime(ev.created_at)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 mt-2">
                        <div className="flex items-center gap-2">
                          {fullFileUrl && (
                            <button
                              type="button"
                              onClick={() => downloadFileFromUrl(fullFileUrl, ev.file_name || "evidencia")}
                              className="text-[#20CDFE] text-xs font-bold hover:underline flex items-center gap-1.5 bg-[#20CDFE]/10 border border-[#20CDFE]/20 px-3 py-1.5 rounded-xl transition-all hover:bg-[#20CDFE]/20"
                            >
                              <Download size={13} /> Descargar
                            </button>
                          )}
                          {ev.drive_url && (
                            <a
                              href={ev.drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 text-xs font-bold hover:underline flex items-center gap-1 bg-blue-900/30 border border-blue-500/30 px-3 py-1.5 rounded-xl"
                            >
                              Abrir en Drive ↗
                            </a>
                          )}
                        </div>

                        {(isAdmin || ev.user_id === user?.user_id) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEvidence(ev.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Eliminar evidencia"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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

      {/* Modal de Edición de Información del Trabajo (Admin) */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D] border border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl animate-fade-in flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800/80 shrink-0">
              <div className="flex items-center gap-2">
                <Pencil size={20} className="text-[#20CDFE]" />
                <h3 className="text-lg font-black text-white">Editar Información del Trabajo</h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <XCircle size={22} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Título del Trabajo *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE] bg-[#070C18] text-white font-medium"
                  placeholder="Título de la actividad..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Concepto / Descripción del Trabajo</label>
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2.5 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE] bg-[#070C18] text-white resize-none font-medium"
                  placeholder="Instrucciones, concepto y especificaciones del trabajo..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  🔗 Link Referencial / Materiales (Drive, Figma, Canva, etc.)
                </label>
                <input
                  type="url"
                  value={editReferenceLink}
                  onChange={e => setEditReferenceLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE] bg-[#070C18] text-white font-medium"
                  placeholder="https://drive.google.com/drive/folders/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Prioridad</label>
                  <select
                    value={editPriority}
                    onChange={e => setEditPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE] bg-[#070C18] text-white font-medium cursor-pointer"
                  >
                    {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Responsable Asignado</label>
                  <select
                    value={editAssignedUserId}
                    onChange={e => setEditAssignedUserId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE] bg-[#070C18] text-white font-medium cursor-pointer"
                  >
                    <option value="">Sin asignar</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Fecha Inicio</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={e => setEditStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE] bg-[#070C18] text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Fecha Límite</label>
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={e => setEditDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE] bg-[#070C18] text-white font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800/80 shrink-0 bg-[#070C18]/60">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={submittingEdit}
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] hover:opacity-90 transition-all shadow-md shadow-[#20CDFE]/20 disabled:opacity-50"
              >
                {submittingEdit ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ampliador de Imagen Evidencia */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A101D] border border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <span className="text-sm font-bold text-white truncate max-w-md">{previewImage.name}</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <XCircle size={22} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/40">
              <img src={previewImage.url} alt={previewImage.name} className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-lg" />
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-[#070C18]">
              <button
                type="button"
                onClick={() => downloadFileFromUrl(previewImage.url, previewImage.name)}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] hover:opacity-90 flex items-center gap-2 shadow-md shadow-[#20CDFE]/20 cursor-pointer"
              >
                <Download size={15} /> Descargar Imagen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
