"use client";

export default function OverallFormScoreCard({
  score = 82,
  grade = "B+",
  status = "OPTIMAL PROGRESS",
  totalReps = 10,
  sessionsCount = 4,
}) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const isOptimal = score >= 80;
  const strokeColor = isOptimal ? "#10B981" : score >= 60 ? "#F59E0B" : "#D9534F";

  return (
    <div className="w-full bg-white rounded-2xl p-6 border border-[#E3DDD2] shadow-sm flex flex-col justify-between">
      {/* Card Header: Label & Status Pill */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-[#718096]">
          Overall Form Score
        </span>
        <span
          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            isOptimal
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-600 border-red-200"
          }`}
        >
          {status}
        </span>
      </div>

      {/* Circular Progress Ring with Score & Letter Grade (Persis Gambar 2) */}
      <div className="my-6 flex flex-col items-center justify-center">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Background Ring */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="#EFEBE4"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Active Gauge Ring */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke={strokeColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Text Di Dalam Lingkaran: Persentase + Grade Huruf */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-black text-[#152238] tracking-tight">
              {score}%
            </span>
            <span className="text-lg font-extrabold text-[#718096] mt-0.5">
              {grade}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Sub-stats: Total Reps & Sessions */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#EFEBE4]">
        <div className="text-center">
          <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#718096]">
            Total Reps
          </span>
          <p className="text-lg font-black text-[#152238] mt-0.5">
            {totalReps}
          </p>
        </div>
        <div className="text-center border-l border-[#EFEBE4]">
          <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#718096]">
            Sessions
          </span>
          <p className="text-lg font-black text-[#152238] mt-0.5">
            {sessionsCount}
          </p>
        </div>
      </div>
    </div>
  );
}
