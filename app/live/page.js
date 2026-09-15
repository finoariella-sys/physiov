"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Play, Activity, ChevronDown, User, Target, Dumbbell, Users, Lock, Sparkles, RotateCcw, AlertTriangle } from "lucide-react";
import TopBar from "@/components/live/TopBar";
import CameraFeed from "@/components/live/CameraFeed";
import AIPhysicalTherapistCard from "@/components/live/AIPhysicalTherapistCard";
import FormScoreCard from "@/components/live/FormScoreCard";
import PatientCard from "@/components/live/PatientCard";
import BottomHUD from "@/components/live/BottomHUD";
import { getExerciseConfig, EXERCISE_CONFIG } from "@/lib/exerciseConfig";
import useVoiceFeedback from "@/hooks/useVoiceFeedback";
import { getPrescriptionsForPatient, updatePrescriptionStatus } from "@/lib/prescriptionService";
import { getExercises } from "@/lib/exerciseService";
import { saveSession, savePausedSession, getPausedSession, updatePausedSession, completePausedSession, checkAndCompleteExpiredPausedSessions } from "@/lib/sessionService";
import { calculateRealFormScore, getIdealAngle, getLiveFrameScoring, buildSessionStats } from "@/lib/formScoring";
import ProtectedRoute from "@/components/ProtectedRoute";
import PatientLayout from "@/components/PatientLayout";

// ─── Konfigurasi Voice Coaching ───
const VOICE_CONFIG = {
  confirmationDelayMs: 2500,
  cooldownMs: 3000,
  speechRate: 0.95,
};

function LiveSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const isPatient = profile?.role === "patient";

  const prescriptionId = searchParams.get("prescriptionId");
  const [prescriptions, setPrescriptions] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [activePrescription, setActivePrescription] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [exerciseConfigError, setExerciseConfigError] = useState(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedSessionId, setPausedSessionId] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [kneeAngle, setKneeAngle] = useState(151);
  const [movementPhase, setMovementPhase] = useState("STANDING");
  const [reps, setReps] = useState(0);
  const [formScore, setFormScore] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState(
    "Complete a rep to hear from your coach."
  );
  const [loading, setLoading] = useState(true);

  // Load prescriptions and exercises on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Selesaikan otomatis sesi yang dijeda > 24 jam sebelum memuat data
        await checkAndCompleteExpiredPausedSessions(user.uid).catch((err) =>
          console.warn("[loadData] Gagal menyelesaikan sesi paused kadaluarsa:", err)
        );

        const [pres, exers] = await Promise.all([
          getPrescriptionsForPatient(user.uid),
          getExercises(),
        ]);
        setPrescriptions(pres);
        setExercises(exers);

        let selectedPrescription = null;

        // 1. Jika prescriptionId ada di query parameter, utamakan itu
        if (prescriptionId) {
          const found = pres.find((p) => p.id === prescriptionId);
          if (found) {
            selectedPrescription = found;
          } else {
            console.warn(`[PhysioV] Prescription "${prescriptionId}" tidak ditemukan pada daftar resep pasien.`);
          }
        }

        // 2. Jika tidak ada ID di URL atau tidak ditemukan, ambil resep berstatus 'active' terbaru
        if (!selectedPrescription && pres.length > 0) {
          selectedPrescription = pres.find((p) => p.status === "active") || pres[0];
        }

        if (selectedPrescription) {
          setActivePrescription(selectedPrescription);

          // Cari dokumen exercise di Firestore
          const exerciseDoc = exers.find((e) => e.id === selectedPrescription.exerciseId);

          // Resolve konfigurasi scoring & animasi (cocokkan via configKey, name, atau exerciseId)
          const resolvedConfig = getExerciseConfig(exerciseDoc || selectedPrescription.exerciseId, exers);

          if (resolvedConfig) {
            setSelectedExercise(resolvedConfig.name);
            setExerciseConfigError(null);

            // LOGGING VALIDASI (Requirement 5)
            console.log(
              `%c[PhysioV Live Session Validated] 🎯 Exercise Resolved!`,
              "color: #10B981; font-weight: bold; font-size: 13px;",
              {
                prescriptionId: selectedPrescription.id,
                exerciseIdFromPrescription: selectedPrescription.exerciseId,
                firestoreDocFound: !!exerciseDoc,
                resolvedExerciseName: resolvedConfig.name,
                configKey: resolvedConfig.configKey || resolvedConfig.id,
                direction: resolvedConfig.direction,
                jointLabel: resolvedConfig.jointLabel,
                thresholds: resolvedConfig.thresholds,
                targetReps: selectedPrescription.targetReps || resolvedConfig.targetReps,
              }
            );
          } else {
            // FALLBACK YANG AMAN (Requirement 4) - JANGAN diam-diam fallback ke Squat
            const errorMsg = "Konfigurasi exercise tidak ditemukan, hubungi admin";
            console.error(
              `%c[PhysioV Live Session] ❌ Gagal Mencocokkan Konfigurasi Exercise!`,
              "color: #EF4444; font-weight: bold; font-size: 13px;",
              {
                prescriptionId: selectedPrescription.id,
                exerciseId: selectedPrescription.exerciseId,
                firestoreDoc: exerciseDoc || null,
                availableConfigs: Object.keys(EXERCISE_CONFIG),
              }
            );
            setSelectedExercise(exerciseDoc?.name || "Unknown Exercise");
            setExerciseConfigError(errorMsg);
          }

          // Check for paused session
          const paused = await getPausedSession(user.uid, selectedPrescription.id);
          if (paused) {
            setIsPaused(true);
            setPausedSessionId(paused.id);
            console.log("[loadData] Resuming paused session, setting reps to:", paused.reps || 0);
            setReps(paused.reps || 0);
            setFormScore(paused.formScore || 0);
          }
        }
      } catch (error) {
        console.error("Error loading live session data:", error);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadData();
  }, [user, prescriptionId]);

  // ─── Live Session Tracking Metrics ───
  const sessionStatsRef = useRef({
    scores: [],
    repScores: [],
    repQualities: [],
    angleDeviations: [],
    optimalCount: 0,
    variantCount: 0,
    criticalCount: 0,
    totalSamples: 0,
  });

  // Durasi sesi (ms): totalElapsed + segmen berjalan sejak master start
  const sessionRunStartRef = useRef(null);
  const sessionElapsedMsRef = useRef(0);

  const getElapsedSec = () => {
    if (!sessionRunStartRef.current) return 0;
    return Math.round((Date.now() - sessionRunStartRef.current + sessionElapsedMsRef.current) / 1000);
  };

  const formScoreRef = useRef(formScore);
  useEffect(() => {
    formScoreRef.current = formScore;
  }, [formScore]);

  // ─── Voice Feedback Hook ───
  const {
    queueFeedback,
    speakDirectly,
    cancelPending,
    toggleMute,
    isMuted,
    isSpeaking,
    currentMessage,
    lastSpokenMessage,
    pendingMessage,
  } = useVoiceFeedback(VOICE_CONFIG);

  // ─── Single-Source-of-Truth State Machine ───
  const repStateMachineRef = useRef({
    state: "idle",
    minAngleInRep: 180,
    maxAngleInRep: 0,
    lastRepTimestamp: 0,
    lastLoggedTime: 0,
  });

  const repsRef = useRef(reps);
  useEffect(() => {
    repsRef.current = reps;
  }, [reps]);

  const lastAnalyzeRef = useRef(0);
  const ANALYZE_INTERVAL_MS = 450;

  // ─── Handler: Pose data dari CameraFeed ───
  const handlePoseCalculated = useCallback(
    (poseData) => {
      // Skip processing if paused
      if (isPaused) return;
      
      const config = getExerciseConfig(selectedExercise, exercises);
      if (!config) return;

      const currentAngle = poseData.kneeAngle ?? 180;
      const leftAngle = poseData.leftKnee ?? currentAngle;
      const rightAngle = poseData.rightKnee ?? currentAngle;

      // ─── 1. DEMO MODE EXPLICIT CHECK ───
      if (isDemoMode || poseData?.isDemo) {
        setKneeAngle(currentAngle);
        setMovementPhase(poseData.phase || config.phases.idle);
        return;
      }

      // ─── 2. DATA DARI KAMERA ASLI (isDemoMode === false) ───
      setKneeAngle(currentAngle);

      const now = Date.now();
      const sm = repStateMachineRef.current;
      const th = config.thresholds;
      const dir = config.direction;
      const phases = config.phases;

      // ─── KINEMATIC STATE MACHINE (Universal: decreasing & increasing) ───
      switch (sm.state) {
        case "idle":
          if (dir === "decreasing" ? currentAngle < th.startDescending : currentAngle > th.startDescending) {
            sm.state = "descending";
            sm.minAngleInRep = currentAngle;
            sm.maxAngleInRep = currentAngle;
            console.log(
              `%c[PhysioV Kamera Asli] 🔄 ${config.name} | Transisi: ${phases.idle} ➔ ${phases.descending} | Sudut: ${currentAngle}° (L: ${leftAngle}°, R: ${rightAngle}°) | Threshold Start: ${dir === "decreasing" ? `< ${th.startDescending}°` : `> ${th.startDescending}°`} | Dir: ${dir}`,
              "color: #3B82F6; font-weight: bold;"
            );
          }
          break;

        case "descending":
          if (dir === "decreasing") {
            if (currentAngle < sm.minAngleInRep) sm.minAngleInRep = currentAngle;
            if (currentAngle <= th.reachBottom) {
              sm.state = "bottom";
              console.log(
                `%c[PhysioV Kamera Asli] 🔄 ${config.name} | Transisi: ${phases.descending} ➔ ${phases.bottom} | Depth Capai: ${currentAngle}° (Target: ≤ ${th.reachBottom}°) | Dir: ${dir}`,
                "color: #10B981; font-weight: bold;"
              );
            } else if (currentAngle >= th.cancelRep) {
              sm.state = "idle";
              console.log(
                `%c[PhysioV Kamera Asli] ⚠️ ${config.name} | Rep Dibatalkan | Sudut kembali ke ${currentAngle}° (depth tercapai: ${sm.minAngleInRep}°, perlu: ≤ ${th.reachBottom}°) | Dir: ${dir}`,
                "color: #F59E0B; font-weight: bold;"
              );
            }
          } else {
            if (currentAngle > sm.maxAngleInRep) sm.maxAngleInRep = currentAngle;
            if (currentAngle >= th.reachBottom) {
              sm.state = "bottom";
              console.log(
                `%c[PhysioV Kamera Asli] 🔄 ${config.name} | Transisi: ${phases.descending} ➔ ${phases.bottom} | Peak Ekstensi: ${currentAngle}° (Target: ≥ ${th.reachBottom}°) | Dir: ${dir}`,
                "color: #10B981; font-weight: bold;"
              );
            } else if (currentAngle <= th.cancelRep) {
              sm.state = "idle";
              console.log(
                `%c[PhysioV Kamera Asli] ⚠️ ${config.name} | Rep Dibatalkan | Sudut kembali ke ${currentAngle}° (peak: ${sm.maxAngleInRep}°, perlu: ≥ ${th.reachBottom}°) | Dir: ${dir}`,
                "color: #F59E0B; font-weight: bold;"
              );
            }
          }
          break;

        case "bottom":
          if (dir === "decreasing") {
            if (currentAngle < sm.minAngleInRep) sm.minAngleInRep = currentAngle;
            if (currentAngle >= th.startAscending) {
              sm.state = "ascending";
              console.log(
                `%c[PhysioV Kamera Asli] 🔄 ${config.name} | Transisi: ${phases.bottom} ➔ ${phases.ascending} | Sudut Balik: ${currentAngle}° (Target: ≥ ${th.startAscending}°) | Min Depth: ${sm.minAngleInRep}° | Dir: ${dir}`,
                "color: #8B5CF6; font-weight: bold;"
              );
            }
          } else {
            if (currentAngle > sm.maxAngleInRep) sm.maxAngleInRep = currentAngle;
            if (currentAngle < th.startAscending) {
              sm.state = "ascending";
              console.log(
                `%c[PhysioV Kamera Asli] 🔄 ${config.name} | Transisi: ${phases.bottom} ➔ ${phases.ascending} | Sudut Balik: ${currentAngle}° (Target: < ${th.startAscending}°) | Max Peak: ${sm.maxAngleInRep}° | Dir: ${dir}`,
                "color: #8B5CF6; font-weight: bold;"
              );
            }
          }
          break;

        case "ascending":
          if (dir === "decreasing" ? currentAngle >= th.repComplete : currentAngle <= th.repComplete) {
            const timeSinceLastRep = now - sm.lastRepTimestamp;

            if (timeSinceLastRep > 600) {
              sm.lastRepTimestamp = now;

              const depthInfo = dir === "decreasing" ? sm.minAngleInRep : sm.maxAngleInRep;
              // Skor rep REAL: kedalaman yang dicapai dibanding sudut ideal exercise
              const currentRepScore = Math.max(0, Math.min(100, calculateRealFormScore(depthInfo, getIdealAngle(config), 5)));
              sessionStatsRef.current.repScores.push(currentRepScore);

              if (currentRepScore >= 85) {
                sessionStatsRef.current.repQualities.push("perfect");
              } else if (currentRepScore >= 70) {
                sessionStatsRef.current.repQualities.push("minor");
              } else {
                sessionStatsRef.current.repQualities.push("failed");
              }

              setReps((prev) => {
                console.log("[setReps increment] prev:", prev, "nextReps:", prev + 1);
                const nextReps = prev + 1;
                const target = getExerciseConfig(selectedExercise).targetReps;

                console.log(
                  `%c[PhysioV Kamera Asli] 🎯 ${config.name} | REP #${nextReps} SUKSES! | Peak: ${depthInfo}° | Sudut Kembali: ${currentAngle}° (Target Selesai: ${dir === "decreasing" ? `≥ ${th.repComplete}°` : `≤ ${th.repComplete}°`}) | Dir: ${dir}`,
                  "color: #FFFFFF; background: #059669; font-size: 13px; font-weight: bold; padding: 5px 12px; border-radius: 6px;"
                );

                if (nextReps >= target) {
                  speakDirectly(`Luar biasa! Target ${target} repetisi tercapai dengan sempurna.`);
                } else {
                  speakDirectly(`Bagus! Repetisi ${nextReps} selesai.`);
                }

                return nextReps;
              });
            }

            sm.state = "idle";
            sm.minAngleInRep = 180;
            sm.maxAngleInRep = 0;
            console.log(
              `%c[PhysioV Kamera Asli] 🔄 ${config.name} | Transisi: ${phases.ascending} ➔ ${phases.idle} | Siap rep berikutnya | Dir: ${dir}`,
              "color: #3B82F6; font-weight: bold;"
            );
          }
          break;

        default:
          sm.state = "idle";
          break;
      }

      // Map internal state ke display phase
      const phaseMap = {
        idle: config.phases.idle,
        descending: config.phases.descending,
        bottom: config.phases.bottom,
        ascending: config.phases.ascending,
      };
      setMovementPhase(phaseMap[sm.state] || config.phases.idle);

      // ─── REAL-TIME CONSOLE LOGGING KHUSUS KAMERA ASLI (THROTTLED ~350ms) ───
      if (now - sm.lastLoggedTime >= 350) {
        sm.lastLoggedTime = now;

        let thresholdStatus = "";
        if (sm.state === "idle") {
          thresholdStatus = `Threshold: Perlu ${dir === "decreasing" ? `< ${th.startDescending}°` : `> ${th.startDescending}°`} untuk mulai rep`;
        } else if (sm.state === "descending") {
          thresholdStatus = `Threshold: Target Peak ${dir === "decreasing" ? `≤ ${th.reachBottom}°` : `≥ ${th.reachBottom}°`} (Depth saat ini: ${dir === "decreasing" ? sm.minAngleInRep : sm.maxAngleInRep}°)`;
        } else if (sm.state === "bottom") {
          thresholdStatus = `Threshold: Di Peak! Target Balik ${dir === "decreasing" ? `≥ ${th.startAscending}°` : `< ${th.startAscending}°`}`;
        } else if (sm.state === "ascending") {
          thresholdStatus = `Threshold: Target Selesai ${dir === "decreasing" ? `≥ ${th.repComplete}°` : `≤ ${th.repComplete}°`}`;
        }

        console.log(
          `[PhysioV Kamera Asli] 📐 ${config.name} | ${config.jointLabel}: ${currentAngle}° (L: ${leftAngle}°, R: ${rightAngle}°) | Dir: ${dir} | Fase: [${phaseMap[sm.state]}] | ${thresholdStatus} | Reps: ${repsRef.current}`
        );
      }

      // ─── AI CLINICAL FEEDBACK & SCORING (REAL, bukan mock) ───
      if (now - lastAnalyzeRef.current >= ANALYZE_INTERVAL_MS) {
        lastAnalyzeRef.current = now;

        const currentPhase = phaseMap[sm.state];
        const frameScoring = getLiveFrameScoring(config, currentAngle, currentPhase);

        setFeedbackMessage(frameScoring.feedback);

        // Skor hanya dihitung saat gerakan berlangsung (nilai null saat idle)
        if (frameScoring.score !== null) {
          setFormScore(frameScoring.score);

          sessionStatsRef.current.scores.push(frameScoring.score);
          sessionStatsRef.current.totalSamples += 1;
          sessionStatsRef.current.angleDeviations.push(
            Math.abs(currentAngle - getIdealAngle(config))
          );

          if (frameScoring.score >= 80) {
            sessionStatsRef.current.optimalCount += 1;
          } else if (frameScoring.score >= 65) {
            sessionStatsRef.current.variantCount += 1;
          } else {
            sessionStatsRef.current.criticalCount += 1;
          }

          if (frameScoring.score < 80) {
            queueFeedback(frameScoring.feedback);
          } else {
            cancelPending();
          }
        }
      }
    },
    [selectedExercise, isDemoMode, exercises, isPaused, queueFeedback, cancelPending, speakDirectly]
  );

  const toggleDemoMode = () => {
    repStateMachineRef.current = {
      state: "idle",
      minAngleInRep: 180,
      maxAngleInRep: 0,
      lastRepTimestamp: 0,
      lastLoggedTime: 0,
    };
    setIsDemoMode((prev) => !prev);
  };

  // ─── Start Session Handler ───
  const handleStartSession = () => {
    console.log("[handleStartSession] Entry - reps:", reps, "pausedSessionId:", pausedSessionId, "isPaused:", isPaused, "isResuming:", !!pausedSessionId);
    const isResuming = !!pausedSessionId;
    
    const activeCfg = getExerciseConfig(selectedExercise, exercises);

    if (!isResuming) {
      // New session - reset everything
      setReps(0);
      setFormScore(0);
      setFeedbackMessage("Complete a rep to hear from your coach.");
      setMovementPhase(activeCfg?.phases?.idle || "STANDING");
      setKneeAngle(151);
      sessionStatsRef.current = {
        scores: [],
        repScores: [],
        repQualities: [],
        angleDeviations: [],
        optimalCount: 0,
        variantCount: 0,
        criticalCount: 0,
        totalSamples: 0,
      };
      sessionRunStartRef.current = Date.now();
      sessionElapsedMsRef.current = 0;
      repStateMachineRef.current = {
        state: "idle",
        minAngleInRep: 180,
        maxAngleInRep: 0,
        lastRepTimestamp: 0,
        lastLoggedTime: 0,
      };
    } else {
      // Resuming paused session - keep existing reps/formScore, reset only transient state
      setFeedbackMessage("Melanjutkan sesi...");
      setMovementPhase(activeCfg?.phases?.idle || "STANDING");
      setKneeAngle(151);
      setIsPaused(false);  // ← Reset isPaused to false so CameraFeed resumes processing
      sessionRunStartRef.current = Date.now();
      sessionElapsedMsRef.current = 0;
      // Keep existing reps and formScore from paused session
      // Keep existing sessionStatsRef and repStateMachineRef (they were preserved)
    }

    setSessionStarted(true);
    console.log(
      `%c[PhysioV] 🚀 Session ${isResuming ? 'Resumed' : 'Started'} | Exercise: ${selectedExercise} (${activeCfg?.configKey}) | Target: ${targetReps} reps | Reps: ${reps}`,
      "color: #FFFFFF; background: #152238; font-size: 14px; font-weight: bold; padding: 6px 12px; border-radius: 8px;",
      {
        direction: activeCfg?.direction,
        thresholds: activeCfg?.thresholds,
      }
    );
  };

  const handlePauseSession = async () => {
    setIsPaused(true);  // ← Pindah ke PALING ATAS agar UI responsif langsung
    const currentReps = reps;
    const stats = sessionStatsRef.current;
    const config = getExerciseConfig(selectedExercise, exercises);

    let avgScore = 90;
    if (stats.repScores.length > 0) {
      const sum = stats.repScores.reduce((acc, v) => acc + v, 0);
      avgScore = Math.round(sum / stats.repScores.length);
    } else if (stats.scores.length > 0) {
      const sum = stats.scores.reduce((acc, v) => acc + v, 0);
      avgScore = Math.round(sum / stats.scores.length);
    } else if (formScore > 0) {
      avgScore = formScore;
    }

    // Save as paused session
    let newPausedId = pausedSessionId;
    try {
      if (pausedSessionId) {
        await updatePausedSession(pausedSessionId, {
          reps: currentReps,
          formScore: avgScore,
          extra: buildLiveSessionExtra(),
        });
      } else {
        console.log("[handlePauseSession] Saving paused session:", {
          patientId: user.uid,
          prescriptionId: activePrescription?.id,
          currentReps,
          avgScore
        });
        newPausedId = await savePausedSession({
          patientId: user.uid,
          prescriptionId: activePrescription?.id,
          reps: currentReps,
          formScore: avgScore,
          pausedAt: new Date(),
          extra: buildLiveSessionExtra(),
        });
        setPausedSessionId(newPausedId);
      }
      setIsDemoMode(false);
      speakDirectly("Sesi dijeda. Anda bisa melanjutkan kapan saja dalam 24 jam.");
      
      // Redirect SETELAH await save/update selesai (bukan di finally)
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to save paused session:", error);
      // Tidak redirect jika error, biarkan user coba lagi
    }
  };

  const config = getExerciseConfig(selectedExercise, exercises);
  const targetReps = activePrescription?.targetReps || config?.targetReps || 10;

  const buildLiveSessionExtra = useCallback(() => {
    const totals = buildSessionStats(sessionStatsRef.current);
    return {
      ...totals,
      exerciseId: activePrescription?.exerciseId,
      targetReps,
      duration: getElapsedSec(),
    };
  }, [activePrescription, targetReps]);

  const computeAvgScore = useCallback(() => {
    const stats = sessionStatsRef.current;
    if (stats.repScores.length > 0) {
      return Math.round(stats.repScores.reduce((acc, v) => acc + v, 0) / stats.repScores.length);
    }
    if (stats.scores.length > 0) {
      return Math.round(stats.scores.reduce((acc, v) => acc + v, 0) / stats.scores.length);
    }
    if (formScoreRef.current > 0) {
      return formScoreRef.current;
    }
    return 90;
  }, []);

  // Selesaikan sesi: status "completed". Dipakai untuk tombol "Selesaikan Sesi"
  // (tetap completed walau target belum tercapai) maupun auto-complete saat target tercapai.
  const completeSessionNow = useCallback(async () => {
    const currentReps = repsRef.current;
    const avgScore = computeAvgScore();
    setIsPaused(true);
    try {
      let sessionId;
      if (pausedSessionId) {
        await completePausedSession(pausedSessionId, {
          reps: currentReps,
          formScore: avgScore,
          extra: buildLiveSessionExtra(),
        });
        sessionId = pausedSessionId;
      } else {
        sessionId = await saveSession({
          patientId: user.uid,
          prescriptionId: activePrescription?.id,
          reps: currentReps,
          formScore: avgScore,
          extra: buildLiveSessionExtra(),
        });
      }

      // Prescription baru bertanda "completed" HANYA jika target tercapai;
      // jika sesi diselesaikan manual sebelum target, pasien tetap bisa mengulang.
      if (activePrescription?.id && currentReps >= targetReps) {
        await updatePrescriptionStatus(activePrescription.id, "completed");
      }

      setIsDemoMode(false);
      speakDirectly(`Sesi selesai. ${currentReps} repetisi dengan form ${avgScore} persen.`);
      setTimeout(() => {
        router.push(`/analytics/${sessionId}`);
      }, 2000);
    } catch (error) {
      console.error("Failed to complete session:", error);
      setIsPaused(false);
    }
  }, [pausedSessionId, user, activePrescription, targetReps, computeAvgScore, speakDirectly, buildLiveSessionExtra, router]);

  // Auto-complete when target reps reached
  useEffect(() => {
    if (sessionStarted && !isPaused && reps >= targetReps && targetReps > 0) {
      const completeTimer = setTimeout(() => {
        completeSessionNow();
      }, 0);
      return () => clearTimeout(completeTimer);
    }
  }, [sessionStarted, isPaused, reps, targetReps, completeSessionNow]);

  // End-point tombol "Selesaikan Sesi" di HUD (dieja handleEndSession oleh BottomHUD)
  const handleCompleteSession = () => {
    if (!sessionStarted || isPaused) return;
    completeSessionNow();
  };

  const displayGuidanceText = isSpeaking
    ? currentMessage
    : pendingMessage
      ? `⏳ ${pendingMessage}`
      : lastSpokenMessage || feedbackMessage;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── 1. NO PRESCRIPTION SCREEN ───
  if (!activePrescription) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] text-[#152238] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E3DDD2] shadow-xl p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <Activity className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black mb-3">Belum Ada Latihan Tertugaskan</h2>
          <p className="text-[#526071] mb-6 leading-relaxed">
            Dokter Anda belum menugaskan latihan. Silakan ajukan keluhan di dashboard untuk mendapatkan prescription.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#152238] text-white font-black hover:bg-[#1C2E4C] transition-all"
          >
            <Users className="w-5 h-5" />
            <span>Kembali ke Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── 1B. SAFE FALLBACK ERROR SCREEN (Requirement 4) ───
  if (exerciseConfigError || !config) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] text-[#152238] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-red-200 shadow-xl p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black mb-3 text-red-950">Konfigurasi Latihan Tidak Ditemukan</h2>
          <p className="text-[#526071] mb-3 text-sm leading-relaxed">
            {exerciseConfigError || "Konfigurasi exercise tidak ditemukan, hubungi admin"}
          </p>
          <div className="text-xs text-left text-[#718096] bg-red-50/70 p-3.5 rounded-xl mb-6 font-mono border border-red-100/80 space-y-1">
            <p><strong className="text-red-900">Exercise ID:</strong> {activePrescription?.exerciseId || "Unknown"}</p>
            <p><strong className="text-red-900">Nama:</strong> {selectedExercise || "Tidak terdefinisi"}</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#152238] text-white font-black hover:bg-[#1C2E4C] transition-all w-full text-sm"
          >
            <Users className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── 2. PRE-SESSION SCREEN ───
  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] text-[#111A28] p-3 sm:p-4 lg:p-6 flex flex-col select-none">
        <div className="max-w-[1540px] w-full mx-auto flex flex-col gap-3 lg:gap-4 flex-1">
{/* Header */}
           <TopBar
             exercise={selectedExercise}
             onExerciseChange={setSelectedExercise}
             isDemoMode={isDemoMode}
             onToggleDemo={toggleDemoMode}
             sessionStarted={false}
             activePatient={{ name: profile?.name }}
             isPatientMode={true}
           />

          {/* Pre-Session Content */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-2xl mx-auto">
              {/* Main Card */}
              <div className="bg-white rounded-3xl border border-[#E3DDD2] shadow-xl overflow-hidden">
                {/* Card Header Banner */}
                <div className="bg-[#152238] px-6 sm:px-8 py-5 sm:py-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Sesi Latihan Mandiri
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                        Pre-Session Setup
                      </h2>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-white/60 font-semibold">
                    Halo {profile?.name}, exercise ini ditugaskan oleh dokter Anda. Konfirmasi dan mulai sesi.
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Patient Info Card */}
                  <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EBE5DA] space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#E8E2D8] text-[#152238] font-black text-sm flex items-center justify-center border border-[#DDD5C7] shadow-inner">
                        {profile?.name?.split(" ").map(n => n[0]).join("") || "PT"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-extrabold text-[#111A28] truncate">
                          {profile?.name}
                        </p>
                        <p className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[#64748B] uppercase truncate mt-0.5">
                          {activePrescription?.notes || "Latihan dari dokter"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white border border-[#E3DDD2] text-[#64748B] text-xs">
                      <span className="font-bold">
                        Target Sesi: <strong>{targetReps} reps</strong>
                      </span>
                      <span className="font-extrabold text-[#152238]">
                        Exercise: {selectedExercise}
                      </span>
                    </div>
                  </div>

                  {/* Exercise Info (Read-only) */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#7A889B] mb-2">
                      Exercise (Ditugaskan Dokter)
                    </label>
                    <div className="relative">
                      <div className="w-full flex items-center justify-between bg-[#F5F1EB] text-[#152238] font-bold text-sm sm:text-base px-4 py-3 rounded-xl border-2 border-[#E3DDD2]">
                        <span>{config?.name || selectedExercise}</span>
                        <Lock className="w-4 h-4 text-[#152238]/40" />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-[#7A889B] leading-relaxed">
                      {config?.description}
                    </p>
                  </div>

                  {/* Exercise Info Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#EBE5DA] text-center">
                      <Target className="w-4 h-4 text-[#152238]/60 mx-auto mb-1" />
                      <p className="text-lg font-black text-[#152238]">{targetReps}</p>
                      <p className="text-[10px] font-bold text-[#7A889B] uppercase tracking-wider">Target Reps</p>
                    </div>
                    <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#EBE5DA] text-center">
                      <Dumbbell className="w-4 h-4 text-[#152238]/60 mx-auto mb-1" />
                      <p className="text-lg font-black text-[#152238]">{config?.jointLabel || "KNEE"}</p>
                      <p className="text-[10px] font-bold text-[#7A889B] uppercase tracking-wider">Joint Focus</p>
                    </div>
                    <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#EBE5DA] text-center">
                      <Activity className="w-4 h-4 text-[#152238]/60 mx-auto mb-1" />
                      <p className="text-lg font-black text-[#152238] capitalize">{config?.direction === "decreasing" ? "↓" : "↑"}</p>
                      <p className="text-[10px] font-bold text-[#7A889B] uppercase tracking-wider">Direction</p>
                    </div>
                  </div>

                  {/* Start Session Button */}
                  {activePrescription?.status === "completed" ? (
                    <div className="w-full p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                      <p className="text-emerald-700 font-bold">Latihan ini sudah selesai</p>
                      <p className="text-sm text-emerald-600 mt-1">Prescription ini sudah digunakan. Silakan ajukan keluhan baru ke dokter untuk latihan berikutnya.</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartSession}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[#152238] text-white font-extrabold text-sm sm:text-base hover:bg-[#1C2E4C] active:scale-[0.98] transition-all shadow-xl shadow-[#152238]/20 group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 transition-all">
                        <Play className="w-4 h-4 text-emerald-400 ml-0.5" />
                      </div>
                      <span>Start Session</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── 3. ACTIVE SESSION LAYOUT ───
  return (
    <div className="min-h-screen bg-[#EFEBE4] text-[#111A28] p-3 sm:p-4 lg:p-6 flex flex-col justify-between select-none">
      <div className="max-w-[1540px] w-full mx-auto flex flex-col gap-3 lg:gap-4 flex-1">
{/* Header */}
         <TopBar
           exercise={selectedExercise}
           onExerciseChange={setSelectedExercise}
           isDemoMode={isDemoMode}
           onToggleDemo={toggleDemoMode}
           sessionStarted={true}
           isPatientMode={true}
         />

        {/* Layout Tengah */}
        <div className="flex gap-3 lg:gap-4 flex-1 items-stretch">
          <main className="flex-1 flex flex-col min-w-0">
            <CameraFeed
              exercise={selectedExercise}
              isDemoMode={isDemoMode}
              isActive={true}
              onToggleDemo={toggleDemoMode}
              kneeAngle={kneeAngle}
              movementPhase={movementPhase}
              repsCount={reps}
              onPoseCalculated={handlePoseCalculated}
              isPaused={isPaused}
            />
          </main>

          <aside className="w-full sm:w-72 lg:w-80 flex flex-col gap-3 justify-between flex-shrink-0">
            <AIPhysicalTherapistCard
              feedbackMessage={displayGuidanceText}
              isSpeaking={isSpeaking}
              isMuted={isMuted}
              onToggleMute={toggleMute}
            />
            <FormScoreCard score={formScore} maxScore={100} />
            <PatientCard
              patient={{
                name: profile?.name,
                targetReps,
                completedReps: reps,
              }}
            />
          </aside>
        </div>

        {/* HUD Bawah */}
        <BottomHUD
          reps={reps}
          targetReps={targetReps}
          originalTargetReps={targetReps}
          totalRepsCompleted={0}
          patient={{ name: profile?.name }}
          formScore={formScore}
          exerciseName={selectedExercise}
          patientFirstName={profile?.name?.split(" ")[0]}
          patientTag={activePrescription?.notes}
          isDemoMode={isDemoMode}
          onToggleDemo={toggleDemoMode}
          onPauseSession={handlePauseSession}
          onCompleteSession={handleCompleteSession}
          sessionStarted={true}
        />
      </div>
    </div>
  );
}

export default function LiveSessionPage() {
  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <PatientLayout>
        <LiveSessionContent />
      </PatientLayout>
    </ProtectedRoute>
  );
}