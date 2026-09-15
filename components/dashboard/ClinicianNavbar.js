"use client";

import Link from "next/link";
import { Activity, Maximize2 } from "lucide-react";

export default function ClinicianNavbar({ statusNote = "3 patients · All clear" }) {
  return (
    <header className="w-full flex items-center justify-between py-2">
      {/* Brand & Status Note (Sesuai Gambar 3) */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group"
          title="Kembali ke Dashboard"
        >
          <div className="w-8 h-8 rounded-xl bg-[#152238] text-white flex items-center justify-center shadow-md group-hover:bg-[#1C2E4C] transition-colors">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-lg font-black tracking-tight text-[#152238]">
            PhysioV
          </span>
        </Link>

        <span className="hidden sm:inline-block text-xs font-bold text-[#718096] border-l border-[#DDD5C7] pl-4">
          {statusNote}
        </span>
      </div>

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
    </header>
  );
}