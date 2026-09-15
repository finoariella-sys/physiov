"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Cell,
  Tooltip,
} from "recharts";
import { MoreHorizontal } from "lucide-react";

export default function PatientVolumeTrendCard({
  data = [
    { day: "MON", count: 12, isHighlight: false },
    { day: "TUE", count: 18, isHighlight: false },
    { day: "WED", count: 14, isHighlight: false },
    { day: "THU", count: 20, isHighlight: false },
    { day: "FRI", count: 23, isHighlight: false },
    { day: "SAT", count: 32, isHighlight: true },
    { day: "SUN", count: 16, isHighlight: false },
  ],
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="w-full bg-white rounded-2xl p-6 border border-[#E3DDD2] shadow-sm flex flex-col justify-between">
      {/* Header with Title & Action Dots */}
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-black text-[#152238]">
          Patient Volume Trend
        </h3>
        <button
          type="button"
          className="text-[#718096] hover:text-[#152238] p-1 rounded-lg transition-colors"
          title="Opsi"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Bar Chart using Recharts */}
      <div className="w-full h-40 my-2">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#718096", fontSize: 10, fontWeight: 700 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.03)" }}
                formatter={(val) => [`${val} Pasien`, "Volume"]}
                contentStyle={{
                  backgroundColor: "#152238",
                  color: "#fff",
                  borderRadius: "12px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`bar-${index}`}
                    fill={entry.isHighlight ? "#152238" : "#CBD5E1"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-[#EFEBE4]/50 rounded-2xl animate-pulse" />
        )}
      </div>
    </div>
  );
}
