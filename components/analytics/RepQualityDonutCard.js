"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Info } from "lucide-react";

const QUALITY_DESCRIPTIONS = {
  "Perfect Execution": "Repetisi sempurna, sudut sendi dalam target ±5°, gerakan lancar & simetris",
  "Minor Deviations": "Repetisi dengan deviasi ringan, kompensasi <5° (mis. valgus knee minor), butuh koreksi",
  "Failed Reps": "Repetisi gagal, deviasi >10° atau tidak mencapai target ROM, risiko cedera ulang",
};

function RepQualityDonutTooltip({ active, payload, totalReps }) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white border border-[#E3DDD2] rounded-xl p-3 shadow-lg text-left min-w-[200px]">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="font-black text-[#152238]">{item.name}</span>
        </div>
        <p className="text-xs text-[#526071]">{QUALITY_DESCRIPTIONS[item.name] || ""}</p>
        <p className="text-sm font-bold text-[#152238] mt-1">{item.value} dari {totalReps} reps</p>
      </div>
    );
  }
  return null;
}

export default function RepQualityDonutCard({
  totalReps = 10,
  data = [
    { name: "Perfect Execution", value: 7, color: "#152238" },
    { name: "Minor Deviations", value: 2, color: "#D6C3A8" },
    { name: "Failed Reps", value: 1, color: "#D9534F" },
  ],
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="w-full bg-white rounded-2xl p-6 border border-[#E3DDD2] shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-black text-[#152238] tracking-tight flex items-center gap-1.5">
          Rep Quality Distribution
          <Info className="w-3.5 h-3.5 text-[#718096] cursor-help" title="Distribusi kualitas repetisi: Perfect (ideal), Minor (kompensasi ringan), Failed (deviasi berat/gagal). Hover untuk detail." />
        </h2>
      </div>

      <div className="my-3 flex items-center justify-center relative w-full h-44 sm:h-48">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                onMouseEnter={(entry) => setHoveredItem(entry.payload)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<RepQualityDonutTooltip totalReps={totalReps} />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-36 h-36 rounded-full border-8 border-[#EFEBE4] animate-pulse" />
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#718096]">
            Total
          </span>
          <span className="text-2xl font-black text-[#152238] leading-tight">
            {totalReps}
          </span>
          <span className="text-[10px] font-bold text-[#718096] uppercase">
            Reps
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-3 border-t border-[#EFEBE4]">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-start justify-between text-xs font-bold gap-2">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[#152238]">{item.name}</span>
            </div>
            <span className="text-[#718096] font-extrabold whitespace-nowrap">{item.value}</span>
          </div>
        ))}
        {hoveredItem && (
          <div className="pt-2 border-t border-[#EFEBE4] mt-1">
            <p className="text-[11px] text-[#526071] italic bg-[#FAF7F2] p-2 rounded-xl border border-[#EBE5DA]">
              {QUALITY_DESCRIPTIONS[hoveredItem.name] || ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}