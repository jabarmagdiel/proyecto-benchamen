"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, FileText, Lock } from "lucide-react";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#07060B] text-white selection:bg-[#20CDFE] selection:text-[#07060B] py-12 px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-[#20CDFE] font-bold hover:underline mb-4"
          >
            <ArrowLeft size={14} /> Volver al Inicio
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#20CDFE]/10 border border-[#20CDFE]/30 flex items-center justify-center text-[#20CDFE]">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Términos y Condiciones de Uso
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Última actualización: {new Date().getFullYear()} — Plataforma Oficial ADDONS
              </p>
            </div>
          </div>
        </div>

        {/* Contenido Legal */}
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed bg-[#0A101D]/70 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          
          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-white text-[#20CDFE]">1. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar la plataforma <strong>ADDONS</strong>, el usuario (administrador, colaborador, gerente o cliente autorizado) acepta quedar vinculado por estos Términos y Condiciones de Uso. El acceso está estrictamente reservado a personal y clientes autorizados por la administración.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-white text-[#20CDFE]">2. Uso de la Plataforma y Cuentas</h2>
            <p>
              Las credenciales de acceso son personales e intransferibles. Cada usuario es responsable de mantener la confidencialidad de su contraseña y de todas las actividades realizadas bajo su cuenta. ADDONS se reserva el derecho de suspender accesos no autorizados o malintencionados.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-white text-[#20CDFE]">3. Propiedad Intelectual y Entregables</h2>
            <p>
              Todo el software, diseños, flujos de trabajo, marcas e interfaces pertenecientes a ADDONS están protegidos por leyes de propiedad intelectual. Los entregables, evidencias y materiales cargados por clientes y proyectos corresponden a sus respectivos propietarios según los acuerdos comerciales establecidos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-white text-[#20CDFE]">4. Confidencialidad de la Información</h2>
            <p>
              ADDONS garantiza que los datos operativos, archivos financieros, comprobantes de pago y evidencias cargadas en la plataforma serán tratados de manera estrictamente confidencial y utilizados únicamente para la gestión operativa y auditoría de los proyectos autorizados.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-white text-[#20CDFE]">5. Disponibilidad del Servicio</h2>
            <p>
              Nos esforzamos por mantener una disponibilidad continua del servicio (24/7). Sin embargo, ADDONS no se hace responsable por interrupciones temporales ocasionadas por mantenimiento programado, fallas en proveedores de infraestructura de terceros o causas de fuerza mayor.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-white text-[#20CDFE]">6. Modificaciones de los Términos</h2>
            <p>
              ADDONS se reserva el derecho de actualizar estos términos en cualquier momento. Las modificaciones entrarán en vigor a partir de su publicación en este sitio web oficial.
            </p>
          </section>

        </div>

        {/* Footer legal */}
        <div className="flex justify-between items-center text-xs text-slate-500 pt-4 border-t border-slate-800/80">
          <span>© {new Date().getFullYear()} ADDONS Official. Todos los derechos reservados.</span>
          <Link href="/privacidad" className="text-[#20CDFE] hover:underline font-bold">
            Ver Política de Privacidad
          </Link>
        </div>

      </div>
    </div>
  );
}
