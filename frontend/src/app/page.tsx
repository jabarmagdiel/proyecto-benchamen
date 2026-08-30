"use client";

import Link from "next/link";
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  Code, 
  Palette, 
  Lock,
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  BarChart3, 
  Users, 
  Globe, 
  Star, 
  Award, 
  ChevronRight,
  Video,
  Megaphone,
  Rocket,
  MessageSquare,
  HeartHandshake
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07060B] text-white selection:bg-[#20CDFE] selection:text-[#07060B] overflow-x-hidden font-sans">
      
      {/* ── Background Glow Effects ── */}
      <div className="fixed top-0 left-1/4 w-[750px] h-[750px] bg-[#20CDFE]/10 rounded-full blur-[170px] pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-0 right-1/4 w-[650px] h-[650px] bg-purple-600/10 rounded-full blur-[170px] pointer-events-none -z-10" />

      {/* ── 1. Navbar ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#07060B]/85 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Oficial ADDONS */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-12 w-auto flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logo.png" 
                alt="ADDONS" 
                className="h-10 w-auto object-contain drop-shadow-[0_0_15px_rgba(32,205,254,0.35)] group-hover:scale-105 transition-transform" 
              />
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-300">
            <a href="#inicio" className="hover:text-[#20CDFE] transition-colors">Inicio</a>
            <a href="#servicios" className="hover:text-[#20CDFE] transition-colors">Servicios</a>
            <a href="#por-que-nosotros" className="hover:text-[#20CDFE] transition-colors">Por Qué Elegirnos</a>
            <a href="#casos-de-exito" className="hover:text-[#20CDFE] transition-colors">Casos de Éxito</a>
            <a href="#contacto" className="hover:text-[#20CDFE] transition-colors">Contacto</a>
          </nav>

          {/* CTA Button Iniciar Sesión */}
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
      <section id="inicio" className="relative pt-16 pb-20 md:pt-24 md:pb-32 max-w-7xl mx-auto px-6 text-center">
        
        {/* Badge Superior */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#15233D]/90 border border-[#20CDFE]/40 text-[#20CDFE] text-xs font-black mb-8 shadow-2xl backdrop-blur-md animate-fade-in">
          <Sparkles size={14} className="text-amber-400 animate-spin" />
          <span>Agencia Digital de Marketing, Branding & Estrategia</span>
        </div>

        {/* Titular Principal */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl mx-auto mb-6">
          Elevamos tu Marca al <br />
          <span className="bg-gradient-to-r from-[#20CDFE] via-[#1ED1B4] to-purple-400 bg-clip-text text-transparent">
            Siguiente Nivel Digital
          </span>
        </h1>

        {/* Subtítulo enfocado en la Agencia */}
        <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10 font-normal">
          Diseñamos estrategias de contenido, campañas de pauta publicitaria en Meta Ads & TikTok, branding prémium y desarrollo web para posicionar tu empresa como líder del mercado.
        </p>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <a
            href="#contacto"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#20CDFE] via-[#1ED1B4] to-indigo-500 text-[#07060B] px-8 py-4 rounded-2xl font-black text-sm shadow-2xl shadow-[#20CDFE]/30 hover:scale-105 transition-all"
          >
            <Rocket size={18} />
            <span>Impulsar mi Marca</span>
          </a>
          <Link
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0A101D] text-slate-300 hover:text-white px-6 py-4 rounded-2xl font-bold text-sm border border-slate-800 hover:border-slate-700 transition-all"
          >
            <Lock size={15} className="text-[#20CDFE]" />
            <span>Acceso a Clientes & Equipo</span>
          </Link>
        </div>

        {/* Banner de Métricas de Agencias */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-10 border-t border-slate-800/80">
          <div className="p-5 rounded-2xl bg-[#0A101D]/70 border border-slate-800/80 backdrop-blur-xl">
            <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-black text-[#20CDFE]">
              <TrendingUp size={22} className="text-[#20CDFE]" /> +500K
            </div>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Alcance Mensual Generado</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#0A101D]/70 border border-slate-800/80 backdrop-blur-xl">
            <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-black text-purple-400">
              <Award size={22} className="text-purple-400" /> 4.9x
            </div>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Retorno de Inversión (ROAS)</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#0A101D]/70 border border-slate-800/80 backdrop-blur-xl">
            <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-black text-emerald-400">
              <Users size={22} className="text-emerald-400" /> +50
            </div>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Marcas Escaladas</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#0A101D]/70 border border-slate-800/80 backdrop-blur-xl">
            <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-3xl font-black text-amber-400">
              <Star size={22} className="text-amber-400" /> 99%
            </div>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Satisfacción de Clientes</p>
          </div>
        </div>
      </section>

      {/* ── 3. Servicios de la Agencia ── */}
      <section id="servicios" className="py-24 bg-[#0A101D]/60 border-y border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-[#20CDFE] px-3.5 py-1.5 rounded-full bg-[#20CDFE]/10 border border-[#20CDFE]/30">
              Nuestros Servicios
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4 tracking-tight">
              Soluciones Creativas & Estratégicas
            </h2>
            <p className="text-slate-400 text-sm">
              Potenciamos la presencia de tu marca con servicios especializados diseñados para captar clientes y aumentar ventas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Servicio 1: Publicidad & Meta Ads */}
            <div className="bg-[#15233D]/60 border border-slate-800 hover:border-[#20CDFE]/50 rounded-3xl p-8 transition-all hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-[#20CDFE]/10 group">
              <div className="w-14 h-14 rounded-2xl bg-[#20CDFE]/10 border border-[#20CDFE]/30 flex items-center justify-center text-[#20CDFE] mb-6 group-hover:scale-110 transition-transform">
                <Megaphone size={28} />
              </div>
              <h3 className="text-xl font-black text-white mb-3">Publicidad & Meta Ads</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Campañas publicitarias altamente segmentadas en Instagram, Facebook y TikTok orientadas a captar clientes potenciales calificados de forma continua.
              </p>
            </div>

            {/* Servicio 2: Branding & Diseño */}
            <div className="bg-[#15233D]/60 border border-slate-800 hover:border-purple-500/50 rounded-3xl p-8 transition-all hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-purple-500/10 group">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Palette size={28} />
              </div>
              <h3 className="text-xl font-black text-white mb-3">Branding e Identidad de Marca</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Creación de logotipos, manuales de marca, paletas cromáticas e identidad estética profesional que destaca sobre la competencia.
              </p>
            </div>

            {/* Servicio 3: Producción Audiovisual */}
            <div className="bg-[#15233D]/60 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-8 transition-all hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/10 group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Video size={28} />
              </div>
              <h3 className="text-xl font-black text-white mb-3">Producción Audiovisual & Content</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Creación de contenido en tendencia para Reels, TikToks, fotografía corporativa de producto y videos promocionales de alta definición.
              </p>
            </div>

            {/* Servicio 4: Desarrollo Web & Landing Pages */}
            <div className="bg-[#15233D]/60 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-8 transition-all hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-500/10 group">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <Code size={28} />
              </div>
              <h3 className="text-xl font-black text-white mb-3">Desarrollo Web & Landing Pages</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Páginas web modernas, tiendas online y landing pages diseñadas para convertir visitantes en compradores desde cualquier dispositivo.
              </p>
            </div>

            {/* Servicio 5: Estrategia de Growth */}
            <div className="bg-[#15233D]/60 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-8 transition-all hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/10 group">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Target size={28} />
              </div>
              <h3 className="text-xl font-black text-white mb-3">Estrategia & Growth Marketing</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Planificación estratégica personalizada, optimización de embudos de ventas y posicionamiento acelerado para negocios en expansión.
              </p>
            </div>

            {/* Servicio 6: Community Management */}
            <div className="bg-[#15233D]/60 border border-slate-800 hover:border-rose-500/50 rounded-3xl p-8 transition-all hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-rose-500/10 group">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6 group-hover:scale-110 transition-transform">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-black text-white mb-3">Social Media Management</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Gestión profesional de comunidades digitales, calendario de publicaciones, redacción de textos persuasivos y atención a seguidores.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4. Por Qué Elegirnos ── */}
      <section id="por-que-nosotros" className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <span className="text-xs font-black uppercase tracking-widest text-[#20CDFE] px-3.5 py-1.5 rounded-full bg-[#20CDFE]/10 border border-[#20CDFE]/30">
              Ventaja Competitiva
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Hacemos Crecer Tu Marca Con Estrategias Garantizadas
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              En **ADDONS** no vendemos publicaciones sin sentido. Desarrollamos un plan de acción enfocado en resultados comerciales, métricas reales y retorno de inversión.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Estrategias Basadas en Datos</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Medimos cada peso invertido en pauta para garantizar la mayor tasa de conversión posible.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-lg bg-[#20CDFE]/20 text-[#20CDFE] mt-0.5">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Diseño & Contenido de Clase Mundial</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Creatividad visual impecable que transmite confianza y autoridad instantánea a tus clientes.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded-lg bg-purple-500/20 text-purple-400 mt-0.5">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Equipo Creativo & Técnico Integrado</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Diseñadores, copywriters, creadores de contenido y media buyers trabajando coordinados para tu marca.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta de demostración gráfica */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#20CDFE]/20 via-purple-500/20 to-emerald-500/20 rounded-3xl blur-2xl" />
            <div className="relative bg-[#0A101D] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="ADDONS" className="h-8 w-auto object-contain" />
                  <span className="text-xs font-bold text-white">ADDONS Digital Agency</span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ● 100% Enfocados en Resultados
                </span>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#15233D]/60 border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-white">Crecimiento de Audiencia</span>
                    <span className="text-xs font-black text-emerald-400">+240%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-[85%]" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#15233D]/60 border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-white">Conversión de Meta Ads</span>
                    <span className="text-xs font-black text-[#20CDFE]">4.9x ROAS</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-[#20CDFE] to-indigo-500 h-full w-[92%]" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#15233D]/60 border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-white">Posicionamiento de Marca</span>
                    <span className="text-xs font-black text-purple-400">Nivel Superior</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full w-[96%]" />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── 5. Casos de Éxito ── */}
      <section id="casos-de-exito" className="py-24 bg-[#0A101D]/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 text-center">
          
          <span className="text-xs font-black uppercase tracking-widest text-[#20CDFE] px-3.5 py-1.5 rounded-full bg-[#20CDFE]/10 border border-[#20CDFE]/30">
            Historias de Éxito
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4 tracking-tight">
            Marcas que Crecen Con Nosotros
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto mb-16">
            Resultados reales obtenidos para empresas que confiaron en la estrategia de ADDONS.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            <div className="bg-[#15233D]/60 border border-slate-800 rounded-3xl p-8 space-y-4">
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                &quot;El cambio en nuestras ventas fue inmediato. Logramos multiplicar por 4 las consultas diarias a través de Meta Ads y la estética de la marca mejoró notablemente.&quot;
              </p>
              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs font-bold text-white">Marca de Moda & Retail</p>
                <p className="text-[11px] text-emerald-400 font-semibold">+320% en ventas en 60 días</p>
              </div>
            </div>

            <div className="bg-[#15233D]/60 border border-slate-800 rounded-3xl p-8 space-y-4">
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                &quot;Excelente trabajo en la producción de Reels y contenido para TikTok. La interacción con nuestros clientes se triplicó en el primer mes.&quot;
              </p>
              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs font-bold text-white">Empresa de Servicios</p>
                <p className="text-[11px] text-[#20CDFE] font-semibold">450+ clientes potenciales/mes</p>
              </div>
            </div>

            <div className="bg-[#15233D]/60 border border-slate-800 rounded-3xl p-8 space-y-4">
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                &quot;Desarrollaron nuestra nueva web y la campaña publicitaria completa. La atención y entrega a tiempo fue impecable en todo momento.&quot;
              </p>
              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs font-bold text-white">Empresa Gastronómica</p>
                <p className="text-[11px] text-purple-400 font-semibold">Posicionamiento Líder en su Sector</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 6. Contacto & CTA Final ── */}
      <section id="contacto" className="py-24 max-w-5xl mx-auto px-6">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#20CDFE]/20 via-[#1ED1B4]/10 to-purple-600/20 border border-[#20CDFE]/40 p-8 sm:p-12 text-center overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#20CDFE]/20 rounded-full blur-3xl pointer-events-none -z-10" />
          
          <span className="text-amber-400 text-xs font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-full inline-block mb-4">
            🚀 ¿Listo para destacar?
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Llevemos tu Marca al Siguiente Nivel
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
            Contáctanos hoy mismo para diseñar una estrategia publicitaria y visual a la medida de los objetivos de tu negocio.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-8 py-3.5 rounded-xl font-black text-sm shadow-xl shadow-[#20CDFE]/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <HeartHandshake size={18} />
              <span>Contactar con ADDONS</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. Footer Oficial ── */}
      <footer className="border-t border-slate-800/80 py-12 bg-[#07060B]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          
          {/* Logo Footer */}
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ADDONS" className="h-8 w-auto object-contain" />
            <span className="text-xs text-slate-400 font-medium">| Agencia de Marketing Digital & Estrategia</span>
          </div>
          
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} ADDONS Official. Todos los derechos reservados.
          </p>

          {/* Links Legales y Acceso */}
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
