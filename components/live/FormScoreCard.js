"use client";

export default function FormScoreCard({ score = 0, maxScore = 100 }) {
  // Hitung persentase stroke dasharray untuk circular SVG
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.min(Math.max(score, 0), maxScore);
  const strokeDashoffset = circumference - (normalizedScore / maxScore) * circumference;

  const getScoreStatus = () => {
    if (score === 0) return { label: "Needs Work", color: "text-[#D9534F]", stroke: "#D9534F" };
    if (score >= 80) return { label: "Optimal Form", color: "text-emerald-600", stroke: "#10B981" };
    if (score >= 60) return { label: "Moderate Form", color: "text-amber-600", stroke: "#F59E0B" };
    return { label: "Needs Work", color: "text-[#D9534F]", stroke: "#D9534F" };
  };

  const status = getScoreStatus();

  return (
    <div className="w-full bg-white rounded-2xl sm:rounded-3xl p-4 lg:p-5 border border-[#E3DDD2] shadow-sm flex flex-col items-center justify-center">
      <span className="text-[11px] font-black uppercase tracking-widest text-[#718096] mb-3">
        Form Score
      </span>

      {/* Circular Gauge Ring */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background Ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#EFEBE4"
            strokeWidth="9"
            fill="transparent"
          />
          {/* Active Score Ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={status.stroke}
            strokeWidth="9"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Text Di Dalam Circle Gauge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl sm:text-4xl font-black text-[#152238] tracking-tight">
            {score}
          </span>
          <span className={`text-[11px] font-bold mt-0.5 ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>
    </div>
  );
}
