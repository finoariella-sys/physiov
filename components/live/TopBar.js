"use client";

import { ChevronDown, Sparkles, Lock, Users } from "lucide-react";

export default function TopBar({
  exercise = "Squat",
  onExerciseChange,
  isDemoMode = false,
  onToggleDemo,
  sessionStarted = false,
  onChangePatient,
  activePatient,
  isPatientMode = true, // New prop to distinguish patient vs clinician view
}) {
  return (
    <header className="w-full flex flex-wrap items-center justify-between gap-2 py-2 px-2 sm:px-4">
      {/* Live Session Title */}
      <div className="flex items-center gap-2.5">
        {sessionStarted ? (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <h1 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#152238]/90">
              Live Session: <span className="text-[#152238] font-black">{exercise}</span>
            </h1>
          </>
        ) : (
          <h1 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-[#152238]/70">
            Prepare Session
          </h1>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Tombol Ganti Pasien — hanya untuk mode clinician (dokter monitoring) */}
        {!sessionStarted && onChangePatient && !isPatientMode && (
          <button
            type="button"
            onClick={onChangePatient}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-white text-[#152238] border border-[#DDD5C7] hover:bg-[#FAF7F2] hover:border-[#152238]/40 transition-all shadow-sm"
            title="Ganti pasien yang berlatih"
          >
            <Users className="w-3.5 h-3.5 text-[#152238]/70" />
            <span className="hidden sm:inline">Ganti Pasien</span>
            <span className="sm:hidden">Ganti</span>
          </button>
        )}

        {/* Exercise Display — read-only for patients, disabled dropdown for clinicians */}
        <div className="relative">
          {isPatientMode ? (
            // Patient mode: read-only display with lock icon
            <div className="flex items-center gap-2 px-4 pr-9 py-1.5 rounded-xl bg-[#F5F1EB] text-[#152238]/50 font-bold text-xs sm:text-sm border border-[#E3DDD2]">
              <Lock className="w-3.5 h-3.5 text-[#152238]/30 flex-shrink-0" />
              <span>{exercise}</span>
            </div>
          ) : (
            // Clinician mode: dropdown (disabled when session started)
            <>
              <select
                value={exercise}
                onChange={(e) => onExerciseChange?.(e.target.value)}
                disabled={sessionStarted}
                className={`appearance-none font-bold text-xs sm:text-sm pl-4 pr-9 py-1.5 rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-[#152238]/20 cursor-pointer transition-all ${
                  sessionStarted
                    ? "bg-[#F5F1EB] text-[#152238]/50 border-[#E3DDD2] cursor-not-allowed"
                    : "bg-white text-[#152238] border-[#DDD5C7] hover:border-[#152238]/40"
                }`}
              >
                <option value="Squat">Squat</option>
                <option value="Knee Extension">Knee Extension</option>
                <option value="Shoulder Raise">Shoulder Raise</option>
                <option value="Hip Flexor Stretch">Hip Flexor Stretch</option>
                <option value="Hip Abduction">Hip Abduction</option>
              </select>
              {sessionStarted ? (
                <Lock className="w-3.5 h-3.5 text-[#152238]/30 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#152238]/60 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
            </>
          )}
        </div>

        {/* Demo Mode Toggle — hanya saat sesi aktif */}
        {sessionStarted && (
          <button
            type="button"
            onClick={onToggleDemo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm border ${
              isDemoMode
                ? "bg-[#152238] text-white border-[#152238]"
                : "bg-white text-[#152238] border-[#DDD5C7] hover:bg-[#FAF7F2]"
            }`}
            title="Toggle mode simulasi"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Demo Mode</span>
          </button>
        )}
      </div>
    </header>
  );
}
