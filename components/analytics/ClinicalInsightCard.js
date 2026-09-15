"use client";

import { Sparkles, FileText, ArrowDownRight, CheckCheck, Info } from "lucide-react";

export default function ClinicalInsightCard({
  stabilityCoefficient = null,
  stabilityChange = null,
  fatigueResistance = null,
  maxFatigue = 100,
  aiInterpretation = "Core-extremity coordination is reaching functional maturity. Pelvic tilt control is now automatic at sub-maximal loads. Left knee valgus tendency reduced by 14% compared to baseline session.",
  validatorBadge = "Validated by AI Clinician Assist & Human Review",
}) {
  const fatiguePercentage = Math.min(
    (fatigueResistance / (maxFatigue || 1)) * 100,
    100
  );

  const isImproving = stabilityChange?.startsWith("+");

  return (
    <div className="w-full bg-[#152238] rounded-2xl p-6 border border-white/10 shadow-2xl flex flex-col justify-between text-white relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

      {/* Header: Title & Biometric Icon */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
              Clinical Insight & Stability
              <Info className="w-3.5 h-3.5 text-white/60 cursor-help" title="Stability Coefficient: mengukur seberapa stabil posisi tubuh pasien selama gerakan (0-1, makin tinggi makin stabil). Fatigue Resistance: ketahanan otot terhadap kelelahan, dihitung dari penurunan form score di rep akhir." />
            </h2>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xs font-semibold text-[#8E9EBA] mt-0.5">
            Advanced Biometric Interpretation
          </p>
        </div>

        <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white/80">
          <FileText className="w-4 h-4" />
        </div>
      </div>

      {/* Metrics Row: Stability Coefficient & Fatigue Resistance (Persis Gambar 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 relative z-10">
        {/* Metric 1: Stability Coefficient */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
          <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8E9EBA] flex items-center gap-1.5">
            Stability Coefficient
            <Info className="w-3 h-3 text-white/50 cursor-help" title="Mengukur seberapa stabil posisi tubuh pasien selama gerakan. Nilai 0-1, semakin mendekati 1 semakin stabil. <0.5 = tidak stabil, perlu perbaikan kontrol motorik." />
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {stabilityCoefficient ?? "—"}
            </span>
            {stabilityChange ? (
              <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md border ${
                isImproving
                  ? "text-emerald-400 bg-emerald-950/60 border-emerald-500/30"
                  : "text-amber-400 bg-amber-950/60 border-amber-500/30"
              }`}>
                {isImproving ? (
                  <ArrowDownRight className="w-3 h-3 mr-0.5 rotate-180" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-0.5" />
                )}
                {stabilityChange}
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-bold text-white/50 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                —
              </span>
            )}
          </div>
          <p className="text-[10px] text-emerald-300/80 mt-1 italic">
            Semakin tinggi = gerakan semakin stabil & terkendali
          </p>
        </div>

        {/* Metric 2: Fatigue Resistance */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
          <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#8E9EBA] flex items-center gap-1.5">
            Fatigue Resistance
            <Info className="w-3 h-3 text-white/50 cursor-help" title="Ketahanan otot terhadap kelelahan. Dihitung dari seberapa cepat form score menurun di repetisi akhir. 100 = tidak ada penurunan, <60 = cepat lelah." />
          </span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {fatigueResistance ?? "—"}
            </span>
            <span className="text-xs font-bold text-[#8E9EBA]">
              /{maxFatigue}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-emerald-400 transition-all duration-700 rounded-full"
              style={{ width: `${fatiguePercentage}%` }}
            />
          </div>
          <p className="text-[10px] text-emerald-300/80 mt-1 italic">
            Semakin tinggi = tahan lama, tidak cepat lelah
          </p>
        </div>
      </div>

      {/* AI Clinical Interpretation Quote Box (Persis Gambar 2) */}
      <div className="bg-[#0D1624]/75 rounded-2xl p-4 border border-white/10 relative z-10">
        <p className="text-xs sm:text-sm text-[#D1D9E6] leading-relaxed italic font-medium">
          &ldquo;{aiInterpretation ?? "Data detail tidak tersedia untuk sesi ini."}&rdquo;
        </p>
      </div>

      {/* Footer Validation Note */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10 text-[10px] text-[#8E9EBA] relative z-10">
        <span className="font-mono text-[#6A7B96]">SESSION · 04</span>
        <div className="flex items-center gap-1 text-emerald-400 font-semibold">
          <CheckCheck className="w-3 h-3" />
          <span>{validatorBadge}</span>
        </div>
      </div>
    </div>
  );
}
