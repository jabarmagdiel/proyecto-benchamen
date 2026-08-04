"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usersApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, Mail, Lock, Shield, Calendar, Briefcase, 
  KeyRound, CheckCircle, AlertCircle, Eye, EyeOff 
} from "lucide-react";

// Schemas de validación
const profileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("El correo electrónico no es válido"),
  position: z.string().optional().default(""),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, "La contraseña actual es requerida"),
  new_password: z.string().min(6, "La contraseña nueva debe tener al menos 6 caracteres"),
  confirm_password: z.string().min(1, "Debe confirmar su contraseña nueva"),
}).refine(data => data.new_password === data.confirm_password, {
  message: "Las contraseñas nuevas no coinciden",
  path: ["confirm_password"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function PerfilPage() {
  const { profile, reloadProfile } = useAuth();
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Formularios
  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfileForm,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      name: profile?.name || "",
      email: profile?.email || "",
      position: profile?.position || "",
    },
  });

  // Sincronizar el formulario si el perfil carga después del montaje
  useEffect(() => {
    if (profile) {
      resetProfileForm({
        name: profile.name || "",
        email: profile.email || "",
        position: profile.position || "",
      });
    }
  }, [profile?.id]);

  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema) as any,
  });

  const onUpdateProfile = async (data: ProfileFormData) => {
    setUpdatingProfile(true);
    try {
      await usersApi.updateProfile(data);
      await reloadProfile();
      showToast("Perfil actualizado correctamente");
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Error al actualizar el perfil", "error");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const onUpdatePassword = async (data: PasswordFormData) => {
    setUpdatingPassword(true);
    try {
      await usersApi.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      showToast("Contraseña cambiada correctamente");
      resetPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Error al cambiar la contraseña. Verifique la contraseña actual.", "error");
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium flex items-center gap-2 transition-all duration-300 ${toast.type === "success" ? "bg-green-500 shadow-green-500/25" : "bg-red-500 shadow-red-500/25"}`}>
          {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Mi Perfil</h2>
        <p className="text-slate-400 text-sm mt-0.5">Gestiona tu información personal y la seguridad de tu cuenta.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Tarjeta de Presentación */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm overflow-hidden">
            {/* Header decorativo */}
            <div className="h-28 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] relative"></div>
            {/* Avatar & Info Básica */}
            <div className="px-6 pb-6 text-center relative -mt-10">
              <div className="inline-flex w-20 h-20 rounded-2xl bg-[#0A101D]/80 p-1 shadow-md mb-3">
                <div className="w-full h-full bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] rounded-xl flex items-center justify-center text-white text-3xl font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <h3 className="font-bold text-white text-lg leading-tight">{profile.name}</h3>
              {profile.role !== "cliente" && (
                <p className="text-slate-400 text-xs mt-1 capitalize">{profile.position || "Miembro del equipo"}</p>
              )}
              
              <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                profile.role === "administrador" ? "bg-[#20CDFE]/20 text-[#20CDFE]" : 
                profile.role === "cliente" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
              }`}>
                {profile.role === "administrador" ? "Administrador" : 
                 profile.role === "cliente" ? "Cliente" : "Operativo"}
              </span>
            </div>

            {/* Detalles de la cuenta */}
            <div className="border-t border-[#2E455C]/20 px-6 py-4 space-y-3.5 text-sm">
              <div className="flex items-center gap-3 text-slate-300">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-400">Correo Electrónico</p>
                  <p className="truncate font-medium text-white">{profile.email}</p>
                </div>
              </div>

              {profile.role !== "cliente" && (
                <div className="flex items-center gap-3 text-slate-300">
                  <Briefcase size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Cargo</p>
                    <p className="font-medium text-white capitalize">{profile.position || "-"}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-slate-300">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Miembro desde</p>
                  <p className="font-medium text-white">{formatDate(profile.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <Shield size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Estado de cuenta</p>
                  <span className="inline-flex items-center gap-1.5 text-green-700 font-semibold text-xs mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Activa
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta de Privilegios/Permisos */}
          <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm p-6 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield size={16} className="text-[#20CDFE]" />
              Tus Privilegios
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              {profile.role === "administrador" ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Control y configuración total del sistema</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Crear y gestionar empresas, proyectos y actividades</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Aprobar, observar o rechazar evidencias entregadas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Gestión de usuarios y asignación de roles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Exportar reportes de productividad en PDF/Excel</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Ver panel personal con actividades asignadas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Iniciar, pausar o enviar actividades para revisión</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Subir archivos y adjuntar enlaces de Google Drive como evidencia</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Interactuar con comentarios y ver el historial de actividades</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Columna Derecha: Formularios de Edición y Cambio de Contraseña */}
        <div className="lg:col-span-2 space-y-6">
          {/* Formulario 1: Datos Personales */}
          <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#2E455C]/20">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <User size={16} className="text-[#20CDFE]" />
                Información Personal
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Actualiza tu información de perfil visible para el equipo.</p>
            </div>
            
            <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                  <input 
                    {...regProfile("name")} 
                    type="text"
                    className="w-full px-3.5 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE] transition-all"
                  />
                  {profileErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{profileErrors.name.message as string}</p>
                  )}
                </div>

                {profile.role !== "cliente" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Cargo o Puesto</label>
                    <input 
                      {...regProfile("position")} 
                      placeholder="Ej. Filmmaker, Editora, Diseñador..."
                      type="text"
                      className="w-full px-3.5 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE] transition-all"
                    />
                    {profileErrors.position && (
                      <p className="text-red-500 text-xs mt-1">{profileErrors.position.message as string}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico *</label>
                <input 
                  {...regProfile("email")} 
                  type="email"
                  className="w-full px-3.5 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE] transition-all"
                />
                {profileErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{profileErrors.email.message as string}</p>
                )}
                <p className="text-slate-400 text-[10px] mt-1">Este correo se utiliza para iniciar sesión y para notificaciones del sistema.</p>
              </div>

              <div className="flex justify-end pt-2 border-t border-[#2E455C]/20">
                <button 
                  type="submit" 
                  disabled={updatingProfile}
                  className="bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60 shadow-lg shadow-[#20CDFE]/20 transition-all"
                >
                  {updatingProfile ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>

          {/* Formulario 2: Cambio de Contraseña */}
          <div className="bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#2E455C]/20">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <KeyRound size={16} className="text-[#20CDFE]" />
                Seguridad de la Cuenta
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Modifica tu contraseña periódicamente para mantener tu cuenta segura.</p>
            </div>

            <form onSubmit={handlePasswordSubmit(onUpdatePassword)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña Actual *</label>
                <div className="relative">
                  <input 
                    {...regPassword("current_password")} 
                    type={showCurrentPass ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE] transition-all"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordErrors.current_password && (
                  <p className="text-red-500 text-xs mt-1">{passwordErrors.current_password.message as string}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nueva Contraseña *</label>
                  <div className="relative">
                    <input 
                      {...regPassword("new_password")} 
                      type={showNewPass ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE] transition-all"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.new_password && (
                    <p className="text-red-500 text-xs mt-1">{passwordErrors.new_password.message as string}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Confirmar Nueva Contraseña *</label>
                  <div className="relative">
                    <input 
                      {...regPassword("confirm_password")} 
                      type={showConfirmPass ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 border border-slate-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#20CDFE]/30 focus:border-[#20CDFE] transition-all"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.confirm_password && (
                    <p className="text-red-500 text-xs mt-1">{passwordErrors.confirm_password.message as string}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-[#2E455C]/20">
                <button 
                  type="submit" 
                  disabled={updatingPassword}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 shadow-lg transition-all"
                >
                  {updatingPassword ? "Actualizando..." : "Actualizar Contraseña"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
