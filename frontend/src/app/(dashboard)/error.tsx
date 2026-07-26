"use client";

import { useEffect } from "react";

export default function DashboardErrorModal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Uncaught Dashboard Runtime Error:", error);
  }, [error]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0A101D]/95 border border-red-500/30 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-[0_10px_50px_rgba(239,68,68,0.25)] text-center relative overflow-hidden">
        <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <span className="text-3xl font-bold">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Ha ocurrido un error</h2>
        <p className="text-slate-400 text-xs mb-4">No pudimos cargar esta sección correctamente. Puedes reintentar o volver al inicio.</p>
        
        <div className="text-red-300 text-sm leading-relaxed mb-6 bg-[#15233D]/70 p-4 rounded-2xl border border-red-500/20 break-words max-h-60 overflow-y-auto text-left font-mono">
          {error.message || "Error desconocido en el módulo o al recibir la información."}
          {error.digest && <div className="text-xs text-slate-500 mt-2">Digest: {error.digest}</div>}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => window.location.href = "/dashboard"}
            className="flex-1 py-3 bg-[#15233D] text-slate-300 font-bold rounded-xl hover:bg-[#1C2C4D] transition-all border border-slate-800"
          >
            Ir al Dashboard
          </button>
          <button
            onClick={() => reset()}
            className="flex-1 py-3 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#20CDFE]/20"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}
