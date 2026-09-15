"use client";

export default function PatientCard({
  patient = {
    name: "Eleanor Voss",
    initials: "EV",
    condition: "POST KNEE REPLACEMENT (LEFT)",
    targetReps: 10,
    completedReps: 0,
  },
}) {
  return (
    <div className="w-full bg-white rounded-2xl sm:rounded-3xl p-4 lg:p-5 border border-[#E3DDD2] shadow-sm flex flex-col justify-between">
      {/* Profil Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#E8E2D8] text-[#152238] font-black text-sm flex items-center justify-center border border-[#DDD5C7] shadow-inner">
          {patient.initials || "PT"}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-extrabold text-[#111A28] truncate leading-tight">
            {patient.name}
          </h3>
          <p className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[#64748B] uppercase truncate mt-0.5">
            {patient.condition}
          </p>
        </div>
      </div>

      {/* Target & Done Pills Box (Sesuai Gambar 1) */}
      <div className="mt-3.5 bg-[#FAF7F2] rounded-xl p-2.5 grid grid-cols-2 gap-2 border border-[#EBE5DA]">
        <div>
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7A889B]">
            Target
          </span>
          <p className="text-xs sm:text-sm font-black text-[#152238] mt-0.5">
            {patient.targetReps}{" "}
            <span className="text-[11px] font-medium text-[#7A889B]">reps</span>
          </p>
        </div>
        <div className="border-l border-[#E5DFD4] pl-2.5">
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7A889B]">
            Done
          </span>
          <p className="text-xs sm:text-sm font-black text-[#152238] mt-0.5">
            {patient.completedReps}{" "}
            <span className="text-[11px] font-medium text-[#7A889B]">reps</span>
          </p>
        </div>
      </div>
    </div>
  );
}
