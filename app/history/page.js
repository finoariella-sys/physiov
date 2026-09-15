"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Calendar, ArrowLeft, Play, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getSessionsForPatient } from "@/lib/sessionService";
import ProtectedRoute from "@/components/ProtectedRoute";
import PatientLayout from "@/components/PatientLayout";

function SessionHistoryContent() {
  const { user, profile } = useAuth();
  const isPatient = profile?.role === "patient";

  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const sessions = await getSessionsForPatient(user.uid);
        setHistory(sessions);
      } catch (err) {
        console.error("Gagal memuat riwayat sesi:", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (user) loadHistory();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#EFEBE4] text-[#111A28] p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
      <div className="max-w-[1280px] w-full mx-auto flex flex-col gap-6">
        {/* Top Navbar */}
        <header className="w-full flex items-center justify-between py-1">
          <Link
            href="/live"
            className="flex items-center gap-2.5 group"
            title="Kembali ke Live Session"
          >
            <div className="w-8 h-8 rounded-xl bg-[#152238] text-white flex items-center justify-center shadow-md group-hover:bg-[#1C2E4C] transition-colors">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-lg font-black tracking-tight text-[#152238]">
              PhysioV
            </span>
          </Link>
        </header>

        {/* Page Title & Navigation Row */}
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1 border-t border-[#E3DDD2]/60">
          <div>
            <Link
              href="/live"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#718096] hover:text-[#152238] transition-colors mb-1 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Kembali ke Live Session</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-[#152238] tracking-tight">
              Riwayat Sesi Pribadi
            </h1>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#718096] mt-0.5">
              PASIEN: {profile?.name || "Pasien"}
            </p>
          </div>

          <Link
            href="/live"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#152238] text-xs sm:text-sm font-bold text-white hover:bg-[#1C2E4C] transition-all shadow-md shadow-[#152238]/15 active:scale-95 self-start md:self-auto"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Mulai Sesi Baru</span>
          </Link>
        </div>

        {/* List of Session Summary Cards */}
        <main className="flex flex-col gap-3.5 mt-2">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-full h-24 bg-white/60 rounded-2xl border border-[#E3DDD2] animate-pulse"
                />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-[#E3DDD2] text-center flex flex-col items-center justify-center gap-3">
              <Calendar className="w-10 h-10 text-[#718096]/50" />
              <h3 className="text-base font-black text-[#152238]">
                Belum Ada Riwayat Sesi
              </h3>
              <p className="text-xs text-[#718096] max-w-sm">
                Selesaikan sesi latihan Anda di Live Session untuk merekam riwayat analitik.
              </p>
              <Link
                href="/live"
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#152238] text-white text-xs font-bold hover:bg-[#1C2E4C] transition-all"
              >
                Mulai Sesi Sekarang
              </Link>
            </div>
          ) : (
            history.map((session, index) => {
              const isOptimal = (session.formScore || 0) >= 80;
              return (
                <div
                  key={session.id || index}
                  className="w-full bg-white rounded-2xl p-5 sm:p-6 border border-[#E3DDD2] shadow-sm hover:border-[#152238]/30 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Info Kiri: Exercise, Tanggal & Waktu */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] border border-[#E3DDD2] flex items-center justify-center text-[#152238] flex-shrink-0 mt-0.5 sm:mt-0">
                      <Calendar className="w-5 h-5 text-[#E28821]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-[#152238] tracking-tight">
                          {session.exerciseId || "Exercise"}
                        </h3>
                        {index === 0 && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Terbaru
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#718096] font-semibold mt-0.5 flex items-center gap-1.5">
                        <span>{session.date?.toDate ? session.date.toDate().toLocaleDateString("id-ID") : "Tanggal tidak diketahui"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Metrik Tengah: Overall Form Score & Total Reps & Status Badge Ringkas */}
                  <div className="flex items-center gap-5 sm:gap-7 border-t sm:border-t-0 border-[#EFEBE4] pt-3 sm:pt-0">
                    {/* Overall Form Score (Angka Saja) */}
                    <div className="text-left sm:text-center">
                      <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#718096]">
                        Form Score
                      </span>
                      <p className="text-xl sm:text-2xl font-black text-[#152238] leading-tight mt-0.5">
                        {session.formScore || 0}%
                      </p>
                    </div>

                    {/* Total Reps */}
                    <div className="text-left sm:text-center">
                      <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#718096]">
                        Total Reps
                      </span>
                      <p className="text-xl sm:text-2xl font-black text-[#152238] leading-tight mt-0.5">
                        {session.reps || 0} / {session.targetReps || 10}
                      </p>
                    </div>

                    {/* Badge Status Singkat: Optimal / Needs Review */}
                    <div>
                      <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#718096] mb-1">
                        Status
                      </span>
                      {isOptimal ? (
                        <span className="inline-block text-[11px] font-black uppercase tracking-wider text-[#335C45] bg-[#EAF2ED] px-3 py-1 rounded-full border border-[#C5DACD]">
                          Optimal
                        </span>
                      ) : (
                        <span className="inline-block text-[11px] font-black uppercase tracking-wider text-[#C94A3D] bg-[#FDF2F0] px-3 py-1 rounded-full border border-[#F5C2BC]">
                          Needs Review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tombol Kanan: "Lihat Detail" dengan icon chevron-right */}
                  <div className="flex items-center sm:justify-end border-t sm:border-t-0 border-[#EFEBE4] pt-3 sm:pt-0">
                    <Link
                      href={`/analytics/${session.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#152238] text-[#152238] hover:text-white border border-[#E3DDD2] hover:border-[#152238] text-xs font-bold transition-all shadow-sm group"
                    >
                      <span>Lihat Detail</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs font-semibold text-[#718096]">
        PhysioV Platform · Session History & Recovery Records
      </footer>
    </div>
  );
}

export default function SessionHistoryPage() {
  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <PatientLayout>
        <SessionHistoryContent />
      </PatientLayout>
    </ProtectedRoute>
  );
}