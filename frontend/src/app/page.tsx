"use client";

import { useState } from "react";
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
  HeartHandshake,
  Check,
  ChevronDown,
  Play,
  Flame,
  ArrowUpRight
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("todos");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const portfolioItems = [
    {
      id: 1,
      category: "meta-ads",
      categoryName: "Meta Ads & Pauta",
      title: "Campaña Meta Ads E-Commerce",
      result: "+380% ROAS en 45 días",
      tag: "Instagram & Facebook Ads",
      img: "/hero-marketing.png",
    },
    {
      id: 2,
      category: "branding",
      categoryName: "Branding & Diseño",
      title: "Rediseño de Identidad Corporativa",
      result: "Posicionamiento Prémium",
      tag: "Branding & Manual de Marca",
      img: "/creative-portfolio.png",
    },
    {
      id: 3,
      category: "video",
      categoryName: "Producción Audiovisual",
      title: "Contenido Viral Reels & TikTok",
      result: "+1.2M Reproducciones",
      tag: "Video & Copywriting",
      img: "/video-showcase.png",
    },
    {
      id: 4,
      category: "web",
      categoryName: "Desarrollo Web",
      title: "E-Commerce de Alta Conversión",
      result: "2.4s Carga • +45% Conversión",
      tag: "Next.js & UI/UX Design",
      img: "/hero-marketing.png",
    },
  ];

  const filteredPortfolio = activeTab === "todos" 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeTab);

  const faqs = [
    {
      q: "¿Cómo ayuda ADDONS a incrementar las ventas de mi empresa?",
      a: "Diseñamos un plan integral personalizado que combina pauta publicitaria optimizada en Meta Ads/TikTok Ads, branding de alto nivel y embudos de conversión probados para generar clientes potenciales día a día."
    },
    {
      q: "¿En cuánto tiempo se empiezan a ver los resultados de las campañas?",
      a: "Las campañas de pauta digital comienzan a generar contactos y clientes desde la primera semana de activación. Realizamos optimizaciones constantes de ROAS para escalar la inversión progresivamente."
    },
    {
      q: "¿Incluyen producción de video y contenido fotográfico?",
      a: "¡Sí! Contamos con equipo especializado en producción audiovisual, edición para Reels/TikToks, fotografía corporativa de producto y diseño gráfico publicitario de alta conversión."
    },
    {
      q: "¿Cómo accedo a los entregables y avances de mi proyecto?",
      a: "Tus gerentes y clientes cuentan con acceso directo al Portal Privado de ADDONS mediante el botón 'Iniciar Sesión' donde pueden revisar informes en tiempo real, descargar archivos y agendar citas."
    }
  ];

  return (
    <div className="min-h-screen bg-[#07060B] text-white selection:bg-[#20CDFE] selection:text-[#07060B] overflow-x-hidden font-sans">
      
      {/* ── Background Glow Effects ── */}
      <div className="fixed top-0 left-1/4 w-[750px] h-[750px] bg-[#20CDFE]/10 rounded-full blur-[170px] pointer-events-none -z-10 animate-glow" />
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
                className="h-10 w-auto object-contain drop-shadow-[0_0_20px_rgba(32,205,254,0.4)] group-hover:scale-105 transition-transform" 
              />
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-300">
            <a href="#inicio" className="hover:text-[#20CDFE] transition-colors">Inicio</a>
            <a href="#servicios" className="hover:text-[#20CDFE] transition-colors">Servicios</a>
            <a href="#portafolio" className="hover:text-[#20CDFE] transition-colors">Casos de Éxito</a>
            <a href="#faq" className="hover:text-[#20CDFE] transition-colors">Preguntas Frecuentes</a>
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

      {/* ── 2. Hero Section con Imágenes & Animaciones ── */}
      <section id="inicio" className="relative pt-12 pb-20 md:pt-20 md:pb-32 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Columna Izquierda: Texto & CTA */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#15233D]/90 border border-[#20CDFE]/40 text-[#20CDFE] text-xs font-black shadow-2xl backdrop-blur-md animate-fade-in">
              <Sparkles size={14} className="text-amber-400 animate-spin" />
              <span>Agencia Digital de Marketing, Branding & Estrategia</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Elevamos tu Marca al <br />
              <span className="bg-gradient-to-r from-[#20CDFE] via-[#1ED1B4] to-purple-400 bg-clip-text text-transparent">
                Siguiente Nivel Digital
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto lg:mx-0">
              Diseñamos estrategias de contenido persuasivo, campañas de alto rendimiento en Meta Ads & TikTok, branding prémium y desarrollo web para hacer escalar las ventas de tu negocio.
            </p>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href="#contacto"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#20CDFE] via-[#1ED1B4] to-indigo-500 text-[#07060B] px-8 py-4 rounded-2xl font-black text-sm shadow-2xl shadow-[#20CDFE]/30 hover:scale-105 transition-all"
              >
                <Rocket size={18} />
                <span>Agendar Consulta Gratuita</span>
              </a>
              <Link
                href="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0A101D] text-slate-300 hover:text-white px-6 py-4 rounded-2xl font-bold text-sm border border-slate-800 hover:border-slate-700 transition-all"
              >
                <Lock size={15} className="text-[#20CDFE]" />
                <span>Acceso a Clientes & Equipo</span>
              </Link>
            </div>

            {/* Métricas destacadas */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-[#20CDFE] flex items-center gap-1">
                  <TrendingUp size={20} /> 4.9x
                </p>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">ROAS Meta Ads</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-purple-400 flex items-center gap-1">
                  <Award size={20} /> +500K
                </p>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Alcance Mensual</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400 flex items-center gap-1">
                  <Star size={20} /> 99%
                </p>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Clientes Retenidos</p>
              </div>
            </div>

          </div>

          {/* Columna Derecha: Mockup Visual con Animación 3D */}
          <div className="lg:col-span-5 relative">
            
            {/* Glow Aura */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#20CDFE]/30 via-purple-500/30 to-emerald-500/20 rounded-3xl blur-3xl -z-10" />

            {/* Tarjeta Principal de Imagen Hero */}
            <div className="relative rounded-3xl overflow-hidden border border-[#20CDFE]/40 bg-[#0A101D] shadow-2xl shadow-[#20CDFE]/20 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/hero-marketing.png" 
                alt="Marketing Analytics Showcase" 
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" 
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#07060B] via-transparent to-transparent opacity-80" />

              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-[#0A101D]/90 border border-slate-700/80 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-black text-white">Campañas Activas de Alto ROAS</span>
                  </div>
                  <span className="text-xs font-mono text-[#20CDFE] font-bold">ADDONS Digital</span>
                </div>
              </div>
            </div>

            {/* Insignia Flotante 1: Visual ROAS */}
            <div className="absolute -top-6 -left-6 bg-[#0A101D]/90 border border-purple-500/50 p-4 rounded-2xl backdrop-blur-xl shadow-2xl animate-float hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold">
                ⚡
              </div>
              <div>
                <p className="text-xs font-black text-white">+380% Conversiones</p>
                <p className="text-[10px] text-slate-400">Meta Ads & TikTok</p>
              </div>
            </div>

            {/* Insignia Flotante 2: Garantía de Entregas */}
            <div className="absolute -bottom-6 -right-6 bg-[#0A101D]/90 border border-emerald-500/50 p-4 rounded-2xl backdrop-blur-xl shadow-2xl animate-float-slow hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                🎯
              </div>
              <div>
                <p className="text-xs font-black text-white">Estrategia 100% Medible</p>
                <p className="text-[10px] text-slate-400">Reportes Semanales</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 3. Marquee Infinito de Marcas ── */}
      <section className="py-8 bg-[#0A101D]/80 border-y border-slate-800/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center mb-4">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
            Marcas & Proyectos Impulsados por ADDONS
          </p>
        </div>
        
        <div className="flex overflow-hidden relative">
          <div className="flex gap-12 items-center whitespace-nowrap animate-marquee">
            {["E-COMMERCE FASHION", "RESTAURANTES & GOURMET", "CLÍNICAS & SALUD", "REAL ESTATE & INMOBILIARIAS", "FINTECH & SOFTWARE", "RETAIL & FRANQUICIAS", "E-COMMERCE FASHION", "RESTAURANTES & GOURMET"].map((brand, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-2 rounded-xl bg-[#15233D]/40 border border-slate-800 text-slate-300 text-xs font-black tracking-wider uppercase shrink-0">
                <Flame size={14} className="text-[#20CDFE]" />
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Servicios de la Agencia con Gráficos & Hover ── */}
      <section id="servicios" className="py-24 max-w-7xl mx-auto px-6">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-[#20CDFE] px-3.5 py-1.5 rounded-full bg-[#20CDFE]/10 border border-[#20CDFE]/30">
            Nuestros Servicios Estratégicos
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-4 tracking-tight">
            Especialistas en Crecimiento de Marcas
          </h2>
          <p className="text-slate-400 text-sm">
            Combinamos creatividad de alto nivel con análisis de datos para aumentar tus ventas y consolidar tu posición en el mercado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Card 1: Publicidad & Meta Ads */}
          <div className="bg-[#0A101D] border border-slate-800 hover:border-[#20CDFE]/60 rounded-3xl p-8 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#20CDFE]/15 group">
            <div className="w-14 h-14 rounded-2xl bg-[#20CDFE]/10 border border-[#20CDFE]/30 flex items-center justify-center text-[#20CDFE] mb-6 group-hover:scale-110 transition-transform">
              <Megaphone size={28} />
            </div>
            <h3 className="text-xl font-black text-white mb-3 flex items-center gap-2">
              Publicidad & Meta Ads <ArrowUpRight size={18} className="text-[#20CDFE] opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Campañas avanzadas en Instagram, Facebook y TikTok Ads orientadas a la captación constante de compradores y leads de alta intención.
            </p>
            <ul className="space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
              <li className="flex items-center gap-2">✓ Configuración de Píxel & API Conversiones</li>
              <li className="flex items-center gap-2">✓ Testeo A/B de Copy & Creativos</li>
              <li className="flex items-center gap-2">✓ Optimización Continua de ROAS</li>
            </ul>
          </div>

          {/* Card 2: Branding e Identidad */}
          <div className="bg-[#0A101D] border border-slate-800 hover:border-purple-500/60 rounded-3xl p-8 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/15 group">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <Palette size={28} />
            </div>
            <h3 className="text-xl font-black text-white mb-3 flex items-center gap-2">
              Branding & Identidad <ArrowUpRight size={18} className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Diseño de identidad visual prémium, manuales de marca, logotipos y presencia estética memorable que impone autoridad inmediata.
            </p>
            <ul className="space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
              <li className="flex items-center gap-2">✓ Logotipos & Manual de Identidad</li>
              <li className="flex items-center gap-2">✓ Paletas Cromáticas & Tipografías</li>
              <li className="flex items-center gap-2">✓ Plantillas de Contenido para Redes</li>
            </ul>
          </div>

          {/* Card 3: Producción Audiovisual */}
          <div className="bg-[#0A101D] border border-slate-800 hover:border-emerald-500/60 rounded-3xl p-8 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/15 group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <Video size={28} />
            </div>
            <h3 className="text-xl font-black text-white mb-3 flex items-center gap-2">
              Producción de Video & Reels <ArrowUpRight size={18} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Producción audiovisual en alta definición, edición dinámica de Reels & TikToks persuasivos y sesiones de fotografía de producto.
            </p>
            <ul className="space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
              <li className="flex items-center gap-2">✓ Guiones Persuasivos & Ganchos</li>
              <li className="flex items-center gap-2">✓ Edición Dinámica con Subtítulos</li>
              <li className="flex items-center gap-2">✓ Fotografía Corporativa de Producto</li>
            </ul>
          </div>

          {/* Card 4: Desarrollo Web & E-Commerce */}
          <div className="bg-[#0A101D] border border-slate-800 hover:border-amber-500/60 rounded-3xl p-8 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/15 group">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
              <Code size={28} />
            </div>
            <h3 className="text-xl font-black text-white mb-3 flex items-center gap-2">
              Desarrollo Web & Landing Pages <ArrowUpRight size={18} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Sitios web ultramodernos, tiendas virtuales y páginas de aterrizaje optimizadas para carga ultrarrápida y alta conversión.
            </p>
            <ul className="space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
              <li className="flex items-center gap-2">✓ Diseño Responsivo Móvil 100%</li>
              <li className="flex items-center gap-2">✓ Integración con Pasarelas de Pago</li>
              <li className="flex items-center gap-2">✓ Optimización SEO en Google</li>
            </ul>
          </div>

          {/* Card 5: Growth Marketing */}
          <div className="bg-[#0A101D] border border-slate-800 hover:border-indigo-500/60 rounded-3xl p-8 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/15 group">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              <Target size={28} />
            </div>
            <h3 className="text-xl font-black text-white mb-3 flex items-center gap-2">
              Estrategia de Growth & Embudos <ArrowUpRight size={18} className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Embudos de venta automatizados, secuencia de correos y automatización de clientes para convertir prospectos fríos en clientes recurrentes.
            </p>
            <ul className="space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
              <li className="flex items-center gap-2">✓ Embudos de Conversión Directa</li>
              <li className="flex items-center gap-2">✓ Automatización de WhatsApp & Email</li>
              <li className="flex items-center gap-2">✓ Estrategia de Fidelización</li>
            </ul>
          </div>

          {/* Card 6: Community Management */}
          <div className="bg-[#0A101D] border border-slate-800 hover:border-rose-500/60 rounded-3xl p-8 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-rose-500/15 group">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6 group-hover:scale-110 transition-transform">
              <Users size={28} />
            </div>
            <h3 className="text-xl font-black text-white mb-3 flex items-center gap-2">
              Social Media & Community <ArrowUpRight size={18} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Administración profesional de redes sociales, planificación editorial mensual, atención de comentarios e interacción orgánica constante.
            </p>
            <ul className="space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
              <li className="flex items-center gap-2">✓ Plan de Contenidos Mensual</li>
              <li className="flex items-center gap-2">✓ Redacción Persuasiva (Copywriting)</li>
              <li className="flex items-center gap-2">✓ Gestión Interactiva de Comunidad</li>
            </ul>
          </div>

        </div>
      </section>

      {/* ── 5. Showcase de Trabajos & Producción Visual ── */}
      <section id="portafolio" className="py-24 bg-[#0A101D]/70 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#20CDFE] px-3.5 py-1.5 rounded-full bg-[#20CDFE]/10 border border-[#20CDFE]/30">
                Portafolio Creativo
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 tracking-tight">
                Casos de Éxito Destacados
              </h2>
            </div>

            {/* Filtros Interactivos por Pestañas */}
            <div className="flex flex-wrap gap-2 bg-[#15233D]/60 p-1.5 rounded-2xl border border-slate-800">
              {[
                { id: "todos", label: "Todos" },
                { id: "meta-ads", label: "Meta Ads" },
                { id: "branding", label: "Branding" },
                { id: "video", label: "Producción Video" },
                { id: "web", label: "Desarrollo Web" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] shadow-lg shadow-[#20CDFE]/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Trabajos Visuales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredPortfolio.map((item) => (
              <div 
                key={item.id} 
                className="group relative rounded-3xl overflow-hidden bg-[#15233D]/60 border border-slate-800 hover:border-[#20CDFE]/50 transition-all shadow-2xl"
              >
                <div className="aspect-video w-full overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={item.img} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07060B] via-[#07060B]/40 to-transparent" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#20CDFE] bg-[#20CDFE]/10 border border-[#20CDFE]/30 px-3 py-1 rounded-full">
                    {item.tag}
                  </span>
                  <h3 className="text-2xl font-black text-white group-hover:text-[#20CDFE] transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 pt-2 border-t border-slate-800">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <TrendingUp size={14} /> {item.result}
                    </span>
                    <span className="text-slate-400 group-hover:text-white flex items-center gap-1">
                      Ver Detalles <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 6. Galería de Producción Audiovisual ── */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 relative">
            <div className="absolute inset-0 bg-purple-600/20 rounded-3xl blur-3xl -z-10" />
            <div className="rounded-3xl overflow-hidden border border-purple-500/40 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/video-showcase.png" 
                alt="Producción Audiovisual Studio" 
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700" 
              />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-black uppercase tracking-widest text-purple-400 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30">
              Producción de Alto Nivel
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Creación de Contenido Audiovisual que Conecta
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              En la era de TikTok y Reels, el video es el rey del contenido. Grabamos y editamos piezas cinematográficas diseñadas para captar la atención en los primeros 3 segundos.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-[#0A101D] border border-slate-800">
                <p className="text-xl font-black text-purple-400">Reels & TikToks</p>
                <p className="text-xs text-slate-400 mt-1">Formato vertical de alta retención</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#0A101D] border border-slate-800">
                <p className="text-xl font-black text-[#20CDFE]">Foto de Producto</p>
                <p className="text-xs text-slate-400 mt-1">Sesiones de estudio profesional</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 7. Preguntas Frecuentes (FAQ) ── */}
      <section id="faq" className="py-24 bg-[#0A101D]/70 border-y border-slate-800/80">
        <div className="max-w-4xl mx-auto px-6">
          
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-[#20CDFE] px-3.5 py-1.5 rounded-full bg-[#20CDFE]/10 border border-[#20CDFE]/30">
              Resolvemos tus Dudas
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 tracking-tight">
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-[#15233D]/60 border border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between font-bold text-sm text-white hover:text-[#20CDFE] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown 
                    size={18} 
                    className={`shrink-0 transition-transform duration-300 ${openFaq === index ? "rotate-180 text-[#20CDFE]" : "text-slate-400"}`} 
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-4 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 8. Contacto & CTA Final ── */}
      <section id="contacto" className="py-24 max-w-5xl mx-auto px-6">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#20CDFE]/20 via-[#1ED1B4]/10 to-purple-600/20 border border-[#20CDFE]/40 p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#20CDFE]/20 rounded-full blur-3xl pointer-events-none -z-10" />
          
          <span className="text-amber-400 text-xs font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-full inline-block mb-4">
            🚀 ¿Listo para escalar tu negocio?
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Llevemos tu Marca al Siguiente Nivel
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
            Contáctanos hoy mismo y agendaremos una reunión estratégica para diseñar el plan publicitario a la medida de tu empresa.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-gradient-to-r from-[#20CDFE] to-[#1ED1B4] text-[#07060B] px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-[#20CDFE]/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <HeartHandshake size={18} />
              <span>Contactar con ADDONS Digital</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. Footer Oficial ── */}
      <footer className="border-t border-slate-800/80 py-12 bg-[#07060B]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          
          {/* Logo Footer */}
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ADDONS" className="h-8 w-auto object-contain" />
            <span className="text-xs text-slate-400 font-medium">| Agencia Digital de Marketing & Estrategia</span>
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
