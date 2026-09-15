"use client";

import { Sparkles, TrendingUp } from "lucide-react";

export default function WeeklyAIDigestBanner({
  recoveryVelocity = "-1.8%",
  velocitySubtitle = "Higher than cohort average",
  adherenceRate = "33%",
  adherenceSubtitle = "1 of 3 patients active",
  riskAlerts = "00",
  riskSubtitle = "Manual review required",
}) {
  return (
    <div className="w-full bg-[#152238] rounded-2xl p-6 sm:p-7 border border-white/10 shadow-2xl text-white relative overflow-hidden">
      {/* Decorative Wave Lines SVG on the right (Sesuai Gambar 3) */}
      <div className="absolute right-4 sm:right-12 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 hidden md:block">
        <svg width="220" height="90" viewBox="0 0 220 90" fill="none">
          <path
            d="M 10 45 C 50 15, 80 75, 120 45 C 160 15, 190 75, 210 45"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 10 55 C 50 25, 80 85, 120 55 C 160 25, 190 85, 210 55"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.6"
          />
        </svg>
      </div>

      {/* Header Tag */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <h2 className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-[#8E9EBA]">
          Weekly AI Digest
        </h2>
      </div>

      {/* 3 Metrics Grid (Sesuai Gambar 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 relative z-10">
        {/* Metric 1: Recovery Velocity */}
        <div>
          <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8E9EBA]">
            Recovery Velocity
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {recoveryVelocity}
            </span>
            <span className="inline-flex items-center p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xs font-semibold text-[#8E9EBA] mt-1">
            {velocitySubtitle}
          </p>
        </div>

        {/* Metric 2: Adherence Rate */}
        <div>
          <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8E9EBA]">
            Adherence Rate
          </span>
          <div className="mt-1.5">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {adherenceRate}
            </span>
          </div>
          <p className="text-xs font-semibold text-[#8E9EBA] mt-1">
            {adherenceSubtitle}
          </p>
        </div>

        {/* Metric 3: Risk Alerts */}
        <div>
          <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8E9EBA]">
            Risk Alerts
          </span>
          <div className="mt-1.5">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {riskAlerts}
            </span>
          </div>
          <p className="text-xs font-semibold text-[#8E9EBA] mt-1">
            {riskSubtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
