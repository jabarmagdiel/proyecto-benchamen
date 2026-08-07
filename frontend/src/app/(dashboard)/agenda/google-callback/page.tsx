"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setMessage("El acceso a Google Calendar fue denegado.");
      setTimeout(() => router.push("/agenda"), 3000);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("No se recibió el código de autorización.");
      setTimeout(() => router.push("/agenda"), 3000);
      return;
    }

    // Exchange the code for tokens via backend
    api.get(`/api/google-calendar/callback?code=${encodeURIComponent(code)}`)
      .then(() => {
        setStatus("success");
        setMessage("¡Google Calendar conectado correctamente! Redirigiendo...");
        setTimeout(() => router.push("/agenda"), 2500);
      })
      .catch((err) => {
        const detail = err?.response?.data?.detail || "Error al conectar con Google Calendar.";
        setStatus("error");
        setMessage(detail);
        setTimeout(() => router.push("/agenda"), 4000);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#07060B] flex items-center justify-center p-6">
      <div className="bg-[#0A101D] border border-slate-800 rounded-3xl shadow-2xl p-10 w-full max-w-md text-center">
        {status === "loading" && (
          <>
            <Loader2 size={48} className="text-[#20CDFE] mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-white mb-2">Conectando Google Calendar...</h2>
            <p className="text-slate-400 text-sm">Por favor espera un momento.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">¡Conectado!</h2>
            <p className="text-slate-300 text-sm">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-4">
              <XCircle size={36} className="text-rose-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Error de Conexión</h2>
            <p className="text-slate-300 text-sm">{message}</p>
            <p className="text-slate-500 text-xs mt-2">Redirigiendo a la Agenda...</p>
          </>
        )}
      </div>
    </div>
  );
}
