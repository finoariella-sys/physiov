"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Timer } from "lucide-react";

export default function AvgRecoveryDaysCard({
  avgDays = 42,
  trend = "-4 days from last month",
  data = [
    { name: "Completed", value: 68, color: "#152238" },
    { name: "Remaining", value: 32, color: "#E3DDD2" },
  ],
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="w-full bg-white rounded-2xl p-6 border border-[#E3DDD2] shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-black text-[#152238]">
          Avg Recovery Days
        </h3>
        <Timer className="w-4 h-4 text-[#718096]" />
      </div>

      {/* Donut Chart using Recharts with Center Text */}
      <div className="relative w-full h-36 my-1 flex items-center justify-center">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={58}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-28 h-28 rounded-full border-4 border-[#EFEBE4] animate-pulse" />
        )}

        {/* Center Label: 42 DAYS */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-2xl font-black text-[#152238] leading-tight">
            {avgDays}
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#718096]">
            Days
          </span>
        </div>
      </div>

      {/* Footer Trend Subtitle */}
      <p className="text-center text-[11px] font-bold text-[#718096]">
        {trend}
      </p>
    </div>
  );
}
