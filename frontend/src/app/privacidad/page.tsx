"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, EyeOff } from "lucide-react";

export default function PrivacidadPage() {
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
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Política de Privacidad & Protección de Datos
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
            <h2 className="text-base font-extrabold text-white text-emerald-400">1. Información que Recopilamos</h2>
            <p>
              En <strong>ADDONS</strong> recopilamos únicamente los datos estrictamente necesarios para prestar el servicio de gestión de proyectos y actividades:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs pl-2">
              <li>Datos de cuenta: nombre, correo electrónico, rol asignado y credenciales cifradas.</li>
              <li>Información operativa: tareas, actividades, proyectos, registros de estado y evidencias cargadas.</li>
              <li>Registros de transacciones financieras y comprobantes adjuntos por administradores.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-white text-emerald-400">2. Uso de la Información</h2>
            <p>
              La información recopilada se utiliza exclusivamente para:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs pl-2">
              <li>Permitir la autenticación y control de acceso jerárquico según el rol del usuario.</li>
              <li>Gestión de flujos de trabajo, agendas y entregas entre gerencias, colaboradores y clientes.</li>
              <li>Generación de reportes ejecutivos de cumplimiento y registros de auditoría interna.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-white text-emerald-400">3. Seguridad de los Datos y Almacenamiento</h2>
            <p>
              Implementamos medidas de seguridad avanzadas: autenticación mediante Tokens JWT, comunicaciones cifradas SSL/TLS (HTTPS) y almacenamiento seguro de archivos en infraestructuras de alto nivel (Cloudinary / Supabase). Las contraseñas se almacenan cifradas en un solo sentido.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-white text-emerald-400">4. No Divulgación a Terceros</h2>
            <p>
              ADDONS <strong>nunca vende, alquila ni comercializa</strong> los datos personales o la información de proyectos de sus usuarios a terceros. Toda la información almacenada permanece bajo estricto carácter privado y confidencial.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-extrabold text-white text-emerald-400">5. Derechos de los Usuarios</h2>
            <p>
              Los usuarios tienen derecho a solicitar el acceso, corrección o eliminación de sus datos personales poniéndose en contacto con la administración del sistema a través de los canales de soporte autorizados.
            </p>
          </section>

        </div>

        {/* Footer legal */}
        <div className="flex justify-between items-center text-xs text-slate-500 pt-4 border-t border-slate-800/80">
          <span>© {new Date().getFullYear()} ADDONS Official. Todos los derechos reservados.</span>
          <Link href="/terminos" className="text-[#20CDFE] hover:underline font-bold">
            Ver Términos y Condiciones
          </Link>
        </div>

      </div>
    </div>
  );
}
