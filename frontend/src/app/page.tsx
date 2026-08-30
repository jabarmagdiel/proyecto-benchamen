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
  Lock,
  Zap,
  Globe,
  TrendingUp,
  Target,
  Code,
  Palette,
  Layers,
  Star,
  Award,
  ChevronRight
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07060B] text-white selection:bg-[#20CDFE] selection:text-[#07060B] overflow-x-hidden font-sans">
      
      {/* ── Background Glow Effects ── */}
      <div className="fixed top-0 left-1/4 w-[700px] h-[700px] bg-[#20CDFE]/10 rounded-full blur-[160px] pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* ── 1. Navbar ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#07060B]/85 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Oficial */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-12 w-auto flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logo.png" 
                alt="ADDONS" 
                className="h-10 w-auto object-contain drop-shadow-[0_0_15px_rgba(32,205,254,0.3)] group-hover:scale-105 transition-transform" 
              />
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-300">
            <a href="#servicios" className="hover:text-[#20CDFE] transition-colors">Servicios</a>
            <a href="#soluciones" className="hover:text-[#20CDFE] transition-colors">Soluciones</a>
            <a href="#plataforma" className="hover:text-[#20CDFE] transition-colors">Plataforma</a>
            <a href="#clientes" className="hover:text-[#20CDFE] transition-colors">Portal Clientes</a>
          </nav>

          {/* CTA Button */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="flex items-center gap-2 bg-gradient-to-r from-[#20CDFE] via-[#1ED1B4] to-indigo-500 text-[#07060B] px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-[#20CDFE]/20 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Lock size={14} />
              <span>Iniciar Sesión</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. Hero Section ── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 max-w-7xl mx-auto px-6 text-center">
        
        {/* Badge Superior */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#15233D]/90 border border-[#20CDFE]/40 text-[#20CDFE] text-xs font-black mb-8 shadow-2xl backdrop-blur-md animate-fade-in">
          <Sparkles size={14} className="text-amber-400 animate-spin" />
          <span>Agencia de Marketing Digital, Software & Gestión Operativa</span>
        </div>

        {/* Titular Principal */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl mx-auto mb-6">
          Impulsamos Marcas Excepcionales con <br />
          <span className="bg-gradient-to-r from-[#20CDFE] via-[#1ED1B4] to-purple-400 bg-clip-text text-transparent">
            Estrategias de Marketing & Software de Alto Nivel
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10 font-normal">
          Transformamos negocios con campañas digitales de alto impacto, desarrollo web y móvil a medida, branding prémium y gestión operativa integral para marcas líderes.
        </p>

        {/* Botón de Acción Principal */}
        <div className="flex justify-center max-w-md mx-auto mb-16">
          <Link
            href="/login"
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-[#20CDFE] via-[#1ED1B4] to-indigo-500 text-[#07060B] px-8 py-4 rounded-2xl font-black text-sm shadow-2xl shadow-[#20CDFE]/30 hover:scale-105 transition-all"
          >
            <Lock size={18} />
            <span>Ingresar a la Plataforma Interna</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Banner de Métricas Destacadas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-10 border-t border-slate-800/80">
          <div className="p-5 rounded-2xl bg-[#0A101D]/70 border border-slate-800/80 backdrop-blur-xl">
            <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-black text-[#20CDFE]">
              <TrendingUp size={22} className="text-[#20CDFE]" /> 4.8x
            </div>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">ROAS Promedio en Meta Ads</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#0A101D]/70 border border-slate-800/80 backdrop-blur-xl">
            <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-black text-purple-400">
              <Award size={22} className="text-purple-400" /> 99.8%
            </div>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Entregas a Tiempo Auditadas</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#0A101D]/70 border border-slate-800/80 backdrop-blur-xl">
            <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-black text-emerald-400">
              <ShieldCheck size={22} className="text-emerald-400" /> 100%
            </div>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Transparencia para Clientes</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#0A101D]/70 border border-slate-800/80 backdrop-blur-xl">
            <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-black text-amber-400">
              <Star size={22} className="text-amber-400" /> 24 / 7
            </div>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Acceso a Entregables & Agenda</p>
          </div>
        </div>
      </section>

      {/* ── 3. Servicios Principales de Marketing & Software ── */}
      <section id="servicios" className="py-24 bg-[#0A101D]/60 border-y border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-[#20CDFE] px-3.5 py-1.5 rounded-full bg-[#20CDFE]/10 border border-[#20CDFE]/30">
              Soluciones Integrales
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4 tracking-tight">
              Especialistas en Marketing Digital & Desarrollo
            </h2>
            <p className="text-slate-400 text-sm">
              Combinamos creatividad estratégica con tecnología avanzada para escalar la facturación y presencia de tu marca.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Servicio 1: Marketing & Meta Ads */}
            <div className="bg-[#15233D]/60 border border-slate-800 hover:border-[#20CDFE]/50 rounded-3xl p-8 transition-all hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-[#20CDFE]/10 group">
              <div className="w-14 h-14 rounded-2xl bg-[#20CDFE]/10 border border-[#20CDFE]/30 flex items-center justify-center text-[#20CDFE] mb-6 group-hover:scale-110 transition-transform">
                <Target size={28} />
              </div>
              <h3 className="text-xl font-black text-white mb-3">Marketing Digital & Meta Ads</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Estrategias de pauta publicitaria de alto rendimiento en Meta (Instagram, Facebook), TikTok y Google Ads enfocadas en generación constante de clientes potenciales.
              </p>
            </div>

            {/* Servicio 2: Desarrollo de Software */}
            <div className="bg-[#15233D]/60 border border-slate-800 hover:border-purple-500/50 rounded-3xl p-8 transition-all hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-500/10 group">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Code size={28} />
              </div>
              <h3 className="text-xl font-black text-white mb-3">Desarrollo Web & Apps Móviles</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Creación de plataformas web interactivas, aplicaciones móviles iOS/Android y sistemas de gestión a medida con tecnologías de última generación.
              </p>
            </div>

            {/* Servicio 3: Branding & Diseño */}
            <div className="bg-[#15233D]/60 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-8 transition-all hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/10 group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Palette size={28} />
              </div>
              <h3 className="text-xl font-black text-white mb-3">Branding & Contenido Audiovisual</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Diseño de identidad corporativa, logotipos, piezas gráficas de alto impacto, producción de videos publicitarios y gestión estética de redes sociales.
              </p>
            </div>

            {/* Servicio 4: Gestión Operativa & Evidencias */}
            <div className="bg-[#15233D]/60 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-8 transition-all hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-500/10 group">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <Layers size={28} />
              </div>
              <h3 className="text-xl font-black text-white mb-3">Gestión Operativa & Evidencias</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Supervisión auditada de tareas, control jerárquico por departamentos y validación de evidencias fotográficas/documentales antes de la entrega final.
              </p>
            </div>

            {/* Servicio 5: Agenda & Citas */}
            <div className="bg-[#15233D]/60 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-8 transition-all hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/10 group">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Calendar size={28} />
              </div>
              <h3 className="text-xl font-black text-white mb-3">Agenda & Citas Comerciales</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Matriz de disponibilidad interactiva para coordinar reuniones estratégicas con clientes y sincronización automática con Google Calendar.
              </p>
            </div>

            {/* Servicio 6: Analítica & Reportes */}
            <div className="bg-[#15233D]/60 border border-slate-800 hover:border-rose-500/50 rounded-3xl p-8 transition-all hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-rose-500/10 group">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 size={28} />
              </div>
              <h3 className="text-xl font-black text-white mb-3">Performance & Reportes Ejecutivos</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Paneles analíticos en tiempo real, seguimiento de KPIs de rendimiento y exportación instantánea de resúmenes contables y operativos en Excel/PDF.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4. Plataforma & Portal de Clientes ── */}
      <section id="plataforma" className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <span className="text-xs font-black uppercase tracking-widest text-[#20CDFE] px-3.5 py-1.5 rounded-full bg-[#20CDFE]/10 border border-[#20CDFE]/30">
              Plataforma Exclusiva ADDONS
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Control Total y Transparencia Garantizada para tu Empresa
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Nuestra plataforma unificada permite a directores, gerentes de departamento y clientes tener visibilidad total sobre los avances, entregables y presupuestos de cada proyecto en tiempo real.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Escalafón Dinámico de Mando</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Delegación estructurada de tareas con supervisión jerárquica por departamentos.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-lg bg-[#20CDFE]/20 text-[#20CDFE] mt-0.5">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Portal Privado de Entregables para Clientes</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Tus clientes acceden a un panel limpio donde aprueban diseños, descargan archivos y revisan avances.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-lg bg-purple-500/20 text-purple-400 mt-0.5">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Gestión Financiera & Comprobantes Auditados</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Registro contable de ingresos y egresos con almacenamiento seguro de comprobantes.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-[#15233D] hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-xl border border-slate-700 transition-all"
              >
                <Lock size={14} className="text-[#20CDFE]" />
                Acceder al Portal del Sistema
              </Link>
            </div>
          </div>

          {/* Banner gráfico / Card Ilustrativa */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#20CDFE]/20 via-purple-500/20 to-emerald-500/20 rounded-3xl blur-2xl" />
            <div className="relative bg-[#0A101D] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="ADDONS" className="h-8 w-auto object-contain" />
                  <span className="text-xs font-mono text-slate-400">addonsoficial.com</span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ● Sistema Activo 24/7
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#15233D]/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Campaña Meta Ads Q3</span>
                    <p className="text-[11px] text-slate-400">ROAS 5.2x • 480 Leads Generados</p>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-400">Finalizado</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#15233D]/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Desarrollo Web Platform</span>
                    <p className="text-[11px] text-slate-400">Avance 92% • Evidencias Aprobadas</p>
                  </div>
                  <span className="text-xs font-extrabold text-[#20CDFE]">En Revisión</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#15233D]/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Branding & Rediseño de Marca</span>
                    <p className="text-[11px] text-slate-400">Entregables Listos en Portal Clientes</p>
                  </div>
                  <span className="text-xs font-extrabold text-purple-400">Completado</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 5. CTA Banner Final ── */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#20CDFE]/20 via-[#1ED1B4]/10 to-purple-600/20 border border-[#20CDFE]/40 p-8 sm:p-12 text-center overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#20CDFE]/20 rounded-full blur-3xl pointer-events-none -z-10" />
          
          <span className="text-amber-400 text-xs font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-full inline-block mb-4">
            🚀 Acceso para Colaboradores & Clientes
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Accede a la Plataforma de ADDONS
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
            Ingresa con tus credenciales autorizadas para gestionar proyectos, consultar reportes y coordinar actividades.
          </p>

          <div className="flex justify-center max-w-sm mx-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-8 py-3.5 rounded-xl font-black text-sm shadow-xl shadow-[#20CDFE]/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Lock size={16} />
              <span>Iniciar Sesión en el Sistema</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Footer Oficial ── */}
      <footer className="border-t border-slate-800/80 py-12 bg-[#07060B]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          
          {/* Logo Footer */}
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ADDONS" className="h-8 w-auto object-contain" />
            <span className="text-xs text-slate-400 font-medium">| Agencia de Marketing & Software</span>
          </div>
          
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} ADDONS Official. Todos los derechos reservados.
          </p>

          {/* Links Legales */}
          <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
            <Link href="/terminos" className="hover:text-[#20CDFE] transition-colors">Términos & Condiciones</Link>
            <Link href="/privacidad" className="hover:text-[#20CDFE] transition-colors">Privacidad</Link>
            <Link href="/login" className="hover:text-[#20CDFE] transition-colors">Acceso Sistema</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
