"use client";

import { CheckCircle2, AlertTriangle, AlertOctagon, Info } from "lucide-react";

export default function FormAccuracyMetricCard({
  optimal = 72,
  variant = 20,
  critical = 8,
  details = [],
}) {
  return (
    <div className="w-full bg-white rounded-2xl p-6 border border-[#E3DDD2] shadow-sm flex flex-col justify-between">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-black text-[#152238] tracking-tight flex items-center gap-2">
            Form Accuracy Metric
            <Info className="w-3.5 h-3.5 text-[#718096] cursor-help" title="Distribusi akurasi gerakan kinematik real-time: Optimal (±5° dari target), Variant (kompensasi ringan), Critical (deviasi berat >10°)" />
          </h2>
          <p className="text-xs font-semibold text-[#718096] mt-0.5">
            Real-time kinematic alignment distribution
          </p>
        </div>

        {/* Legend Pills: Sage Green (Optimal), Amber (Variant), Coral (Critical) */}
        <div className="flex items-center gap-3.5 text-[11px] font-extrabold uppercase tracking-wider">
          <div className="flex items-center gap-1.5 text-[#3D6B50]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4D7C5F]" />
            <span>Optimal ({optimal}%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#B46914]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E5A83B]" />
            <span>Variant ({variant}%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#C94A3D]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DE5D4E]" />
            <span>Critical ({critical}%)</span>
          </div>
        </div>
      </div>

      {/* Stacked Horizontal Bar: Optimal (sage green), Variant (amber), Critical (coral) */}
      <div className="my-6">
        <div className="w-full h-9 rounded-xl overflow-hidden flex shadow-inner border border-black/5 bg-[#F5F2EB] p-1 gap-1">
          {/* Segment 1: Optimal (sage green) */}
          <div
            className="h-full bg-[#4D7C5F] hover:bg-[#436F54] rounded-lg flex items-center justify-center text-white text-xs font-black transition-all duration-700 shadow-sm"
            style={{ width: `${optimal}%` }}
            title={`Optimal: ${optimal}% - Gerakan dalam toleransi ±5° dari target ideal`}
          >
            {optimal > 8 && <span>{optimal}%</span>}
          </div>

          {/* Segment 2: Variant (amber) */}
          <div
            className="h-full bg-[#E5A83B] hover:bg-[#D4982E] rounded-lg flex items-center justify-center text-[#152238] text-xs font-black transition-all duration-700 shadow-sm"
            style={{ width: `${variant}%` }}
            title={`Variant: ${variant}% - Gerakan dengan kompensasi ringan (mis. valgus knee <5°)`}
          >
            {variant > 8 && <span>{variant}%</span>}
          </div>

          {/* Segment 3: Critical (coral) */}
          <div
            className="h-full bg-[#DE5D4E] hover:bg-[#CF4E3F] rounded-lg flex items-center justify-center text-white text-xs font-black transition-all duration-700 shadow-sm"
            style={{ width: `${critical}%` }}
            title={`Critical: ${critical}% - Deviasi berat >10°, risiko cedera ulang`}
          >
            {critical > 5 && <span>{critical}%</span>}
          </div>
        </div>
      </div>

      {/* 3 Detail Columns with Descriptions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#EFEBE4]">
        {/* Column 1: Optimal Alignment */}
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#4D7C5F]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#4D7C5F]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black text-[#152238]">
                Optimal Alignment
              </h4>
              <span className="text-[10px] font-extrabold text-[#4D7C5F] bg-[#4D7C5F]/10 px-1.5 py-0.2 rounded">
                {optimal}%
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#718096] leading-snug mt-0.5">
              Shoulder-to-hip vector within 5°
            </p>
            <p className="text-[10px] text-emerald-700 mt-1 italic">
              Gerakan ideal, stabil, dan simetris
            </p>
          </div>
        </div>

        {/* Column 2: Variant Path */}
        <div className="flex items-start gap-2.5 border-t sm:border-t-0 sm:border-l border-[#EFEBE4] pt-2 sm:pt-0 sm:pl-3">
          <div className="w-6 h-6 rounded-lg bg-[#E5A83B]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-3.5 h-3.5 text-[#B46914]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black text-[#152238]">
                Variant Path
              </h4>
              <span className="text-[10px] font-extrabold text-[#B46914] bg-[#E5A83B]/15 px-1.5 py-0.2 rounded">
                {variant}%
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#718096] leading-snug mt-0.5">
              Compensatory chain shift (Knee valgus)
            </p>
            <p className="text-[10px] text-amber-700 mt-1 italic">
              Kompensasi ringan, butuh koreksi
            </p>
          </div>
        </div>

        {/* Column 3: Critical Failure */}
        <div className="flex items-start gap-2.5 border-t sm:border-t-0 sm:border-l border-[#EFEBE4] pt-2 sm:pt-0 sm:pl-3">
          <div className="w-6 h-6 rounded-lg bg-[#DE5D4E]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertOctagon className="w-3.5 h-3.5 text-[#DE5D4E]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black text-[#152238]">
                Critical Failure
              </h4>
              <span className="text-[10px] font-extrabold text-[#DE5D4E] bg-[#DE5D4E]/15 px-1.5 py-0.2 rounded">
                {critical}%
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#718096] leading-snug mt-0.5">
              Hyper-extension at peak load (&gt; 10°)
            </p>
            <p className="text-[10px] text-rose-700 mt-1 italic">
              Risiko tinggi, perlu intervensi segera
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
