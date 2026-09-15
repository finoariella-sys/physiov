"use client";

import { useRef, useState, useCallback, useEffect } from "react";

/**
 * useVoiceFeedback — PhysioV Real-Time Voice Coaching Hook
 *
 * Mengucapkan feedback koreksi form secara otomatis melalui Web Speech API
 * (SpeechSynthesis) dengan mekanisme:
 *  1. Confirmation delay: Feedback baru diucapkan JIKA kondisi buruk bertahan
 *     selama `confirmationDelayMs` (default 2500ms). Jika kondisi membaik
 *     sebelum delay habis → dibatalkan.
 *  2. Per-message cooldown: Setelah feedback X diucapkan, feedback X yang sama
 *     tidak akan diulang selama `cooldownMs` (default 3000ms). Feedback Y yang
 *     berbeda boleh langsung diucapkan tanpa menunggu cooldown X.
 *  3. Mute toggle: Suara bisa dimatikan/dihidupkan lewat `toggleMute()`.
 *  4. Bahasa Indonesia: Mencari voice `id-ID`, fallback ke default jika tidak ada.
 *
 * @param {Object} config
 * @param {number} config.confirmationDelayMs - Delay konfirmasi sebelum mengucapkan (ms)
 * @param {number} config.cooldownMs - Cooldown per-pesan setelah diucapkan (ms)
 * @param {number} config.speechRate - Kecepatan bicara (0.5 – 2.0)
 * @param {number} config.speechPitch - Pitch suara (0.5 – 2.0)
 * @param {number} config.speechVolume - Volume suara (0.0 – 1.0)
 *
 * @returns {Object}
 *   - queueFeedback(message): Antrekan feedback dengan delay konfirmasi
 *   - cancelPending(): Batalkan feedback yang sedang menunggu
 *   - stopSpeaking(): Hentikan suara yang sedang diputar
 *   - toggleMute(): Toggle mute/unmute
 *   - isMuted: boolean
 *   - isSpeaking: boolean — true saat TTS sedang memutar suara
 *   - currentMessage: string — pesan yang sedang/terakhir diucapkan
 *   - pendingMessage: string|null — pesan yang sedang menunggu konfirmasi delay
 */
export default function useVoiceFeedback({
  confirmationDelayMs = 2500,
  cooldownMs = 3000,
  speechRate = 0.95,
  speechPitch = 1.0,
  speechVolume = 1.0,
} = {}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [lastSpokenMessage, setLastSpokenMessage] = useState("");
  const [pendingMessage, setPendingMessage] = useState(null);

  // Refs untuk internal state yang tidak perlu trigger re-render
  const pendingTimerRef = useRef(null);
  const cooldownMapRef = useRef(new Map()); // Map<message, expiresAtTimestamp>
  const indonesianVoiceRef = useRef(null);
  const synthRef = useRef(null);
  const isMutedRef = useRef(isMuted);

  // Sinkronisasi isMuted ref supaya callback closure selalu punya nilai terbaru
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Inisialisasi SpeechSynthesis & cari voice Bahasa Indonesia
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    synthRef.current = window.speechSynthesis;

    const findIndonesianVoice = () => {
      const voices = synthRef.current.getVoices();
      // Prioritaskan voice id-ID, lalu in-ID, lalu voice apapun yang mengandung "indonesia"
      indonesianVoiceRef.current =
        voices.find((v) => v.lang === "id-ID") ||
        voices.find((v) => v.lang === "in-ID") ||
        voices.find((v) => v.lang.startsWith("id")) ||
        voices.find((v) => v.name.toLowerCase().includes("indonesia")) ||
        null;

      if (indonesianVoiceRef.current) {
        console.log(
          `[PhysioV Voice] Voice Bahasa Indonesia ditemukan: "${indonesianVoiceRef.current.name}" (${indonesianVoiceRef.current.lang})`
        );
      } else {
        console.warn(
          "[PhysioV Voice] Voice id-ID tidak ditemukan, menggunakan voice default browser."
        );
      }
    };

    // Voices mungkin belum langsung tersedia (Chrome lazy-loads)
    findIndonesianVoice();
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = findIndonesianVoice;
    }

    return () => {
      // Cleanup: hentikan suara dan hapus pending timer
      synthRef.current?.cancel();
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
      }
    };
  }, []);

  /**
   * Eksekusi ucapan TTS langsung (tanpa delay — dipanggil internal setelah
   * konfirmasi delay selesai).
   */
  const speak = useCallback(
    (message) => {
      if (!synthRef.current || isMutedRef.current || !message) return;

      // Cek cooldown per-pesan: apakah pesan ini masih dalam masa cooldown?
      const now = Date.now();
      const cooldownExpiry = cooldownMapRef.current.get(message);
      if (cooldownExpiry && now < cooldownExpiry) {
        console.log(
          `[PhysioV Voice] Cooldown aktif untuk "${message}", sisa ${Math.round((cooldownExpiry - now) / 1000)}s. Dilewati.`
        );
        return;
      }

      // Cancel ucapan sebelumnya yang masih berjalan
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(message);

      // Pasang voice Indonesia jika tersedia
      if (indonesianVoiceRef.current) {
        utterance.voice = indonesianVoiceRef.current;
        utterance.lang = indonesianVoiceRef.current.lang;
      } else {
        utterance.lang = "id-ID";
      }

      utterance.rate = speechRate;
      utterance.pitch = speechPitch;
      utterance.volume = speechVolume;

      utterance.onstart = () => {
        console.log(`[PhysioV Voice] 🔊 Mengucapkan: "${message}"`);
        setIsSpeaking(true);
        setCurrentMessage(message);
        setLastSpokenMessage(message);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        // Set cooldown untuk pesan ini
        cooldownMapRef.current.set(message, Date.now() + cooldownMs);
      };

      utterance.onerror = (event) => {
        // "interrupted" terjadi saat cancel() dipanggil — bukan error sesungguhnya
        if (event.error !== "interrupted") {
          console.warn(`[PhysioV Voice] Error TTS: ${event.error}`);
        }
        setIsSpeaking(false);
      };

      synthRef.current.speak(utterance);
    },
    [cooldownMs, speechRate, speechPitch, speechVolume]
  );

  /**
   * Mengucapkan pesan langsung tanpa confirmation delay (misal saat rep selesai)
   */
  const speakDirectly = useCallback(
    (message) => {
      speak(message);
    },
    [speak]
  );

  /**
   * Antrekan feedback dengan mekanisme confirmation delay.
   * - Jika `message` sama dengan yang sudah pending → abaikan (timer sudah jalan).
   * - Jika `message` berbeda → batalkan pending sebelumnya, mulai timer baru.
   * - Jika `message` null/kosong → batalkan pending (kondisi membaik).
   */
  const queueFeedback = useCallback(
    (message) => {
      // Null / kosong = kondisi membaik → batalkan pending
      if (!message) {
        if (pendingTimerRef.current) {
          clearTimeout(pendingTimerRef.current);
          pendingTimerRef.current = null;
          setPendingMessage(null);
        }
        return;
      }

      // Jika pesan yang sama sudah pending, biarkan timer-nya jalan
      if (pendingTimerRef.current && pendingMessage === message) {
        return;
      }

      // Batalkan timer pending sebelumnya (pesan beda)
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
      }

      setPendingMessage(message);

      // Mulai timer konfirmasi: ucapkan hanya jika kondisi masih sama setelah delay
      pendingTimerRef.current = setTimeout(() => {
        pendingTimerRef.current = null;
        setPendingMessage(null);
        speak(message);
      }, confirmationDelayMs);
    },
    [confirmationDelayMs, speak, pendingMessage]
  );

  /**
   * Batalkan semua feedback yang sedang pending (belum diucapkan).
   */
  const cancelPending = useCallback(() => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
      setPendingMessage(null);
    }
  }, []);

  /**
   * Hentikan suara yang sedang diputar.
   */
  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  /**
   * Toggle mute/unmute. Jika di-mute saat sedang berbicara, langsung hentikan.
   */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        // Mute: hentikan suara + pending
        synthRef.current?.cancel();
        if (pendingTimerRef.current) {
          clearTimeout(pendingTimerRef.current);
          pendingTimerRef.current = null;
          setPendingMessage(null);
        }
        setIsSpeaking(false);
      }
      return next;
    });
  }, []);

  return {
    queueFeedback,
    speakDirectly,
    cancelPending,
    stopSpeaking,
    toggleMute,
    isMuted,
    isSpeaking,
    currentMessage,
    lastSpokenMessage,
    pendingMessage,
  };
}
