"use client";

import Link from "next/link";
import { 
  Building2, 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Users, 
  BarChart3, 
  ClipboardList, 
  FolderKanban, 
  Clock, 
  Star, 
  ChevronRight,
  Lock,
  Zap,
  Globe
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07060B] text-white selection:bg-[#20CDFE] selection:text-[#07060B] overflow-x-hidden font-sans">
      
      {/* ── Background Glow Effects ── */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-[#20CDFE]/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* ── 1. Navbar ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#07060B]/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#20CDFE] via-[#1ED1B4] to-indigo-500 flex items-center justify-center text-[#07060B] font-black text-xl shadow-lg shadow-[#20CDFE]/20 group-hover:scale-105 transition-transform">
              A
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-white flex items-center gap-1.5">
                ADDONS
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#20CDFE]/20 text-[#20CDFE] border border-[#20CDFE]/40">
                  Official
                </span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Plataforma Empresarial</p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-300">
            <a href="#caracteristicas" className="hover:text-[#20CDFE] transition-colors">Características</a>
            <a href="#jerarquia" className="hover:text-[#20CDFE] transition-colors">Jerarquía & Mando</a>
            <a href="#agenda" className="hover:text-[#20CDFE] transition-colors">Agenda & Citas</a>
            <a href="#clientes" className="hover:text-[#20CDFE] transition-colors">Portal Clientes</a>
          </nav>

          {/* CTA Button único */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="flex items-center gap-2 bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-[#20CDFE]/25 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Lock size={14} />
              <span>Iniciar Sesión</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. Hero Section ── */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 max-w-7xl mx-auto px-6 text-center">
        
        {/* Badge superior */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#15233D]/90 border border-[#20CDFE]/40 text-[#20CDFE] text-xs font-extrabold mb-8 shadow-xl animate-fade-in">
          <Sparkles size={14} className="text-amber-400" />
          <span>Gestión Operativa, Agenda & Entrega de Evidencias en Tiempo Real</span>
        </div>

        {/* Titular Principal */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl mx-auto mb-6">
          Potencia tu Empresa con <br />
          <span className="bg-gradient-to-r from-[#20CDFE] via-[#1ED1B4] to-purple-400 bg-clip-text text-transparent">
            Gestión Inteligente y Garantizada
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10">
          Supervisa proyectos, coordina departamentos por niveles de jerarquía, programa citas con clientes y valida evidencias con total transparencia auditada.
        </p>

        {/* Botón de Acción Principal */}
        <div className="flex justify-center max-w-md mx-auto mb-16">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#20CDFE] via-[#1ED1B4] to-indigo-500 text-[#07060B] px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-[#20CDFE]/30 hover:scale-105 transition-all"
          >
            <Lock size={18} />
            Ingresar al Sistema
          </Link>
        </div>

        {/* Banner de Métricas / Confianza */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-800/80">
          <div className="p-4 rounded-2xl bg-[#0A101D]/60 border border-slate-800/60">
            <p className="text-2xl sm:text-3xl font-black text-[#20CDFE]">100%</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Transparencia Auditada</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0A101D]/60 border border-slate-800/60">
            <p className="text-2xl sm:text-3xl font-black text-purple-400">Jerárquico</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Delegación de Mando</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0A101D]/60 border border-slate-800/60">
            <p className="text-2xl sm:text-3xl font-black text-emerald-400">Multi-Empresa</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Gestión Centralizada</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0A101D]/60 border border-slate-800/60">
            <p className="text-2xl sm:text-3xl font-black text-amber-400">24 / 7</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Acceso a Entregables</p>
          </div>
        </div>
      </section>

      {/* ── 3. Grid de Funcionalidades Premium ── */}
      <section id="caracteristicas" className="py-20 bg-[#0A101D]/50 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-[#20CDFE] px-3 py-1 rounded-full bg-[#20CDFE]/10 border border-[#20CDFE]/20">
              Ecosistema Completo
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-4 mb-4">
              Diseñado para Equipos de Alto Rendimiento
            </h2>
            <p className="text-slate-400 text-sm">
              Una plataforma unificada que conecta la administración, gerencias operativas, colaboradores y clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="bg-[#15233D]/60 border border-slate-800 hover:border-[#20CDFE]/50 rounded-3xl p-8 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#20CDFE]/10 group">
              <div className="w-12 h-12 rounded-2xl bg-[#20CDFE]/10 border border-[#20CDFE]/30 flex items-center justify-center text-[#20CDFE] mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Escalafón Dinámico de Mando</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Define niveles de jerarquía operativa. Los gerentes pueden asignar y supervisar actividades a departamentos subordinados con control total.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#15233D]/60 border border-slate-800 hover:border-purple-500/50 rounded-3xl p-8 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10 group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Calendar size={24} />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Agenda & Matriz de Disponibilidad</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Publica horarios de atención para clientes y coordina reuniones de equipo con la matriz interactiva de disponibilidad.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#15233D]/60 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-8 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Aprobación de Evidencias</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Carga de múltiples evidencias por tarea, integración directa con Google Drive y flujo de aprobación por gerencia y administradores.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-[#15233D]/60 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-8 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Portal Transparente para Clientes</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Tus clientes cuentan con un panel exclusivo para revisar el progreso de sus proyectos y descargar entregables finales.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-[#15233D]/60 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-8 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Reportes & Exportación Instantánea</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Genera reportes de cumplimiento y exporta resúmenes ejecutivos en Excel y PDF listos para presentación.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-[#15233D]/60 border border-slate-800 hover:border-rose-500/50 rounded-3xl p-8 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-500/10 group">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6 group-hover:scale-110 transition-transform">
                <Globe size={24} />
              </div>
              <h3 className="text-lg font-black text-white mb-2">Suscripciones & Paquetes de Servicio</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Control de cupos de tareas contratadas, paquetes personalizados y gestión automatizada de clientes.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4. CTA Banner Final ── */}
      <section className="py-24 max-w-5xl mx-auto px-6">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#20CDFE]/20 via-[#1ED1B4]/10 to-purple-600/20 border border-[#20CDFE]/40 p-8 sm:p-12 text-center overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#20CDFE]/20 rounded-full blur-3xl pointer-events-none -z-10" />
          
          <span className="text-amber-400 text-xs font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 rounded-full inline-block mb-4">
            🚀 Acceso Directo
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            ¿Listo para llevar la gestión al siguiente nivel?
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
            Ingresa a la plataforma y gestiona tus actividades, proyectos y reuniones en tiempo real.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-8 py-3.5 rounded-xl font-black text-sm shadow-xl shadow-[#20CDFE]/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>Ingresar Ahora</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. Footer ── */}
      <footer className="border-t border-slate-800/80 py-12 bg-[#07060B]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#20CDFE] to-[#1ED1B4] flex items-center justify-center text-[#07060B] font-black text-sm">
              A
            </div>
            <span className="font-black text-base text-white">ADDONS</span>
          </div>
          
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} ADDONS Official. Todos los derechos reservados.
          </p>

          <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
            <Link href="/terminos" className="hover:text-[#20CDFE] transition-colors">Términos & Condiciones</Link>
            <Link href="/privacidad" className="hover:text-[#20CDFE] transition-colors">Privacidad</Link>
            <Link href="/login" className="hover:text-[#20CDFE] transition-colors">Sistema</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
