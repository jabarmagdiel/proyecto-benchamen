"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Lock,
  Menu,
  X,
  ArrowRight,
  TrendingUp,
  Megaphone,
  Palette,
  Video,
  Code,
  Target,
  Users,
  ChevronDown,
  Star,
  Sparkles,
  Zap,
  BarChart3,
  Rocket,
  HeartHandshake,
  ArrowUpRight,
  Play,
  CheckCircle2,
  Globe,
  Award,
} from "lucide-react";

/* ── Tiny hook: run callback when element enters viewport ── */
function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.15) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return inView;
}

/* ── Service card data ── */
const SERVICES = [
  {
    icon: <Megaphone size={26} />,
    color: "cyan",
    title: "Publicidad & Meta Ads",
    desc: "Campañas de alto rendimiento en Instagram, Facebook y TikTok Ads con ROAS comprobado y optimización constante.",
    tags: ["Píxel & API Conversiones", "Testeo A/B", "Optimización ROAS"],
    gradient: "from-[#20CDFE]/20 to-cyan-500/5",
    border: "hover:border-[#20CDFE]/50",
    iconBg: "bg-[#20CDFE]/10 text-[#20CDFE] border-[#20CDFE]/20",
    glow: "hover:shadow-[#20CDFE]/10",
  },
  {
    icon: <Palette size={26} />,
    color: "purple",
    title: "Branding & Identidad",
    desc: "Identidades visuales premium que imponen autoridad inmediata: logo, manual de marca, paletas y tipografías.",
    tags: ["Logo & Manual de Marca", "Paletas Cromáticas", "Plantillas Redes"],
    gradient: "from-violet-500/20 to-purple-500/5",
    border: "hover:border-violet-500/50",
    iconBg: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    glow: "hover:shadow-violet-500/10",
  },
  {
    icon: <Video size={26} />,
    color: "emerald",
    title: "Producción Audiovisual",
    desc: "Reels y TikToks cinematográficos diseñados para captar atención en los primeros 3 segundos. Cámara propia.",
    tags: ["Guiones & Ganchos", "Edición Dinámica", "Foto de Producto"],
    gradient: "from-emerald-500/20 to-teal-500/5",
    border: "hover:border-emerald-500/50",
    iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    glow: "hover:shadow-emerald-500/10",
  },
  {
    icon: <Code size={26} />,
    color: "amber",
    title: "Desarrollo Web & Apps",
    desc: "Sitios web y tiendas virtuales de alta conversión, optimizados para SEO, velocidad y UX impecable.",
    tags: ["Diseño Responsivo", "Pasarelas de Pago", "SEO en Google"],
    gradient: "from-amber-500/20 to-orange-500/5",
    border: "hover:border-amber-500/50",
    iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    glow: "hover:shadow-amber-500/10",
  },
  {
    icon: <Target size={26} />,
    color: "indigo",
    title: "Estrategia & Growth",
    desc: "Embudos de venta automatizados, email marketing y secuencias de WhatsApp para escalar clientes.",
    tags: ["Embudos de Conversión", "WhatsApp & Email", "Fidelización"],
    gradient: "from-indigo-500/20 to-blue-500/5",
    border: "hover:border-indigo-500/50",
    iconBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    glow: "hover:shadow-indigo-500/10",
  },
  {
    icon: <Users size={26} />,
    color: "rose",
    title: "Social Media & Community",
    desc: "Gestión de redes sociales con plan editorial mensual, copywriting persuasivo e interacción orgánica.",
    tags: ["Plan de Contenidos", "Copywriting", "Gestión Comunidad"],
    gradient: "from-rose-500/20 to-pink-500/5",
    border: "hover:border-rose-500/50",
    iconBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    glow: "hover:shadow-rose-500/10",
  },
];

/* ── Stats data ── */
const STATS = [
  { value: "4.9x", label: "ROAS Promedio", sub: "Meta Ads & TikTok Ads", color: "text-[#20CDFE]" },
  { value: "+500K", label: "Alcance Mensual", sub: "En todas las plataformas", color: "text-violet-400" },
  { value: "+50", label: "Marcas Escaladas", sub: "Resultados comprobados", color: "text-emerald-400" },
  { value: "99%", label: "Retención", sub: "Clientes satisfechos", color: "text-amber-400" },
];

/* ── Testimonials ── */
const TESTIMONIALS = [
  {
    name: "Valentina M.",
    role: "Fundadora · E-Commerce de Moda",
    quote: "ADDONS triplicó nuestras ventas online en menos de 60 días. El equipo sabe exactamente qué hacer con los anuncios de Meta.",
    stars: 5,
    avatar: "VM",
    color: "bg-violet-500",
  },
  {
    name: "Carlos R.",
    role: "Gerente · Cadena de Restaurantes",
    quote: "El contenido audiovisual que produjeron fue de otro nivel. Mis publicaciones pasaron de 500 a 80,000 reproducciones.",
    stars: 5,
    avatar: "CR",
    color: "bg-[#20CDFE]",
  },
  {
    name: "Sofía T.",
    role: "CEO · Empresa de Servicios",
    quote: "El branding que nos diseñaron nos hizo ver como una empresa de primer nivel internacional. 100% recomendado.",
    stars: 5,
    avatar: "ST",
    color: "bg-emerald-500",
  },
];

/* ── FAQ data ── */
const FAQS = [
  {
    q: "¿Cómo ayuda ADDONS a incrementar las ventas de mi empresa?",
    a: "Diseñamos un plan integral personalizado que combina pauta publicitaria optimizada en Meta Ads/TikTok Ads, branding de alto nivel y embudos de conversión probados para generar clientes potenciales día a día.",
  },
  {
    q: "¿En cuánto tiempo se empiezan a ver resultados?",
    a: "Las campañas de pauta digital comienzan a generar contactos desde la primera semana de activación. Realizamos optimizaciones constantes de ROAS para escalar la inversión progresivamente semana a semana.",
  },
  {
    q: "¿Incluyen producción de video y contenido fotográfico?",
    a: "¡Sí! Contamos con equipo especializado en producción audiovisual, edición para Reels/TikToks, fotografía corporativa de producto y diseño gráfico publicitario de alta conversión.",
  },
  {
    q: "¿Cómo accedo a reportes y avances de mi proyecto?",
    a: "Nuestros clientes y gerentes cuentan con asesoría estratégica constante y reportes en tiempo real del rendimiento de sus campañas y proyectos.",
  },
  {
    q: "¿Trabajan con empresas fuera del país?",
    a: "Sí. Trabajamos de forma remota con marcas de toda Latinoamérica y España. Nuestras herramientas digitales y reuniones por videollamada permiten una colaboración perfecta sin importar la ubicación.",
  },
];

/* ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  const heroVisible = useInView(heroRef, 0.1);
  const statsVisible = useInView(statsRef, 0.2);
  const servicesVisible = useInView(servicesRef, 0.1);
  const testimonialsVisible = useInView(testimonialsRef, 0.1);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#050509] text-white selection:bg-[#20CDFE] selection:text-[#050509] overflow-x-hidden">

      {/* ═══ AMBIENT BACKGROUND ═══ */}
      <div className="fixed inset-0 pointer-events-none -z-20">
        {/* Dot grid */}
        <div className="absolute inset-0 bg-dots opacity-100" />
        {/* Glow orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-[#20CDFE]/8 rounded-full blur-[130px] animate-glow" />
        <div className="absolute top-[30%] right-[-15%] w-[600px] h-[600px] bg-violet-600/8 rounded-full blur-[130px] animate-glow delay-300" />
        <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[500px] bg-emerald-600/6 rounded-full blur-[120px]" />
      </div>

      {/* ═══ 1 · NAVBAR ═══ */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#050509]/95 backdrop-blur-2xl shadow-[0_1px_0_rgba(255,255,255,0.06)]" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="ADDONS"
              className="h-9 w-auto object-contain drop-shadow-[0_0_18px_rgba(32,205,254,0.45)] group-hover:drop-shadow-[0_0_28px_rgba(32,205,254,0.7)] transition-all duration-300"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: "#servicios", label: "Servicios" },
              { href: "#resultados", label: "Resultados" },
              { href: "#testimonios", label: "Clientes" },
              { href: "#faq", label: "FAQ" },
              { href: "#contacto", label: "Contacto" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative px-4 py-2 text-[13px] font-medium text-slate-400 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5 group"
              >
                {item.label}
                <span className="absolute inset-x-4 bottom-1 h-px bg-[#20CDFE] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full" />
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <a
              href="#contacto"
              className="btn-shimmer text-[#050509] px-5 py-2 rounded-xl text-[13px] font-bold shadow-lg hover:scale-[1.03] active:scale-[0.97] transition-transform duration-150"
            >
              Contáctanos
            </a>
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
              aria-label="Menú"
            >
              {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileNavOpen && (
          <div className="md:hidden glass border-t border-white/6 px-5 py-5 space-y-1 animate-fade-in">
            {[
              { href: "#servicios", label: "Servicios" },
              { href: "#resultados", label: "Resultados" },
              { href: "#testimonios", label: "Clientes" },
              { href: "#faq", label: "Preguntas Frecuentes" },
              { href: "#contacto", label: "Contacto" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-2 py-3 px-3 rounded-xl text-[14px] font-medium text-slate-300 hover:text-white hover:bg-white/6 transition-all"
              >
                <ArrowRight size={14} className="text-[#20CDFE]" />
                {item.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ═══ 2 · HERO ═══ */}
      <section id="inicio" className="relative pt-20 pb-28 md:pt-28 md:pb-40 max-w-7xl mx-auto px-5 sm:px-8">
        <div ref={heroRef} className="text-center">

          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full glass glow-border-cyan text-[12px] font-semibold text-[#20CDFE] mb-8 transition-all duration-700 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#20CDFE] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#20CDFE]" />
            </span>
            Agencia de Marketing Digital & Desarrollo · Santo Domingo, RD
          </div>

          {/* Headline */}
          <h1 className={`text-[clamp(2.4rem,7vw,5.5rem)] font-black tracking-[-0.03em] leading-[1.05] mb-6 transition-all duration-700 delay-100 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            Llevamos tu marca al{" "}
            <span className="relative inline-block">
              <span className="text-gradient">siguiente nivel</span>
              {/* underline decoration */}
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" preserveAspectRatio="none">
                <path d="M0,8 Q75,0 150,8 Q225,16 300,8" stroke="url(#grad)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#20CDFE"/>
                    <stop offset="50%" stopColor="#1ED1B4"/>
                    <stop offset="100%" stopColor="#8B5CF6"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>{" "}
            <br className="hidden sm:block" />
            digital.
          </h1>

          {/* Sub */}
          <p className={`text-[clamp(1rem,2.2vw,1.2rem)] text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10 transition-all duration-700 delay-200 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            Diseñamos estrategias de Meta Ads de alto ROAS, identidades de marca premium,
            contenido audiovisual viral y sitios web que convierten visitas en clientes.
          </p>

          {/* CTAs */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <a
              href="#contacto"
              className="group btn-shimmer text-[#050509] px-8 py-4 rounded-2xl font-bold text-[15px] shadow-2xl shadow-[#20CDFE]/20 hover:scale-[1.03] active:scale-[0.97] transition-transform duration-150 flex items-center gap-2.5 w-full sm:w-auto justify-center"
            >
              <Rocket size={18} />
              Agendar Consulta Gratis
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#resultados"
              className="group glass-bright text-white px-8 py-4 rounded-2xl font-semibold text-[15px] hover:bg-white/8 transition-all flex items-center gap-2.5 w-full sm:w-auto justify-center"
            >
              <Play size={16} className="text-[#20CDFE]" />
              Ver Resultados
            </a>
          </div>

          {/* Trust indicators */}
          <div className={`flex flex-wrap items-center justify-center gap-5 mt-12 text-[12px] text-slate-500 transition-all duration-700 delay-400 ${heroVisible ? "opacity-100" : "opacity-0"}`}>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" /> Sin contrato permanente
            </span>
            <span className="w-px h-4 bg-slate-800 hidden sm:block" />
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" /> Resultados desde la semana 1
            </span>
            <span className="w-px h-4 bg-slate-800 hidden sm:block" />
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" /> +50 marcas escaladas
            </span>
          </div>
        </div>

        {/* Hero visual: floating dashboard mockup */}
        <div className={`relative mt-20 max-w-4xl mx-auto transition-all duration-1000 delay-300 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>

          {/* Main dashboard card */}
          <div className="relative glass glow-border-cyan rounded-3xl overflow-hidden shadow-2xl shadow-black/60 animate-float">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-marketing.png"
              alt="ADDONS Marketing Analytics Dashboard"
              className="w-full h-auto object-cover"
            />
            {/* gradient overlay at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050509]/60 via-transparent to-transparent" />

            {/* Live badge */}
            <div className="absolute top-5 left-5 flex items-center gap-2 glass px-3 py-1.5 rounded-full text-[11px] font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping-slow" />
              LIVE · Campañas Activas
            </div>
          </div>

          {/* Floating card 1 */}
          <div className="absolute -top-6 -left-8 hidden lg:flex items-center gap-3 glass glow-border-purple rounded-2xl px-4 py-3 shadow-2xl animate-float-slow">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 text-sm font-bold shrink-0">⚡</div>
            <div>
              <p className="text-[11px] font-black text-white leading-tight">+380% Conversiones</p>
              <p className="text-[10px] text-slate-400">Meta Ads · E-commerce</p>
            </div>
          </div>

          {/* Floating card 2 */}
          <div className="absolute -bottom-6 -right-8 hidden lg:flex items-center gap-3 glass glow-border-cyan rounded-2xl px-4 py-3 shadow-2xl animate-float delay-300">
            <div className="w-9 h-9 rounded-xl bg-[#20CDFE]/15 border border-[#20CDFE]/30 flex items-center justify-center text-[#20CDFE] text-sm font-bold shrink-0">🎯</div>
            <div>
              <p className="text-[11px] font-black text-white leading-tight">Estrategia 100% Medible</p>
              <p className="text-[10px] text-slate-400">Reportes semanales</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3 · MARQUEE CLIENTS ═══ */}
      <div className="py-7 overflow-hidden border-y border-white/5 bg-white/[0.015]">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-5">
          Sectores que hemos escalado
        </p>
        <div className="flex overflow-hidden">
          <div className="animate-marquee gap-10 items-center">
            {[
              "E-Commerce & Fashion",
              "Restaurantes & Gourmet",
              "Clínicas & Salud",
              "Real Estate & Inmobiliarias",
              "Fintech & Software",
              "Retail & Franquicias",
              "Turismo & Hoteles",
              "Educación Online",
              "E-Commerce & Fashion",
              "Restaurantes & Gourmet",
              "Clínicas & Salud",
              "Real Estate & Inmobiliarias",
              "Fintech & Software",
              "Retail & Franquicias",
              "Turismo & Hoteles",
              "Educación Online",
            ].map((brand, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2.5 shrink-0 mx-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest"
              >
                <span className="w-1 h-1 rounded-full bg-[#20CDFE]/60" />
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ 4 · STATS ═══ */}
      <section id="resultados" className="py-24 max-w-7xl mx-auto px-5 sm:px-8">
        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className={`relative glass-bright rounded-3xl p-6 sm:p-8 text-center overflow-hidden group hover:bg-white/6 transition-all duration-300 ${statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* background accent */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-white/4 to-transparent rounded-3xl" />
              <p className={`stat-number text-4xl sm:text-5xl ${stat.color} mb-2`}>{stat.value}</p>
              <p className="text-[13px] font-bold text-white mb-1">{stat.label}</p>
              <p className="text-[11px] text-slate-500">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 5 · SERVICES ═══ */}
      <section id="servicios" className="py-24 bg-gradient-to-b from-transparent via-white/[0.015] to-transparent">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">

          {/* Section header */}
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-[#20CDFE] bg-[#20CDFE]/8 border border-[#20CDFE]/20 px-4 py-1.5 rounded-full mb-5">
              Servicios Estratégicos
            </span>
            <h2 className="text-[clamp(1.8rem,4vw,3.2rem)] font-black tracking-tight text-white mb-4">
              Todo lo que necesitas para crecer
            </h2>
            <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">
              Combinamos creatividad, datos y tecnología para escalar marcas de cualquier tamaño.
            </p>
          </div>

          <div
            ref={servicesRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {SERVICES.map((svc, i) => (
              <div
                key={i}
                className={`group relative bg-[#0D0F1A] border border-white/6 ${svc.border} ${svc.glow} rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl overflow-hidden ${servicesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                {/* Gradient bg on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${svc.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`} />

                <div className={`relative w-12 h-12 rounded-2xl border ${svc.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  {svc.icon}
                </div>

                <h3 className="relative text-[17px] font-bold text-white mb-2.5 flex items-center gap-2">
                  {svc.title}
                  <ArrowUpRight size={15} className="text-slate-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all opacity-0 group-hover:opacity-100" />
                </h3>

                <p className="relative text-[13px] text-slate-400 leading-relaxed mb-5">{svc.desc}</p>

                <ul className="relative space-y-1.5 border-t border-white/5 pt-4">
                  {svc.tags.map((tag, j) => (
                    <li key={j} className="flex items-center gap-2 text-[12px] text-slate-400">
                      <CheckCircle2 size={12} className="text-[#20CDFE] shrink-0" />
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 6 · VIDEO PRODUCTION FEATURE ═══ */}
      <section className="py-24 max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          {/* Visual */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-violet-600/15 rounded-[2.5rem] blur-3xl -z-10 animate-glow" />
            <div className="relative rounded-[2rem] overflow-hidden glass glow-border-purple shadow-2xl group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/video-showcase.png"
                alt="Estudio de Producción Audiovisual ADDONS"
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050509]/50 to-transparent" />

              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 rounded-full glass-bright border border-white/20 flex items-center justify-center shadow-2xl">
                  <Play size={22} className="text-white fill-white ml-1" />
                </div>
              </div>
            </div>

            {/* stat badge */}
            <div className="absolute -bottom-5 -left-5 hidden sm:flex items-center gap-3 glass glow-border-cyan px-4 py-3 rounded-2xl shadow-2xl animate-float-slow">
              <BarChart3 size={20} className="text-[#20CDFE]" />
              <div>
                <p className="text-[11px] font-black text-white">+1.2M Reproducciones</p>
                <p className="text-[10px] text-slate-400">en 30 días · TikTok & Reels</p>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="order-1 lg:order-2 space-y-6">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-violet-400 bg-violet-500/8 border border-violet-500/20 px-4 py-1.5 rounded-full">
              Producción Audiovisual
            </span>
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-black tracking-tight text-white leading-tight">
              Contenido que para el dedo y convierte
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              En la era de TikTok y Reels, 3 segundos deciden si ganás o perdés un cliente. 
              Producimos piezas cinematográficas diseñadas para detener el scroll y generar acción inmediata.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { label: "Reels & TikToks", desc: "Formato vertical viral", color: "border-violet-500/30 text-violet-400" },
                { label: "Foto de Producto", desc: "Estudio profesional", color: "border-[#20CDFE]/30 text-[#20CDFE]" },
                { label: "Anuncios de Video", desc: "Creativos de conversión", color: "border-emerald-500/30 text-emerald-400" },
                { label: "Contenido UGC", desc: "Auténtico y efectivo", color: "border-amber-500/30 text-amber-400" },
              ].map((item, i) => (
                <div key={i} className={`rounded-2xl bg-white/3 border ${item.color} p-4 hover:bg-white/5 transition-colors`}>
                  <p className={`text-[14px] font-bold mb-1 ${item.color.split(" ")[1]}`}>{item.label}</p>
                  <p className="text-[12px] text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ═══ 7 · TESTIMONIALS ═══ */}
      <section id="testimonios" className="py-24 bg-gradient-to-b from-transparent via-white/[0.018] to-transparent">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">

          <div ref={testimonialsRef} className="text-center mb-16">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-400 bg-emerald-500/8 border border-emerald-500/20 px-4 py-1.5 rounded-full mb-5">
              Lo que dicen nuestros clientes
            </span>
            <h2 className="text-[clamp(1.8rem,4vw,3.2rem)] font-black tracking-tight text-white">
              Resultados que hablan por sí solos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className={`relative glass-bright rounded-3xl p-7 border border-white/6 hover:border-white/12 transition-all duration-300 hover:-translate-y-1 group ${testimonialsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {Array(t.stars).fill(0).map((_, j) => (
                    <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-[14px] text-slate-300 leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 border-t border-white/6 pt-5">
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-[#050509] text-[12px] font-black shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-white">{t.name}</p>
                    <p className="text-[11px] text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 8 · FAQ ═══ */}
      <section id="faq" className="py-24 max-w-3xl mx-auto px-5 sm:px-8">

        <div className="text-center mb-14">
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-[#20CDFE] bg-[#20CDFE]/8 border border-[#20CDFE]/20 px-4 py-1.5 rounded-full mb-5">
            Preguntas Frecuentes
          </span>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-black tracking-tight text-white">
            Resolvemos tus dudas
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className={`glass-bright border border-white/6 rounded-2xl overflow-hidden transition-all duration-200 ${openFaq === i ? "border-[#20CDFE]/25" : "hover:border-white/10"}`}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-[14px] font-semibold text-white leading-snug">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-slate-400 transition-transform duration-300 ${openFaq === i ? "rotate-180 text-[#20CDFE]" : ""}`}
                />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-6 text-[13px] text-slate-400 leading-relaxed border-t border-white/5 pt-4 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 9 · CTA FINAL ═══ */}
      <section id="contacto" className="py-20 px-5 sm:px-8 max-w-7xl mx-auto mb-16">
        <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-[#0D1225] via-[#0A1020] to-[#0D0F1A] border border-white/8 p-10 sm:p-16 text-center shadow-2xl">

          {/* Ambient glows inside CTA */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#20CDFE]/12 rounded-full blur-3xl -z-0" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[250px] bg-violet-600/12 rounded-full blur-3xl -z-0" />

          {/* Grid overlay */}
          <div className="absolute inset-0 bg-grid opacity-60 -z-0" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400 bg-amber-500/8 border border-amber-500/20 px-4 py-1.5 rounded-full mb-6">
              <Sparkles size={12} /> ¿Listo para escalar?
            </span>
            <h2 className="text-[clamp(1.8rem,4.5vw,4rem)] font-black tracking-tight text-white mb-4">
              Empieza hoy. Crece mañana.
            </h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto mb-10 leading-relaxed">
              Agenda tu consulta estratégica gratuita y descubre cómo llevar tu marca 
              al siguiente nivel digital con ADDONS.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:hola@addonsoficial.com"
                className="btn-shimmer text-[#050509] px-9 py-4 rounded-2xl font-bold text-[15px] shadow-2xl shadow-[#20CDFE]/25 hover:scale-[1.03] active:scale-[0.97] transition-transform duration-150 flex items-center gap-2.5 w-full sm:w-auto justify-center"
              >
                <HeartHandshake size={19} />
                Hablar con un Estratega
              </a>
            </div>

            {/* mini trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5"><Award size={12} className="text-amber-400" /> +50 marcas exitosas</span>
              <span className="flex items-center gap-1.5"><Globe size={12} className="text-[#20CDFE]" /> Toda Latinoamérica</span>
              <span className="flex items-center gap-1.5"><Zap size={12} className="text-violet-400" /> Resultados desde semana 1</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 10 · FOOTER ═══ */}
      <footer className="border-t border-white/5 bg-[#050509]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-center">

            {/* Logo + tagline */}
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="ADDONS" className="h-8 w-auto object-contain opacity-90" />
              <div className="text-[11px] text-slate-600 leading-tight">
                Agencia de Marketing<br />Digital & Desarrollo
              </div>
            </div>

            {/* Copyright */}
            <p className="text-[11px] text-slate-600 text-center">
              © {new Date().getFullYear()} ADDONS Official · Todos los derechos reservados.
            </p>

            {/* Links */}
            <div className="flex items-center justify-end gap-6 text-[12px] text-slate-500 font-medium">
              <Link href="/terminos" className="hover:text-white transition-colors">Términos</Link>
              <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
