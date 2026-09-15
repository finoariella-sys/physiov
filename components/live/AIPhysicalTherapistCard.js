"use client";

import { Sparkles, CircleDot, Volume2, VolumeX } from "lucide-react";

export default function AIPhysicalTherapistCard({
  feedbackMessage = "Complete a rep to hear from your coach.",
  isSpeaking = false,
  isMuted = false,
  onToggleMute,
}) {
  const isPlaceholder =
    feedbackMessage === "Complete a rep to hear from your coach.";

  return (
    <div className="w-full bg-white rounded-2xl sm:rounded-3xl p-4 lg:p-5 border border-[#E3DDD2] shadow-sm flex flex-col justify-between">
      {/* Header dengan Icon Aksen Recova */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#152238] text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#111A28] leading-tight">
              AI Physical Therapist
            </h2>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[#64748B] uppercase mt-0.5">
              Real-Time Guidance
            </p>
          </div>
        </div>

        {/* Tombol Mute/Unmute Voice */}
        {onToggleMute && (
          <button
            type="button"
            onClick={onToggleMute}
            className={`p-2 rounded-xl border transition-all ${
              isMuted
                ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
                : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
            }`}
            title={isMuted ? "Nyalakan suara" : "Matikan suara"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Guidance Message Body */}
      <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex items-start gap-2.5">
        <div className="mt-1 flex-shrink-0">
          {isSpeaking ? (
            <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
          ) : (
            <CircleDot className="w-4 h-4 text-[#152238]/60" />
          )}
        </div>
        <p
          className={`text-xs sm:text-sm leading-relaxed ${
            isPlaceholder
              ? "italic text-[#64748B]"
              : "font-semibold text-[#111A28]"
          }`}
        >
          {feedbackMessage}
        </p>
      </div>

      {/* Muted Indicator */}
      {isMuted && (
        <div className="mt-2 text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1">
          <VolumeX className="w-3 h-3" />
          Suara dimatikan
        </div>
      )}
    </div>
  );
}
