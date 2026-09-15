"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

export default function PatientWatchlistTable({
  patients = [],
}) {
  const router = useRouter();

  // Handler untuk klik pasien - navigate ke detail pasien
  const handlePatientClick = (patient) => {
    router.push(`/clinician/patient/${patient.id}`);
  };

  return (
    <div className="w-full bg-white rounded-2xl p-6 border border-[#E3DDD2] shadow-sm flex flex-col justify-between">
      {/* Table Header Row */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EFEBE4]">
        <div>
          <h2 className="text-base sm:text-lg font-black text-[#152238] tracking-tight">
            Patient Watchlist
          </h2>
          <p className="text-[11px] font-semibold text-[#718096] mt-0.5">
            Klik pada baris pasien untuk melihat detail &amp; riwayat
          </p>
        </div>
        <span className="text-xs font-bold text-[#718096] bg-[#FAF7F2] px-3 py-1 rounded-xl border border-[#EBE5DA]">
          {patients.length} Registered Patients
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-extrabold uppercase tracking-widest text-[#718096] border-b border-[#EFEBE4]">
              <th className="py-3 pr-4">Patient</th>
              <th className="py-3 px-4">Condition</th>
              <th className="py-3 px-4">Avg Form</th>
              <th className="py-3 px-4">Reps (Akumulatif)</th>
              <th className="py-3 pl-4 text-center w-[1%] whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFEBE4]/70">
            {patients.map((patient) => {
              const totalTarget = Number(patient.targetReps) > 0 ? Number(patient.targetReps) : 50;
              const completed = Number(patient.totalRepsCompleted) || 0;
              const percent = Math.min(100, Math.round((completed / totalTarget) * 100));

              return (
                <tr
                  key={patient.id}
                  onClick={() => handlePatientClick(patient)}
                  className="group hover:bg-[#FAF7F2] cursor-pointer transition-colors"
                  title={`Lihat detail pasien ${patient.name}`}
                >
                  {/* Patient Column */}
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#E8E2D8] text-[#152238] font-black text-xs flex items-center justify-center border border-[#DDD5C7] shadow-inner flex-shrink-0 group-hover:border-[#152238]/40 transition-colors">
                        {patient.initials || "PT"}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-black text-[#152238] leading-tight group-hover:text-emerald-800 transition-colors inline-flex items-center gap-1">
                          {patient.name}
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-700 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                        </p>
                        <p className="text-[11px] font-semibold text-[#718096]">
                          {patient.clinician || "Dokter"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Condition Column */}
                  <td className="py-3.5 px-4">
                    <p className="text-xs font-semibold text-[#152238] max-w-[180px] truncate">
                      {patient.condition}
                    </p>
                  </td>

                  {/* Avg Form Column (Sage green mini progress bar jika ada) */}
                  <td className="py-3.5 px-4">
                    {patient.avgForm ? (
                      <div className="w-24">
                        <div className="flex justify-between text-[10px] font-bold text-[#718096] mb-1">
                          <span>FORM</span>
                          <span className="font-extrabold text-[#152238]">
                            {patient.avgForm}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#EFEBE4] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4D7C5F] rounded-full"
                            style={{ width: `${patient.avgForm}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-[#8E9EBA]">—</span>
                    )}
                  </td>

                  {/* Reps Column — SELALU menampilkan progress akumulatif apa adanya, misal 5/50 atau 24/50 */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1 min-w-[85px]">
                      <span className="text-xs font-extrabold text-[#152238] tracking-tight">
                        {patient.reps || `${completed}/${totalTarget}`}
                      </span>
                      <div className="w-full h-1.5 bg-[#EFEBE4] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            patient.status === "COMPLETED"
                              ? "bg-[#2563EB]"
                              : patient.status === "ON TRACK"
                                ? "bg-[#4D7C5F]"
                                : "bg-[#DDD5C7]"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Status Column: 3 Kemungkinan: NO SESSION, ON TRACK, COMPLETED */}
                  <td className="py-3.5 pl-4 text-center whitespace-nowrap">
                    {patient.status === "COMPLETED" ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#BFDBFE]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                        COMPLETED
                      </span>
                    ) : patient.status === "ON TRACK" ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#2D5A43] bg-[#EAF2ED] px-2.5 py-1 rounded-full border border-[#C5DACD]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                        ON TRACK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#718096] bg-[#EFEBE4] px-2.5 py-1 rounded-full border border-[#DDD5C7]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A0AEC0]" />
                        NO SESSION
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
