"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Monitor,
  Users,
  MessageSquare,
  ArrowRight,
  AlertCircle,
  TriangleAlert,
  CircleAlert,
  MessageCircleOff,
} from "lucide-react";

function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      requestAnimationFrame(() => setInView(true));
      return;
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          requestAnimationFrame(() => {
            setInView(true);
            obs.unobserve(e.target);
          });
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={`reveal ${inView ? "in-view" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* Thin gradient divider strip between sections */
function SectionDivider() {
  return (
    <div aria-hidden="true" className="bg-white">
      <hr className="divider-gradient" />
    </div>
  );
}

const NAV_ITEMS = [
  { label: "Beranda", href: "#beranda" },
  { label: "Tentang Kami", href: "#tentang" },
  { label: "Layanan", href: "#layanan" },
  { label: "Cara Kerja", href: "#alur" },
];

const PROBLEMS = [
  { icon: AlertCircle, text: "Pasien sulit mengetahui apakah gerakan latihan mereka benar tanpa pengawasan langsung di klinik" },
  { icon: TriangleAlert, text: "Dokter kesulitan memantau progres pasien di luar jam sesi klinik" },
  { icon: CircleAlert, text: "Kurangnya feedback objektif dan terukur selama latihan mandiri di rumah" },
  { icon: MessageCircleOff, text: "Tidak adanya saluran komunikasi terstruktur antara sesi rehabilitasi" },
];

const FEATURES = [
  {
    icon: Activity,
    title: "Live Session dengan AI Motion Tracking",
    description: "Pantau gerakan latihan real-time via kamera. AI mendeteksi sudut sendi, menghitung repetisi, dan memberikan feedback instan apakah gerakan sudah benar.",
    box: "bg-[#D9EEE3]", iconColor: "text-[#0A5C43]",
  },
  {
    icon: Monitor,
    title: "Dashboard Progres Pasien",
    description: "Visualisasi akumulatif total repetisi, form score, dan status pemulihan. Dokter bisa melihat tren mingguan dan weekly AI digest secara otomatis.",
    box: "bg-[#E8EDF4]", iconColor: "text-[#0F1B2E]",
  },
  {
    icon: Users,
    title: "Session Analytics Klinis",
    description: "Analisis mendalam per sesi: form accuracy, rep quality distribution, stability coefficient, fatigue resistance, dan AI clinical insight.",
    box: "bg-[#FBF1DE]", iconColor: "text-[#B7791F]",
  },
  {
    icon: MessageSquare,
    title: "Chat Dokter-Pasien Real-time",
    description: "Komunikasi langsung antara dokter dan pasien untuk konsultasi, pengingat sesi, dan klarifikasi instruksi latihan tanpa keluar aplikasi.",
    box: "bg-[#E7F1FB]", iconColor: "text-[#2563A8]",
  },
];

const STEPS = [
  { n: "01", title: "Pasien Ajukan Keluhan", desc: "Pasien login, pilih dokter, dan deskripsikan keluhan. Dokter menerima notifikasi di dashboard." },
  { n: "02", title: "Dokter Assign Exercise", desc: "Dokter pilih jenis latihan (Squat, Knee Extension, dll), set target repetisi, & berikan catatan klinis." },
  { n: "03", title: "Live Session & Monitoring", desc: "Pasien jalankan sesi di kamera. AI track sudut sendi, hitung rep, skor form. Dokter pantau real-time." },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0F1B2E] selection:bg-[#0F1B2E] selection:text-white">

      {/* ═══════════════════════════════════════════════════
          HEADER — formal navigation + Masuk & Daftar
      ═══════════════════════════════════════════════════ */}
      <header className={`sticky top-0 z-50 border-b transition-colors duration-200 ${scrolled ? "bg-white border-[#E2E2E2] shadow-sm" : "bg-white border-transparent"}`}>
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8 h-[60px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded bg-[#0F1B2E] flex items-center justify-center">
              <Activity className="text-white" style={{ width: 16, height: 16 }} />
            </span>
            <span className="text-[15px] font-bold tracking-tight">PhysioV</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <a key={item.label} href={item.href} className="text-[13px] font-medium text-[#4A5568] hover:text-[#0F1B2E] transition-colors">{item.label}</a>
            ))}
            <div className="flex items-center gap-2.5">
              <Link href="/auth?mode=register" className="inline-flex items-center justify-center h-8 px-4 rounded border border-[#0F1B2E]/25 text-[#0F1B2E] text-[13px] font-medium hover:border-[#0A5C43]/50 hover:bg-[#D9EEE3] hover:text-[#0A5C43] transition-colors">Daftar</Link>
              <Link href="/auth?mode=login" className="btn-shadow-navy inline-flex items-center justify-center h-8 px-4 rounded bg-[#0F1B2E] text-white text-[13px] font-medium hover:bg-[#1A2B4A] transition-colors">Masuk</Link>
            </div>
          </nav>
          <div className="md:hidden flex items-center gap-2">
            <Link href="/auth?mode=register" className="inline-flex items-center justify-center h-8 px-3 rounded border border-[#0F1B2E]/25 text-[#0F1B2E] text-[13px] font-medium">Daftar</Link>
            <Link href="/auth?mode=login" className="btn-shadow-navy inline-flex items-center justify-center h-8 px-3 rounded bg-[#0F1B2E] text-white text-[13px] font-medium">Masuk</Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════
          HERO — centered + subtle motion-line ornaments
      ═══════════════════════════════════════════════════ */}
      <section id="beranda" className="relative overflow-hidden bg-white">
        {/* Decorative: large faint circle outline, top-right */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-28 -right-28 w-[380px] h-[380px] rounded-full border-[1.5px] border-[#0A5C43]/15" />
        <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-16 w-[260px] h-[260px] rounded-full border border-[#0E9A6B]/10" />
        {/* Decorative: faint pulse watermark, bottom-left */}
        <Activity aria-hidden="true" className="pointer-events-none absolute -bottom-8 -left-8 w-56 h-56 text-[#0F1B2E]/[0.04]" strokeWidth={1} />

        <div className="relative max-w-[1100px] mx-auto px-6 lg:px-8 py-20 sm:py-24 text-center">
          <Reveal>
            <span className="badge-pill">Platform Rehabilitasi Fisik</span>
          </Reveal>
          <Reveal delay={50}>
            <div className="relative inline-block mt-4">
              {/* Decorative: flowing joint-motion curves behind title */}
              <svg aria-hidden="true" className="ornament-drift pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] sm:w-[560px] h-[160px]" viewBox="0 0 560 160" fill="none" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="sageFlow1" x1="0" y1="0" x2="560" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#0A5C43" stopOpacity="0" />
                    <stop offset="0.35" stopColor="#0A5C43" stopOpacity="0.32" />
                    <stop offset="0.65" stopColor="#0E9A6B" stopOpacity="0.32" />
                    <stop offset="1" stopColor="#0E9A6B" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="sageFlow2" x1="0" y1="0" x2="560" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#0A5C43" stopOpacity="0" />
                    <stop offset="0.5" stopColor="#0E9A6B" stopOpacity="0.2" />
                    <stop offset="1" stopColor="#43A87F" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M20 110 C 150 40, 260 150, 400 80 S 510 90, 540 70" stroke="url(#sageFlow1)" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M20 125 C 160 60, 270 160, 410 95 S 505 105, 540 88" stroke="url(#sageFlow2)" strokeWidth="1.25" strokeLinecap="round" />
                <circle cx="400" cy="80" r="3.5" fill="#0A5C43" fillOpacity="0.4" />
                <circle cx="272" cy="108" r="2.5" fill="#0E9A6B" fillOpacity="0.3" />
                <circle cx="150" cy="78" r="2.5" fill="#43A87F" fillOpacity="0.35" />
              </svg>
              <h1 className="relative text-[40px] sm:text-[48px] lg:text-[52px] font-bold tracking-[-0.02em] leading-[1.1] text-[#0F1B2E]">
                PhysioV
              </h1>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-5 text-[17px] leading-7 text-[#4A5568] max-w-[560px] mx-auto">
              Solusi rehabilitasi fisik berbasis AI untuk pemantauan dan analisis gerakan real-time antara dokter dan pasien.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <Link href="/auth?mode=register" className="btn-shadow-sage inline-flex items-center justify-center gap-2 h-[42px] px-6 rounded bg-[#0F1B2E] text-white text-[14px] font-medium hover:bg-[#1A2B4A] transition-colors">
                Daftar Sekarang <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/auth?mode=login" className="inline-flex items-center justify-center gap-2 h-[42px] px-6 rounded border border-[#0F1B2E]/25 text-[#0F1B2E] text-[14px] font-medium hover:border-[#0A5C43]/50 hover:bg-[#D9EEE3] hover:text-[#0A5C43] transition-colors">
                Masuk
              </Link>
            </div>
            <p className="mt-4 text-[12px] text-[#8A94A6]">Sudah punya akun? Langsung <Link href="/auth?mode=login" className="font-medium text-[#0F1B2E] underline underline-offset-2 hover:text-[#0E9A6B]">masuk di sini</Link>.</p>
          </Reveal>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════════
          TENTANG KAMI / LATAR BELAKANG — warm cream bg
      ═══════════════════════════════════════════════════ */}
      <section id="tentang" className="relative overflow-hidden bg-[#FAF6F0]">
        {/* Decorative: joint-tracking line art, top-right corner */}
        <svg aria-hidden="true" className="pointer-events-none absolute top-6 right-4 sm:right-10 hidden sm:block w-[220px] h-[140px] opacity-60" viewBox="0 0 220 140" fill="none">
          <defs>
            <linearGradient id="tentangFlow" x1="0" y1="0" x2="220" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#0A5C43" stopOpacity="0" />
              <stop offset="0.55" stopColor="#0E9A6B" stopOpacity="0.28" />
              <stop offset="1" stopColor="#43A87F" stopOpacity="0.32" />
            </linearGradient>
          </defs>
          <path d="M10 110 C 60 60, 90 120, 130 70 S 190 60, 210 40" stroke="url(#tentangFlow)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="130" cy="70" r="3" fill="#0A5C43" fillOpacity="0.35" />
          <circle cx="130" cy="70" r="7" stroke="#0E9A6B" strokeOpacity="0.22" strokeWidth="1" />
          <circle cx="66" cy="84" r="2.5" fill="#0E9A6B" fillOpacity="0.28" />
          <circle cx="188" cy="55" r="2.5" fill="#43A87F" fillOpacity="0.3" />
        </svg>

        <div className="relative max-w-[1100px] mx-auto px-6 lg:px-8 py-20 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-4">
              <Reveal>
                <span className="badge-pill mb-3">Tentang Kami</span>
                <h2 className="text-[28px] sm:text-[32px] font-bold tracking-[-0.02em] leading-tight">Latar Belakang</h2>
                <span className="accent-line" />
              </Reveal>
            </div>
            <div className="lg:col-span-8">
              <Reveal delay={60}>
                <p className="text-[16px] leading-7 text-[#4A5568] mb-6">
                  Rehabilitasi fisik yang efektif memerlukan pengawasan berkelanjutan — tidak hanya saat pasien berada di klinik. Namun dalam praktiknya, banyak kendala yang menghambat proses pemulihan optimal.
                </p>
              </Reveal>
              <div className="space-y-5">
                {PROBLEMS.map((p, i) => (
                  <Reveal key={i} delay={80 + i * 60}>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded bg-white shadow-formal border border-[#EDEDED] flex items-center justify-center mt-0.5">
                        <p.icon className="w-4 h-4 text-[#0F1B2E] stroke-[1.8]" />
                      </div>
                      <p className="text-[15px] leading-6 text-[#4A5568]">{p.text}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════════
          LAYANAN / FITUR — subtle white → pale sage gradient
      ═══════════════════════════════════════════════════ */}
      <section id="layanan" className="relative overflow-hidden bg-gradient-to-b from-white via-[#F2F9F5] to-[#DCEFE5]">
        {/* Decorative: faint body-motion watermark (desktop only, behind content) */}
        <Activity aria-hidden="true" className="pointer-events-none absolute top-10 right-6 hidden sm:block w-44 h-44 text-[#0A5C43]/[0.05]" strokeWidth={1} />

        <div className="relative max-w-[1100px] mx-auto px-6 lg:px-8 py-20 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-4">
              <Reveal>
                <span className="badge-pill mb-3">Layanan</span>
                <h2 className="text-[28px] sm:text-[32px] font-bold tracking-[-0.02em] leading-tight">Fitur Utama</h2>
                <span className="accent-line" />
              </Reveal>
            </div>
            <div className="lg:col-span-8">
              <div className="divide-y divide-[#D8E2DC]">
                {FEATURES.map((f, i) => (
                  <Reveal key={i} delay={i * 70}>
                    <div className="flex items-start gap-5 py-6 first:pt-0 last:pb-0">
                      <div className={`flex-shrink-0 w-10 h-10 rounded ${f.box} flex items-center justify-center`}>
                        <f.icon className={`w-5 h-5 ${f.iconColor} stroke-[1.6]`} />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold tracking-tight text-[#0F1B2E]">{f.title}</h3>
                        <p className="mt-1 text-[14px] leading-6 text-[#4A5568]">{f.description}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════════
          ALUR / CARA KERJA — sage connector line + dots
      ═══════════════════════════════════════════════════ */}
      <section id="alur" className="bg-[#F4F6F8]">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-20 sm:py-24">
          <Reveal>
            <div className="text-center mb-14">
              <span className="badge-pill mb-3">Alur</span>
              <h2 className="text-[28px] sm:text-[32px] font-bold tracking-[-0.02em] leading-tight">Cara Kerja</h2>
              <span className="accent-line mx-auto" />
            </div>
          </Reveal>

          <div className="relative">
            {/* Vertical connector — sage gradient, slightly thicker */}
            <div aria-hidden="true" className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] rounded bg-gradient-to-b from-[#0A5C43] via-[#0E9A6B]/50 to-[#43A87F]/15" />

            <div className="space-y-10 md:space-y-0">
              {STEPS.map((s, i) => {
                const isEven = i % 2 === 0;
                return (
                  <Reveal key={i} delay={i * 80}>
                    <div className={`relative md:grid md:grid-cols-2 md:gap-16 md:items-center ${i < STEPS.length - 1 ? "md:pb-16" : ""}`}>
                      {/* Connector dot — sage with soft ring */}
                      <div aria-hidden="true" className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#0A5C43] border-2 border-white ring-4 ring-[#0E9A6B]/20 z-10" />

                      {/* Content — alternating sides */}
                      <div className={`${isEven ? "md:text-right md:order-1" : "md:order-2"}`}>
                        <span className="text-[32px] font-bold text-[#0F1B2E] tracking-tight">{s.n}</span>
                        <span aria-hidden="true" className={`block w-8 h-[2px] rounded bg-gradient-to-r from-[#0A5C43] via-[#0E9A6B]/70 to-[#43A87F]/30 mt-1 ${isEven ? "md:ml-auto" : ""}`} />
                        <h3 className="mt-2 text-[16px] font-semibold text-[#0F1B2E]">{s.title}</h3>
                        <p className="mt-2 text-[14px] leading-6 text-[#4A5568]">{s.desc}</p>
                      </div>
                      <div className={`${isEven ? "md:order-2" : "md:text-right md:order-1"}`} />
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CTA — solid navy (unchanged structure)
      ═══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#0F1B2E]">
        {/* Decorative: faint circle outlines on navy */}
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-32 w-[320px] h-[320px] rounded-full border-[1.5px] border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 w-[240px] h-[240px] rounded-full border border-white/[0.07]" />

        <div className="relative max-w-[1100px] mx-auto px-6 lg:px-8 py-20 sm:py-24 text-center">
          <Reveal>
            <h2 className="text-[28px] sm:text-[32px] font-bold tracking-[-0.02em] leading-tight text-white">
              Siap Memulai?
            </h2>
          </Reveal>
          <Reveal delay={60}>
            <p className="mt-4 text-[15px] leading-6 text-white/60 max-w-[480px] mx-auto">
              Bergabung bersama PhysioV untuk rehabilitasi yang lebih terukur, terpantau, dan profesional.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-8">
              <Link href="/auth?mode=register" className="btn-shadow-light inline-flex items-center justify-center gap-2 h-[42px] px-6 rounded bg-white text-[#0F1B2E] text-[14px] font-medium hover:bg-[#F0F0F0] transition-colors">
                Daftar Sekarang <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FOOTER — 3 kolom: Brand | Navigasi | Layanan
      ═══════════════════════════════════════════════════ */}
      <footer className="bg-[#0B1320] text-white">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] gap-10 lg:gap-12">
            {/* Brand — widened to keep balance */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-8 h-8 rounded bg-white flex items-center justify-center">
                  <Activity className="text-[#0F1B2E]" style={{ width: 16, height: 16 }} />
                </span>
                <span className="text-[15px] font-bold">PhysioV</span>
              </div>
              <p className="text-[13px] leading-6 text-white/50 max-w-[320px]">
                Platform rehabilitasi fisik berbasis AI untuk pemantauan dan analisis gerakan real-time antara dokter dan pasien.
              </p>
            </div>

            {/* Navigasi */}
            <div>
              <h4 className="text-[12px] font-semibold tracking-[0.12em] uppercase text-white/40 mb-4">Navigasi</h4>
              <ul className="space-y-2.5">
                {NAV_ITEMS.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="text-[13px] text-white/60 hover:text-white transition-colors">{item.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Layanan */}
            <div>
              <h4 className="text-[12px] font-semibold tracking-[0.12em] uppercase text-white/40 mb-4">Layanan</h4>
              <ul className="space-y-2.5">
                {FEATURES.map((f) => (
                  <li key={f.title}>
                    <a href="#layanan" className="text-[13px] text-white/60 hover:text-white transition-colors">{f.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="border-t border-white/10">
          <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[12px] text-white/35">© 2026 PhysioV. Hak Cipta Dilindungi.</span>
            <div className="flex items-center gap-4">
              <a href="#" className="text-[12px] text-white/35 hover:text-white/60 transition-colors">Kebijakan Privasi</a>
              <a href="#" className="text-[12px] text-white/35 hover:text-white/60 transition-colors">Syarat & Ketentuan</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
