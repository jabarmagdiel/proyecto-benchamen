"use client";

import { useEffect, useState } from "react";
import { BarChart3, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { companiesApi } from "@/lib/api";
import type { Company } from "@/types";

export default function RendimientoPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      if (!user?.company_id) {
        setLoading(false);
        return;
      }
      try {
        const res = await companiesApi.list();
        const myCompany = res.data.find((c: Company) => c.id === user.company_id);
        if (myCompany) {
          setCompany(myCompany);
        }
      } catch (e) {
        console.error("Error al cargar datos de empresa", e);
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#2E455C] border-t-[#20CDFE] rounded-full animate-spin" />
      </div>
    );
  }

  const hasDashboard = company && company.dashboard_url && company.dashboard_url.trim() !== "";

  return (
    <div className="flex flex-col h-full animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="text-[#20CDFE]" />
          Rendimiento de Campañas
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Visualiza el desempeño en tiempo real de tus anuncios y estrategias digitales.
        </p>
      </div>

      <div className="flex-1 bg-[#0A101D]/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-sm overflow-hidden flex flex-col">
        {!hasDashboard ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-[#15233D] rounded-full flex items-center justify-center mb-6">
              <AlertCircle size={40} className="text-[#20CDFE]/50" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Dashboard no configurado</h3>
            <p className="text-slate-400 max-w-md">
              Aún no tienes un panel de rendimiento de Meta Ads asignado a tu cuenta. 
              Por favor, contacta con tu administrador de cuenta o espera a que se active.
            </p>
          </div>
        ) : (
          <div className="flex-1 w-full relative min-h-[600px]">
            <iframe
              src={company.dashboard_url}
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
              sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        )}
      </div>
    </div>
  );
}
