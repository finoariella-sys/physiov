"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Activity,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Stethoscope,
  Sparkles,
  RotateCcw,
  BarChart2,
  Clock,
  Target,
  ShieldAlert,
} from "lucide-react";
import ClinicianNavbar from "@/components/dashboard/ClinicianNavbar";
import { getUserProfile } from "@/lib/authService";
import { getSessionsForPatient } from "@/lib/sessionService";
import { getPrescriptionsForPatient } from "@/lib/prescriptionService";
import { getExercises } from "@/lib/exerciseService";
import DoctorLayout from "@/components/DoctorLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

function ClinicianPatientDetailContent() {
  const params = useParams();
  const { user } = useAuth();
  const patientId = params?.id;

  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!patientId) return;

    async function loadData() {
      try {
        const [pt, sess, pres, exers] = await Promise.all([
          getUserProfile(patientId),
          getSessionsForPatient(patientId),
          getPrescriptionsForPatient(patientId),
          getExercises(),
        ]);
        setPatient(pt);
        setSessions(sess);
        setPrescriptions(pres);
        setExercises(exers);

        // Otorisasi: dokter hanya boleh mengakses pasien yang ditangani.
        const isOwnPatient =
          pt?.assignedDoctorId === user?.uid ||
          (pres || []).some((p) => p.doctorId === user?.uid);
        setIsAuthorized(isOwnPatient);
      } catch (err) {
        console.error("Error loading patient detail:", err);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [patientId, user?.uid]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] p-6 flex flex-col items-center justify-center text-center">
        <div className="bg-white p-8 rounded-3xl border border-[#E3DDD2] max-w-md shadow-lg">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-black text-[#152238]">Akses Ditolak</h2>
          <p className="text-xs text-[#718096] mt-2 mb-6">
            Anda tidak memiliki akses ke pasien ini. Hanya dokter yang menangani
            pasien yang dapat melihat data mereka.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#152238] text-white rounded-xl text-xs font-bold hover:bg-[#1C2E4C]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Clinician Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] p-6 flex flex-col items-center justify-center text-center">
        <div className="bg-white p-8 rounded-3xl border border-[#E3DDD2] max-w-md shadow-lg">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-black text-[#152238]">Pasien Tidak Ditemukan</h2>
          <p className="text-xs text-[#718096] mt-2 mb-6">
            Data pasien dengan ID &quot;{patientId}&quot; tidak tersedia di sistem.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#152238] text-white rounded-xl text-xs font-bold hover:bg-[#1C2E4C]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Clinician Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const activePres = prescriptions.find(p => p.status !== "completed") || prescriptions[0];
  const exercise = exercises.find(e => e.id === activePres?.exerciseId);
  const totalTarget = activePres?.targetReps || exercise?.targetReps || 10;
  const completedReps = sessions.reduce((sum, s) => sum + (s.reps || 0), 0);
  const progressPercent = Math.min(100, Math.round((completedReps / totalTarget) * 100));

  const avgFormScore =
    sessions.length > 0
      ? Math.round(sessions.reduce((acc, s) => acc + (s.formScore || 80), 0) / sessions.length)
      : 80;

  const formGrade =
    avgFormScore >= 90 ? "A" : avgFormScore >= 80 ? "B+" : avgFormScore >= 70 ? "B" : "C";

  return (
    <div className="min-h-screen bg-[#EFEBE4] text-[#111A28] p-4 sm:p-6 lg:p-8 flex flex-col justify-between select-none">
      <div className="max-w-[1440px] w-full mx-auto flex flex-col gap-5 sm:gap-6">
        {/* Clinician Top Navbar */}
        <ClinicianNavbar statusNote="Monitoring Klinis Pasien" />

        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between pt-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-[#718096] hover:text-[#152238] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Watchlist Pasien</span>
          </Link>

          <span className="text-[11px] font-bold text-[#718096] bg-[#FAF7F2] px-3 py-1 rounded-xl border border-[#EBE5DA]">
            Mode Evaluasi & Monitoring Klinis
          </span>
        </div>

        {/* PATIENT HEADER HERO BANNER */}
        <div className="bg-white rounded-3xl border border-[#E3DDD2] p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Patient Profile Info */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#152238] text-white font-black text-2xl sm:text-3xl flex items-center justify-center border-2 border-emerald-500/40 shadow-md flex-shrink-0">
                {patient.initials || "PT"}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#152238] tracking-tight">
                    {patient.name}
                  </h1>
                  {progressPercent >= 100 ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-1 rounded-full border border-[#BFDBFE]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                      COMPLETED
                    </span>
                  ) : completedReps > 0 ? (
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
                </div>

                <p className="text-xs sm:text-sm font-bold text-[#526071] uppercase tracking-wider mt-1">
                  {patient.condition}
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs font-semibold text-[#718096]">
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                    Penanggung Jawab: <strong className="text-[#152238]">{patient.assignedDoctorName || "Klinisi"}</strong>
                  </span>
                  <span>· ID: <strong className="text-[#152238]">{patient.id}</strong></span>
                  <span>· Total Sesi: <strong className="text-[#152238]">{sessions.length} kali</strong></span>
                </div>
              </div>
            </div>

            {/* Right: Reps Progress & Dedicated "Mulai Sesi untuk Pasien Ini" Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-[#EBE5DA]">
              <div className="pr-4 sm:border-r sm:border-[#DDD5C7]/70">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#718096] block">
                  Target & Akumulasi Reps
                </span>
                <p className="text-lg sm:text-xl font-black text-[#152238] mt-0.5">
                  {completedReps} / {totalTarget} Reps{" "}
                  <span className="text-xs font-bold text-emerald-700">({progressPercent}%)</span>
                </p>
                <div className="w-full min-w-[140px] h-2 bg-[#E3DDD2] rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY ANALYTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Card 1: Form Quality & Grade */}
          <div className="bg-white rounded-2xl p-5 border border-[#E3DDD2] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-extrabold text-[#718096] uppercase tracking-wider mb-2">
                <span>Rata-Rata Form Score</span>
                <BarChart2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-[#152238]">{avgFormScore}%</span>
                <span className="text-sm font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200">
                  Grade {formGrade}
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-medium mt-2">
                {avgFormScore >= 80
                  ? "Kualitas gerakan optimal dengan kepatuhan vektor sendi stabil."
                  : "Perlu perhatian klinis pada fase beban maksimal (valgus deviation)."}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EFEBE4] flex items-center justify-between text-[11px] font-bold text-[#718096]">
              <span>Stabilitas Kinematik</span>
              <strong className="text-[#152238]">0.61 Coeff</strong>
            </div>
          </div>

          {/* Card 2: Kinematic Accuracy Distribution */}
          <div className="bg-white rounded-2xl p-5 border border-[#E3DDD2] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-extrabold text-[#718096] uppercase tracking-wider mb-2">
                <span>Distribusi Akurasi Gerakan</span>
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Optimal (±5°)
                  </span>
                  <span className="text-[#152238]">72%</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-amber-800">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Kompensatorik (Variant)
                  </span>
                  <span className="text-[#152238]">20%</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-rose-800">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Critical Failure
                  </span>
                  <span className="text-[#152238]">8%</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EFEBE4] flex items-center justify-between text-[11px] font-bold text-[#718096]">
              <span>Toleransi Asimetri Beban</span>
              <strong className="text-[#152238]">{"< 10% Deviasi"}</strong>
            </div>
          </div>

          {/* Card 3: AI Clinical Insights */}
          <div className="bg-white rounded-2xl p-5 border border-[#E3DDD2] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-extrabold text-[#718096] uppercase tracking-wider mb-2">
                <span>Catatan & AI Clinician Assist</span>
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xs text-[#334155] leading-relaxed font-medium bg-[#FAF7F2] p-3 rounded-xl border border-[#EBE5DA]">
                {patient.condition?.toLowerCase().includes("knee")
                  ? "Koordinasi fleksi lutut kiri menunjukkan peningkatan stabilitas 14%. Deviasi valgus berkurang di repetisi 5-10."
                  : "Kontrol postural panggul mencapai target simetris pada rentang beban sub-maksimal."}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EFEBE4] flex items-center justify-between text-[11px] font-bold text-[#718096]">
              <span>Rekomendasi Lanjutan</span>
              <strong className="text-emerald-700">Pertahankan Beban</strong>
            </div>
          </div>
        </div>

        {/* RIWAYAT SESI KHUSUS PASIEN INI */}
        <div className="bg-white rounded-3xl border border-[#E3DDD2] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#EFEBE4]">
            <div>
              <h2 className="text-lg font-black text-[#152238] tracking-tight">
                Riwayat Sesi Latihan Pasien Ini
              </h2>
              <p className="text-xs font-semibold text-[#718096] mt-0.5">
                Daftar rekaman latihan khusus untuk {patient.name}
              </p>
            </div>
            <span className="text-xs font-bold text-[#718096] bg-[#FAF7F2] px-3 py-1 rounded-xl border border-[#EBE5DA]">
              {sessions.length} Sesi Terdata
            </span>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
              <Calendar className="w-10 h-10 text-[#718096]/50" />
              <h3 className="text-base font-black text-[#152238]">
                Belum Ada Sesi Latihan Tercatat
              </h3>
              <p className="text-xs text-[#718096] max-w-md">
                Pasien ini belum menyelesaikan sesi latihan mandiri. Sesi latihan hanya dijalankan oleh pasien
                melalui akunnya; Anda dapat memantau hasilnya di halaman ini setelah pasien selesai berlatih.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-extrabold uppercase tracking-widest text-[#718096] border-b border-[#EFEBE4]">
                    <th className="py-3 pr-4">Tanggal & Waktu</th>
                    <th className="py-3 px-4">Exercise</th>
                    <th className="py-3 px-4">Repetisi</th>
                    <th className="py-3 px-4">Form Score</th>
                    <th className="py-3 px-4">Kualitas Gerakan</th>
                    <th className="py-3 pl-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEBE4]/70">
                  {sessions.map((sess) => {
                    const score = sess.formScore || 80;
                    const grade =
                      score >= 90 ? "A" : score >= 80 ? "B+" : score >= 70 ? "B" : "C";
                    const ex = exercises.find(e => e.id === sess.exerciseId);
                    return (
                      <tr
                        key={sess.id}
                        className="hover:bg-[#FAF7F2] transition-colors group"
                      >
                        {/* Tanggal */}
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-2.5">
                            <Calendar className="w-4 h-4 text-[#718096]" />
                            <div>
                              <span className="text-xs sm:text-sm font-black text-[#152238] block">
                                {sess.date?.toDate ? sess.date.toDate().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) + " · " + sess.date.toDate().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB" : "Tanggal tidak diketahui"}
                              </span>
                              <span className="text-[10px] text-[#718096] font-semibold">
                                ID: {sess.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Exercise */}
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-black text-[#152238] bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#EBE5DA]">
                            {ex?.name || "Exercise"}
                          </span>
                        </td>

                        {/* Reps */}
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-black text-[#152238]">
                            {sess.reps || 0} / {sess.targetReps || totalTarget} Reps
                          </span>
                        </td>

                        {/* Form Score */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-black text-[#152238]">
                              {score}%
                            </span>
                            <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                              {grade}
                            </span>
                          </div>
                        </td>

                        {/* Rep Quality */}
                        <td className="py-3.5 px-4">
                          <div className="text-[11px] font-bold text-[#64748B]">
                            <span>
                              Perfect ·{" "}
                              Minor
                            </span>
                          </div>
                        </td>

                        {/* Link ke Analisis Sesi */}
                        <td className="py-3.5 pl-4 text-right">
                          <Link
                            href={`/analytics/${sess.id}`}
                            className="inline-flex items-center gap-1 text-xs font-extrabold text-[#152238] hover:text-emerald-700 bg-white hover:bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#DDD5C7] transition-all group-hover:border-[#152238]/40"
                          >
                            <span>Lihat Analisis</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClinicianPatientDetailPage() {
  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      <DoctorLayout>
        <ClinicianPatientDetailContent />
      </DoctorLayout>
    </ProtectedRoute>
  );
}
