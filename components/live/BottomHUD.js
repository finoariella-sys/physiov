"use client";

import { useState } from "react";
import { Sparkles, Pause, Square, X } from "lucide-react";

export default function BottomHUD({
  reps = 0,
  targetReps = 50,
  originalTargetReps,
  totalRepsCompleted = 0,
  patient = null,
  formScore = 0,
  exerciseName = "Squat",
  patientFirstName = "Eleanor",
  patientTag = "POST KNEE",
  isDemoMode = false,
  onToggleDemo,
  onPauseSession,
  onCompleteSession,
  sessionStarted = false,
}) {
  const [showEndOptions, setShowEndOptions] = useState(false);
  // Hitung target reps secara dinamis sesuai spesifikasi:
  // sisaTarget = pasien.targetReps - pasien.totalRepsCompleted
  // BUKAN langsung menampilkan pasien.targetReps mentah-mentah
  const rawTarget = Number(patient?.targetReps ?? originalTargetReps ?? targetReps) > 0
    ? Number(patient?.targetReps ?? originalTargetReps ?? targetReps)
    : 50;

  const prevCompleted = typeof patient?.totalRepsCompleted === "number"
    ? patient.totalRepsCompleted
    : (Number(totalRepsCompleted) || (typeof patient?.reps === "string" && patient.reps.includes("/") ? parseInt(patient.reps.split("/")[0], 10) : 0));

  // Perhitungan sisa target
  const sisaTarget = (prevCompleted > 0 && prevCompleted < rawTarget)
    ? Math.max(1, rawTarget - prevCompleted)
    : (Number(targetReps) > 0 ? Number(targetReps) : rawTarget);

  const displayTarget = sisaTarget;
  const repsProgress = Math.min((reps / (displayTarget || 1)) * 100, 100);

  return (
    <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2">
      {/* 4 Cards Metrik */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 flex-1">
        {/* Metric 1: REPS */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#E3DDD2] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#7A889B]">
              Reps
            </span>
            {isDemoMode && (
              <span className="text-[9px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-300">
                Demo
              </span>
            )}
          </div>
          <div className="mt-1">
            <span className="text-xl sm:text-2xl font-black text-[#152238]">
              {reps}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#8B98A9]">
              /{displayTarget}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-1 bg-[#EFEAE2] rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-[#152238] transition-all duration-300 rounded-full"
              style={{ width: `${repsProgress}%` }}
            />
          </div>
          {prevCompleted > 0 && prevCompleted < rawTarget && (
            <span className="text-[9px] text-[#7A889B] font-bold mt-1.5 truncate">
              Sisa target ({prevCompleted}/{rawTarget} selesai)
            </span>
          )}
          {isDemoMode && (
            <span className="text-[9px] text-amber-600 font-semibold mt-1.5">
              Reps tidak dihitung dalam mode demo
            </span>
          )}
        </div>

        {/* Metric 2: FORM */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#E3DDD2] shadow-sm flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#7A889B]">
            Form
          </span>
          <div className="mt-1">
            <span className="text-xl sm:text-2xl font-black text-[#152238]">
              {formScore}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#8B98A9] ml-0.5">
              %
            </span>
          </div>
          <span className="text-xs text-[#8B98A9] font-bold mt-1">—</span>
        </div>

        {/* Metric 3: EXERCISE */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#E3DDD2] shadow-sm flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#7A889B]">
            Exercise
          </span>
          <p className="mt-1 text-base sm:text-lg font-black text-[#152238] truncate">
            {exerciseName}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1">
            Standard Reps
          </span>
        </div>

        {/* Metric 4: PATIENT */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#E3DDD2] shadow-sm flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#7A889B]">
            Patient
          </span>
          <p className="mt-1 text-base sm:text-lg font-black text-[#152238] truncate">
            {patientFirstName}
          </p>
          <span className="text-[10px] text-[#7A889B] font-bold uppercase tracking-wider truncate mt-1">
            {patientTag}
          </span>
        </div>
      </div>

      {/* Action Buttons: Demo Mode & End Session — hanya saat sesi aktif */}
      {sessionStarted && (
        <div className="flex items-center gap-2.5 justify-end mt-2 lg:mt-0">
          <button
            type="button"
            onClick={onToggleDemo}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold border transition-all shadow-sm ${
              isDemoMode
                ? "bg-[#152238] text-white border-[#152238]"
                : "bg-white text-[#152238] border-[#DDD5C7] hover:bg-[#FAF7F2]"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Demo Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEndOptions(true)}
            className="flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold bg-[#152238] text-white hover:bg-[#1C2E4C] active:scale-[0.98] transition-all shadow-md shadow-[#152238]/15"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>End Session</span>
          </button>
        </div>
      )}

      {/* Modal: pilihan jelas antara "Jeda Sesi" dan "Selesaikan Sesi" */}
      {showEndOptions && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border-t-4 border-[#152238]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-[#152238] tracking-tight">
                  Akhiri Sesi Latihan
                </h3>
                <p className="text-xs font-semibold text-[#718096] mt-1">
                  Pilih salah satu tindakan di bawah ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEndOptions(false)}
                className="p-1.5 rounded-xl text-[#718096] hover:bg-[#F1ECE4] transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowEndOptions(false);
                  onPauseSession?.();
                }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-[#E3DDD2] bg-[#FAF7F2] text-left hover:border-[#152238]/40 hover:bg-white transition-all"
              >
                <span className="w-11 h-11 shrink-0 rounded-2xl bg-[#152238] text-white flex items-center justify-center">
                  <Pause className="w-5 h-5 fill-white" />
                </span>
                <span>
                  <span className="block text-sm font-black text-[#152238]">Jeda Sesi</span>
                  <span className="block text-[11px] font-semibold text-[#718096] mt-0.5">
                    Rekam progres saat ini. Lanjutkan lagi nanti dalam maksimal 24 jam.
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowEndOptions(false);
                  onCompleteSession?.();
                }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-left hover:border-emerald-400 hover:bg-emerald-100 transition-all"
              >
                <span className="w-11 h-11 shrink-0 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center">
                  <Square className="w-5 h-5 fill-slate-950" />
                </span>
                <span>
                  <span className="block text-sm font-black text-[#152238]">
                    Selesaikan Sesi
                  </span>
                  <span className="block text-[11px] font-semibold text-[#718096] mt-0.5">
                    Tandai sesi selesai sekarang, walau repetisi belum mencapai target. Hasil tetap tercatat.
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
