"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn, BarChart3 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setError("");
    setLoading(true);
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0A101D] text-white selection:bg-[#20CDFE]/30">
      {/* ─── Panel izquierdo decorativo ─── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden bg-gradient-to-br from-[#07060B] to-[#2E455C]/40 border-r border-slate-800/50">
        <div className="absolute inset-0 opacity-20">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-slate-800/50"
              style={{
                width: `${150 + i * 100}px`,
                height: `${150 + i * 100}px`,
                top: `${50 + Math.sin(i) * 20}%`,
                left: `${50 + Math.cos(i) * 20}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>
        
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#20CDFE]/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative text-center z-10 flex flex-col items-center">
          {/* Logo official ADDONS */}
          <div className="flex items-center justify-center mb-8 p-4 rounded-3xl backdrop-blur-md">
            <img src="/logo.png" alt="ADDONS" className="w-64 h-auto object-contain drop-shadow-[0_0_25px_rgba(32,205,254,0.2)]" />
          </div>

          <p className="text-slate-300 text-lg leading-relaxed max-w-md font-light">
            Centraliza la gestión de tus clientes, proyectos y actividades en una sola plataforma potente y fácil de usar.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center w-full max-w-md">
            {[
              { label: "Proyectos", value: "∞" },
              { label: "Actividades", value: "360°" },
              { label: "Equipos", value: "✓" },
            ].map((s) => (
              <div key={s.label} className="bg-[#1C2C4D] rounded-2xl p-5 backdrop-blur-md border border-slate-800/50 hover:bg-[#2E455C]/50 transition-colors">
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] mb-1">{s.value}</div>
                <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Panel derecho: formulario ─── */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Glow effect right side */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#1ED1B4]/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="w-full max-w-md animate-fade-in relative z-10">
          {/* Logo mobile */}
          <div className="flex lg:hidden flex-col items-center mb-8">
            <img src="/logo.png" alt="ADDONS" className="w-48 h-auto object-contain" />
          </div>

          <div className="bg-[#15233D] rounded-3xl shadow-2xl p-8 lg:p-10 border border-slate-800/50 backdrop-blur-xl">
            <h2 className="text-3xl font-bold text-white mb-2">Bienvenido</h2>
            <p className="text-slate-400 mb-8 font-light">Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Correo electrónico
                </label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="ejemplo@correo.com"
                  className="w-full px-5 py-4 rounded-xl border border-[#2E455C] bg-[#0A101D]/50 focus:bg-[#0A101D] focus:border-[#20CDFE] focus:ring-1 focus:ring-[#20CDFE] outline-none transition-all text-white placeholder:text-slate-600"
                />
                {errors.email && (
                  <p className="text-[#ff5252] text-xs mt-2">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full px-5 py-4 pr-12 rounded-xl border border-[#2E455C] bg-[#0A101D]/50 focus:bg-[#0A101D] focus:border-[#20CDFE] focus:ring-1 focus:ring-[#20CDFE] outline-none transition-all text-white placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#20CDFE] transition-colors"
                  >
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[#ff5252] text-xs mt-2">{errors.password.message}</p>
                )}
              </div>

              {/* Error global */}
              {error && (
                <div className="bg-[#ff5252]/10 border border-[#ff5252]/30 text-[#ff5252] px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                  {error}
                </div>
              )}

              {/* Botón */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] font-bold py-4 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(32,205,254,0.3)] mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-[#07060B]/30 border-t-[#07060B] rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={20} />
                    Iniciar sesión
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
