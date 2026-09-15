"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Download, Maximize2, Activity, Check } from "lucide-react";

export default function AnalyticsHeader({
  patient = {
    name: "Eleanor Voss",
    condition: "POST KNEE REPLACEMENT (LEFT)",
    clinician: "Dr. Rivera",
    sessionDate: "24 Mei 2024 · 09:30 WIB",
  },
}) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // fallback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      window.print();
      setExporting(false);
    }, 300);
  };

  return (
    <header className="w-full flex flex-col gap-4">
      <div className="w-full flex items-center justify-between py-1">
        <Link
          href="/live"
          className="flex items-center gap-2.5 group"
          title="Kembali ke Live Session"
        >
          <div className="w-8 h-8 rounded-xl bg-[#152238] text-white flex items-center justify-center shadow-md group-hover:bg-[#1C2E4C] transition-colors">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-lg font-black tracking-tight text-[#152238]">
            PhysioV
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => { });
              } else {
                document.exitFullscreen().catch(() => { });
              }
            }}
            className="p-2 rounded-xl bg-white border border-[#E3DDD2] text-[#152238] hover:bg-[#FAF7F2] transition-colors shadow-sm hidden sm:flex"
            title="Layar Penuh"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-[#E3DDD2]/60">
        <div>
          <Link
            href="/live"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#718096] hover:text-[#152238] transition-colors mb-1 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Kembali ke Live Session</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-[#152238] tracking-tight">
            Session Analytics
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#718096] mt-0.5">
            <span>PATIENT: <strong className="text-[#152238]">{patient.name}</strong></span>
            <span>·</span>
            <span>{patient.condition}</span>
            {patient.clinician && (
              <>
                <span>·</span>
                <span>{patient.clinician}</span>
              </>
            )}
            {patient.sessionDate && (
              <>
                <span>·</span>
                <span className="font-medium normal-case">{patient.sessionDate}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleShare}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition-all shadow-sm ${copied
              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
              : "bg-white border-[#E3DDD2] text-[#152238] hover:bg-[#FAF7F2]"
              }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-[#718096]" />
                <span>Share Report</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#152238] text-xs sm:text-sm font-bold text-white hover:bg-[#1C2E4C] transition-all shadow-md shadow-[#152238]/15 active:scale-95 disabled:opacity-75"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? "Preparing PDF..." : "Export PDF"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}