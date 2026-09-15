"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CameraOff, RefreshCw, Sparkles, Activity, AlertCircle } from "lucide-react";
import {
  mapLandmarkToCanvas,
  drawSkeleton,
  calculateAngle,
} from "@/lib/poseUtils";
import { getExerciseConfig } from "@/lib/exerciseConfig";

// ─── Demo Animation Helpers (module scope: murni, tanpa akses state komponen) ───

function buildBaseDemoPoints(count, centerX, headY) {
  const points = [];
  for (let i = 0; i < count; i++) {
    points[i] = { x: centerX, y: headY, visibility: 0 };
  }
  return points;
}

function drawChairGuide(ctx, centerX, seatY, cw) {
  ctx.save();
  ctx.strokeStyle = "rgba(78, 186, 135, 0.25)";
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);

  // Seat
  ctx.beginPath();
  ctx.moveTo(centerX - 70, seatY + 5);
  ctx.lineTo(centerX + 70, seatY + 5);
  ctx.stroke();

  // Back
  ctx.beginPath();
  ctx.moveTo(centerX - 65, seatY + 5);
  ctx.lineTo(centerX - 65, seatY - 80);
  ctx.stroke();

  // Legs
  ctx.beginPath();
  ctx.moveTo(centerX - 60, seatY + 5);
  ctx.lineTo(centerX - 60, seatY + 60);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX + 60, seatY + 5);
  ctx.lineTo(centerX + 60, seatY + 60);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.restore();
}

function drawSquatDemo(ctx, cw, ch, angle, cfg) {
  const centerX = cw * 0.5;
  const headY = ch * 0.28;
  const shoulderY = ch * 0.38;
  const hipY = ch * 0.52 + (cfg.demoAngle.max - angle) * 0.45;
  const kneeY = ch * 0.70;
  const ankleY = ch * 0.88;

  const demoPoints = buildBaseDemoPoints(33, centerX, headY);

  // Bahu
  demoPoints[11] = { x: centerX - 36, y: shoulderY, visibility: 0.9 };
  demoPoints[12] = { x: centerX + 36, y: shoulderY, visibility: 0.9 };
  // Siku & Tangan
  demoPoints[13] = { x: centerX - 60, y: shoulderY + 30, visibility: 0.9 };
  demoPoints[14] = { x: centerX + 60, y: shoulderY + 30, visibility: 0.9 };
  demoPoints[15] = { x: centerX - 55, y: shoulderY + 65, visibility: 0.9 };
  demoPoints[16] = { x: centerX + 55, y: shoulderY + 65, visibility: 0.9 };
  // Panggul
  demoPoints[23] = { x: centerX - 28, y: hipY, visibility: 0.95 };
  demoPoints[24] = { x: centerX + 28, y: hipY, visibility: 0.95 };
  // Lutut
  const kneeSpread = 42 + (cfg.demoAngle.max - angle) * 0.25;
  demoPoints[25] = { x: centerX - kneeSpread, y: kneeY, visibility: 0.95 };
  demoPoints[26] = { x: centerX + kneeSpread, y: kneeY, visibility: 0.95 };
  // Pergelangan Kaki
  demoPoints[27] = { x: centerX - 32, y: ankleY, visibility: 0.95 };
  demoPoints[28] = { x: centerX + 32, y: ankleY, visibility: 0.95 };
  demoPoints[31] = { x: centerX - 42, y: ankleY + 8, visibility: 0.95 };
  demoPoints[32] = { x: centerX + 42, y: ankleY + 8, visibility: 0.95 };

  drawSkeleton(ctx, demoPoints, angle);
}

function drawKneeExtensionDemo(ctx, cw, ch, angle, cfg) {
  // Posisi duduk: paha horizontal, kaki bawah berayun
  const centerX = cw * 0.5;
  const headY = ch * 0.22;
  const shoulderY = ch * 0.32;
  const seatY = ch * 0.52; // tinggi kursi
  const hipY = seatY;

  const demoPoints = buildBaseDemoPoints(33, centerX, headY);

  // Bahu
  demoPoints[11] = { x: centerX - 30, y: shoulderY, visibility: 0.9 };
  demoPoints[12] = { x: centerX + 30, y: shoulderY, visibility: 0.9 };
  // Siku & Tangan (memegang sisi kursi)
  demoPoints[13] = { x: centerX - 50, y: shoulderY + 25, visibility: 0.9 };
  demoPoints[14] = { x: centerX + 50, y: shoulderY + 25, visibility: 0.9 };
  demoPoints[15] = { x: centerX - 55, y: hipY + 10, visibility: 0.9 };
  demoPoints[16] = { x: centerX + 55, y: hipY + 10, visibility: 0.9 };
  // Panggul (di kursi)
  demoPoints[23] = { x: centerX - 25, y: hipY, visibility: 0.95 };
  demoPoints[24] = { x: centerX + 25, y: hipY, visibility: 0.95 };

  // Lutut: posisi tetap di depan kursi
  const kneeX = centerX;
  const kneeY = hipY + 10;
  const thighLength = 80;
  demoPoints[25] = { x: kneeX - 20 + thighLength * 0.6, y: kneeY, visibility: 0.95 };
  demoPoints[26] = { x: kneeX + 20 + thighLength * 0.6, y: kneeY, visibility: 0.95 };

  // Kaki bawah berayun berdasarkan sudut
  // angle 90° = kaki menekuk vertikal, 175° = kaki lurus horizontal
  const extensionRad = ((180 - angle) * Math.PI) / 180;
  const lowerLegLen = 90;
  const leftKneeX = demoPoints[25].x;
  const rightKneeX = demoPoints[26].x;

  const ankleLeftX = leftKneeX + Math.cos(extensionRad) * lowerLegLen;
  const ankleLeftY = kneeY + Math.sin(extensionRad) * lowerLegLen;
  const ankleRightX = rightKneeX + Math.cos(extensionRad) * lowerLegLen;
  const ankleRightY = kneeY + Math.sin(extensionRad) * lowerLegLen;

  demoPoints[27] = { x: ankleLeftX, y: ankleLeftY, visibility: 0.95 };
  demoPoints[28] = { x: ankleRightX, y: ankleRightY, visibility: 0.95 };
  demoPoints[31] = { x: ankleLeftX + 12, y: ankleLeftY + 6, visibility: 0.95 };
  demoPoints[32] = { x: ankleRightX + 12, y: ankleRightY + 6, visibility: 0.95 };

  // Gambar kursi (visual tambahan)
  drawChairGuide(ctx, centerX, seatY, cw);

  drawSkeleton(ctx, demoPoints, angle);
}

function drawHipAbductionDemo(ctx, cw, ch, angle, cfg) {
  // Berdiri, satu kaki bergerak ke samping
  const centerX = cw * 0.5;
  const headY = ch * 0.20;
  const shoulderY = ch * 0.30;
  const hipY = ch * 0.50;
  const standKneeY = ch * 0.72;
  const standAnkleY = ch * 0.90;

  const demoPoints = buildBaseDemoPoints(33, centerX, headY);

  // Bahu
  demoPoints[11] = { x: centerX - 34, y: shoulderY, visibility: 0.9 };
  demoPoints[12] = { x: centerX + 34, y: shoulderY, visibility: 0.9 };
  // Siku & Tangan (tangan di pinggang)
  demoPoints[13] = { x: centerX - 55, y: shoulderY + 20, visibility: 0.9 };
  demoPoints[14] = { x: centerX + 55, y: shoulderY + 20, visibility: 0.9 };
  demoPoints[15] = { x: centerX - 38, y: hipY - 10, visibility: 0.9 };
  demoPoints[16] = { x: centerX + 38, y: hipY - 10, visibility: 0.9 };
  // Panggul
  demoPoints[23] = { x: centerX - 22, y: hipY, visibility: 0.95 };
  demoPoints[24] = { x: centerX + 22, y: hipY, visibility: 0.95 };

  // Kaki kanan tetap (kaki tumpuan)
  demoPoints[26] = { x: centerX + 20, y: standKneeY, visibility: 0.95 };
  demoPoints[28] = { x: centerX + 18, y: standAnkleY, visibility: 0.95 };
  demoPoints[32] = { x: centerX + 28, y: standAnkleY + 6, visibility: 0.95 };

  // Kaki kiri bergerak ke samping (abduksi)
  // angle: 175° = rapat, 120° = terangkat ke samping
  const abductionAmount = (cfg.demoAngle.max - angle); // semakin besar = semakin terangkat
  const legSpreadX = 22 + abductionAmount * 1.8;
  const legLiftY = abductionAmount * 0.5;

  demoPoints[25] = {
    x: centerX - legSpreadX * 0.6,
    y: standKneeY - legLiftY * 0.6,
    visibility: 0.95,
  };
  demoPoints[27] = {
    x: centerX - legSpreadX,
    y: standAnkleY - legLiftY,
    visibility: 0.95,
  };
  demoPoints[31] = {
    x: centerX - legSpreadX - 8,
    y: standAnkleY - legLiftY + 6,
    visibility: 0.95,
  };

  drawSkeleton(ctx, demoPoints, angle, "HIP");
}

function drawShoulderRaiseDemo(ctx, cw, ch, angle, cfg) {
  const centerX = cw * 0.5;
  const headY = ch * 0.20;
  const shoulderY = ch * 0.32;
  const hipY = ch * 0.52;
  const kneeY = ch * 0.72;
  const ankleY = ch * 0.90;

  const demoPoints = buildBaseDemoPoints(33, centerX, headY);

  // Bahu
  const shoulderSpan = 38;
  demoPoints[11] = { x: centerX - shoulderSpan, y: shoulderY, visibility: 0.95 };
  demoPoints[12] = { x: centerX + shoulderSpan, y: shoulderY, visibility: 0.95 };

  // Panggul
  demoPoints[23] = { x: centerX - 24, y: hipY, visibility: 0.95 };
  demoPoints[24] = { x: centerX + 24, y: hipY, visibility: 0.95 };

  // Kaki tegak lurus
  demoPoints[25] = { x: centerX - 24, y: kneeY, visibility: 0.95 };
  demoPoints[26] = { x: centerX + 24, y: kneeY, visibility: 0.95 };
  demoPoints[27] = { x: centerX - 24, y: ankleY, visibility: 0.95 };
  demoPoints[28] = { x: centerX + 24, y: ankleY, visibility: 0.95 };

  // Tangan mengangkat: angle 25° (di samping badan) -> 90° (horizontal setinggi bahu)
  const armRad = (angle * Math.PI) / 180;
  const upperArmLen = 50;
  const foreArmLen = 55;

  // Siku & Pergelangan tangan kiri
  const leftElbowX = demoPoints[11].x - Math.sin(armRad) * upperArmLen;
  const leftElbowY = demoPoints[11].y + Math.cos(armRad) * upperArmLen;
  const leftWristX = demoPoints[11].x - Math.sin(armRad) * (upperArmLen + foreArmLen);
  const leftWristY = demoPoints[11].y + Math.cos(armRad) * (upperArmLen + foreArmLen);

  demoPoints[13] = { x: leftElbowX, y: leftElbowY, visibility: 0.95 };
  demoPoints[15] = { x: leftWristX, y: leftWristY, visibility: 0.95 };

  // Siku & Pergelangan tangan kanan
  const rightElbowX = demoPoints[12].x + Math.sin(armRad) * upperArmLen;
  const rightElbowY = demoPoints[12].y + Math.cos(armRad) * upperArmLen;
  const rightWristX = demoPoints[12].x + Math.sin(armRad) * (upperArmLen + foreArmLen);
  const rightWristY = demoPoints[12].y + Math.cos(armRad) * (upperArmLen + foreArmLen);

  demoPoints[14] = { x: rightElbowX, y: rightElbowY, visibility: 0.95 };
  demoPoints[16] = { x: rightWristX, y: rightWristY, visibility: 0.95 };

  drawSkeleton(ctx, demoPoints, angle, "SHOULDER");
}

function drawHipFlexorStretchDemo(ctx, cw, ch, angle, cfg) {
  // Postur lunge stretch (tampak samping / serong)
  const centerX = cw * 0.5;
  const headY = ch * 0.22;
  const shoulderY = ch * 0.32;
  const baseHipY = ch * 0.50;
  const stretchProgress = (cfg.demoAngle.max - angle) / (cfg.demoAngle.max - cfg.demoAngle.min);
  const hipY = baseHipY + stretchProgress * 25;

  const demoPoints = buildBaseDemoPoints(33, centerX, headY);

  // Bahu tegak
  demoPoints[11] = { x: centerX - 25, y: shoulderY, visibility: 0.95 };
  demoPoints[12] = { x: centerX + 25, y: shoulderY, visibility: 0.95 };

  // Tangan di panggul
  demoPoints[13] = { x: centerX - 42, y: shoulderY + 22, visibility: 0.9 };
  demoPoints[14] = { x: centerX + 42, y: shoulderY + 22, visibility: 0.9 };
  demoPoints[15] = { x: centerX - 28, y: hipY - 6, visibility: 0.9 };
  demoPoints[16] = { x: centerX + 28, y: hipY - 6, visibility: 0.9 };

  // Panggul
  demoPoints[23] = { x: centerX - 18, y: hipY, visibility: 0.95 };
  demoPoints[24] = { x: centerX + 18, y: hipY, visibility: 0.95 };

  // Kaki depan (kiri): melangkah maju dan menekuk (lunge)
  const frontKneeX = centerX - 60 - stretchProgress * 15;
  const frontKneeY = ch * 0.70 + stretchProgress * 10;
  const frontAnkleX = frontKneeX;
  const frontAnkleY = ch * 0.88;

  demoPoints[25] = { x: frontKneeX, y: frontKneeY, visibility: 0.95 };
  demoPoints[27] = { x: frontAnkleX, y: frontAnkleY, visibility: 0.95 };
  demoPoints[31] = { x: frontAnkleX - 10, y: frontAnkleY + 6, visibility: 0.95 };

  // Kaki belakang (kanan): meregang ke belakang
  const backKneeX = centerX + 55 + stretchProgress * 20;
  const backKneeY = ch * 0.76 + stretchProgress * 14;
  const backAnkleX = backKneeX + 45;
  const backAnkleY = ch * 0.88;

  demoPoints[26] = { x: backKneeX, y: backKneeY, visibility: 0.95 };
  demoPoints[28] = { x: backAnkleX, y: backAnkleY, visibility: 0.95 };
  demoPoints[32] = { x: backAnkleX + 8, y: backAnkleY + 6, visibility: 0.95 };

  drawSkeleton(ctx, demoPoints, angle, "HIP");
}

export default function CameraFeed({
  exercise = "Squat",
  isDemoMode = false,
  isActive = true, // false = pre-session, skip kamera & render
  onToggleDemo,
  kneeAngle = 151,
  movementPhase = "STANDING",
  repsCount = 0,
  onPoseCalculated,
  isPaused = false, // true = jeda sesi, stop tracking
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastDetectTimeRef = useRef(0);
  const demoAngleRef = useRef({ angle: 165, direction: -1, phase: "DESCENDING" });
  const loadTimeoutRef = useRef(null);

  const [cameraState, setCameraState] = useState({
    isLoading: true,
    isActive: false,
    error: null,
  });

  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError] = useState(null);

  // Ambil config exercise aktif
  const config = getExerciseConfig(exercise);

  // Reset demo angle ketika exercise berubah
  useEffect(() => {
    const cfg = getExerciseConfig(exercise);
    if (!cfg) return;
    demoAngleRef.current = {
      angle: cfg.demoAngle.max,
      direction: -1,
      phase: cfg.phases.descending,
    };
  }, [exercise]);

  // 1. Inisialisasi MediaPipe Tasks Vision Pose Landmarker
  useEffect(() => {
    if (!isActive) return; // Skip jika pre-session

    let isMounted = true;

    async function initMediaPipe() {
      try {
        console.log("[PhysioV AI] Inisialisasi MediaPipe Tasks Vision...");
        setIsModelLoading(true);
        const { FilesetResolver, PoseLandmarker } = await import(
          "@mediapipe/tasks-vision"
        );

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        if (!isMounted) return;

        let landmarker;
        try {
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          console.log("[PhysioV AI] Pose Landmarker siap dengan akselerasi GPU.");
        } catch (gpuError) {
          console.warn("[PhysioV AI] GPU delegate gagal, beralih ke CPU:", gpuError);
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
          });
          console.log("[PhysioV AI] Pose Landmarker siap dengan CPU.");
        }

        if (isMounted) {
          landmarkerRef.current = landmarker;
          setIsModelLoading(false);
        }
      } catch (err) {
        console.error("[PhysioV AI] Gagal memuat model Pose Landmarker:", err);
        if (isMounted) {
          setModelError("Gagal mengunduh model Pose Landmarker AI.");
          setIsModelLoading(false);
        }
      }
    }

    initMediaPipe();

    return () => {
      isMounted = false;
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close?.();
        } catch (e) {
          console.warn("Error closing landmarker:", e);
        }
        landmarkerRef.current = null;
      }
    };
  }, [isActive]);

  // 2. Akses Kamera getUserMedia
  const stopStream = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    if (streamRef.current) {
      console.log("[PhysioV Camera] Menghentikan stream kamera...");
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!isActive || isDemoMode) {
      stopStream();
      setCameraState({ isLoading: false, isActive: false, error: null });
      return;
    }

    stopStream();
    setCameraState({ isLoading: true, isActive: false, error: null });

    loadTimeoutRef.current = setTimeout(() => {
      setCameraState((prev) => {
        if (!prev.isActive && prev.isLoading) {
          console.warn("[PhysioV Camera] Camera connection timed out.");
          return {
            isLoading: false,
            isActive: false,
            error:
              "Kamera membutuhkan waktu terlalu lama untuk merespons (timeout). Pastikan browser mengizinkan kamera dan tidak digunakan aplikasi lain.",
          };
        }
        return prev;
      });
    }, 8000);

    try {
      console.log("[PhysioV Camera] Meminta izin kamera via getUserMedia...");
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Browser Anda tidak mendukung API navigator.mediaDevices.getUserMedia.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      console.log("[PhysioV Camera] Stream berhasil didapat. Tracks:", stream.getVideoTracks());
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        throw new Error("Elemen video tidak ditemukan dalam DOM.");
      }

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      let activated = false;
      const activatePlayback = async () => {
        if (activated) return;
        activated = true;

        try {
          console.log("[PhysioV Camera] Memulai video.play()...");
          await video.play();
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
          }
          console.log(
            `[PhysioV Camera] Video live aktif! Resolusi: ${video.videoWidth}x${video.videoHeight}`
          );
          setCameraState({ isLoading: false, isActive: true, error: null });
        } catch (playErr) {
          console.error("[PhysioV Camera] Autoplay gagal:", playErr);
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
          }
          setCameraState({
            isLoading: false,
            isActive: false,
            error: `Autoplay video diblokir browser: ${playErr.message}. Klik 'Coba Lagi'.`,
          });
        }
      };

      if (video.readyState >= 2 && video.videoWidth > 0) {
        activatePlayback();
      } else {
        video.onloadedmetadata = () => {
          console.log("[PhysioV Camera] Event onloadedmetadata terpanggil.");
          activatePlayback();
        };
        video.oncanplay = () => {
          console.log("[PhysioV Camera] Event oncanplay terpanggil.");
          activatePlayback();
        };
      }
    } catch (err) {
      console.error("[PhysioV Camera] Error saat startCamera:", err);
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }

      let errorMsg = `Gagal mengakses kamera: ${err.message || err.name}`;
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMsg = "Izin akses kamera ditolak. Silakan klik ikon gembok/kamera di address bar browser untuk mengizinkan akses.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMsg = "Perangkat kamera tidak ditemukan pada komputer/laptop Anda.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMsg = "Kamera sedang digunakan oleh program lain (Zoom/Teams/Chrome lain). Harap tutup aplikasi tersebut.";
      }

      setCameraState({ isLoading: false, isActive: false, error: errorMsg });
    }
  }, [isActive, isDemoMode, stopStream]);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      startCamera();
    }, 0);
    return () => {
      clearTimeout(startTimer);
      stopStream();
    };
  }, [startCamera, stopStream]);

  const onPoseCalculatedRef = useRef(onPoseCalculated);
  useEffect(() => {
    onPoseCalculatedRef.current = onPoseCalculated;
  }, [onPoseCalculated]);

  // 3. Render Loop dengan Throttling Max 15-20 FPS (Interval ~55ms)
  useEffect(() => {
    if (!isActive) return; // Skip render loop jika pre-session

    const FPS_LIMIT_MS = 1000 / 18;

    function renderPose(timestamp) {
      animFrameRef.current = requestAnimationFrame(renderPose);

      // Skip processing if paused
      if (isPaused) {
        return;
      }

      if (timestamp - lastDetectTimeRef.current < FPS_LIMIT_MS) {
        return;
      }
      lastDetectTimeRef.current = timestamp;

      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const cw = container.clientWidth;
      const ch = container.clientHeight;

      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, cw, ch);

      const currentConfig = getExerciseConfig(exercise);

      // Jika config exercise tidak ditemukan, render pesan error visual pada canvas
      if (!currentConfig) {
        ctx.fillStyle = "rgba(18, 30, 49, 0.9)";
        ctx.fillRect(0, 0, cw, ch);
        ctx.fillStyle = "#EF4444";
        ctx.font = "bold 15px -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("⚠️ Konfigurasi exercise tidak ditemukan", cw / 2, ch / 2 - 10);
        ctx.fillStyle = "#94A3B8";
        ctx.font = "12px -apple-system, sans-serif";
        ctx.fillText("Hubungi admin untuk mendaftarkan konfigurasi latihan ini.", cw / 2, ch / 2 + 15);
        return;
      }

      // --- Skenario A: Mode Kamera Nyata dengan MediaPipe ---
      if (!isDemoMode && cameraState.isActive && videoRef.current) {
        const video = videoRef.current;
        if (
          video.readyState >= 2 &&
          landmarkerRef.current &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        ) {
          try {
            const now = performance.now();
            const poseResult = landmarkerRef.current.detectForVideo(video, now);

            if (poseResult?.landmarks?.length > 0) {
              const rawLandmarks = poseResult.landmarks[0];
              const vw = video.videoWidth;
              const vh = video.videoHeight;

              const mappedLandmarks = rawLandmarks.map((lm) =>
                mapLandmarkToCanvas(lm, cw, ch, vw, vh, true)
              );

              // Kalkulasi sudut berdasarkan exercise yang aktif
              const lmConfig = currentConfig.landmarks;
              const leftA = rawLandmarks[lmConfig.left.a];
              const leftB = rawLandmarks[lmConfig.left.b];
              const leftC = rawLandmarks[lmConfig.left.c];
              const rightA = rawLandmarks[lmConfig.right.a];
              const rightB = rawLandmarks[lmConfig.right.b];
              const rightC = rawLandmarks[lmConfig.right.c];

              const leftAngle = calculateAngle(leftA, leftB, leftC);
              const rightAngle = calculateAngle(rightA, rightB, rightC);

              const leftVis = Math.min(
                leftA?.visibility ?? 1,
                leftB?.visibility ?? 1,
                leftC?.visibility ?? 1
              );
              const rightVis = Math.min(
                rightA?.visibility ?? 1,
                rightB?.visibility ?? 1,
                rightC?.visibility ?? 1
              );

              let currentAngle = 180;
              if (leftVis >= 0.35 && rightVis >= 0.35) {
                if (currentConfig.jointLabel === "SHOULDER") {
                  // Shoulder raise: unilateral/bilateral arm elevation (sudut lengan terangkat lebih besar)
                  currentAngle = Math.max(leftAngle, rightAngle);
                } else if (currentConfig.id === "hip-abduction" || currentConfig.id === "hip-flexor-stretch") {
                  // Hip abduction / stretch: sendi aktif yang meregang / abduksi memiliki sudut lebih kecil
                  currentAngle = Math.min(leftAngle, rightAngle);
                } else if (currentConfig.direction === "increasing") {
                  // Knee extension: unilateral seated, kaki yang meluruskan memiliki sudut lebih besar (membesar dari 90° ke 160°)
                  currentAngle = Math.max(leftAngle, rightAngle);
                } else {
                  // Squat: bilateral
                  if (Math.abs(leftAngle - rightAngle) > 20) {
                    currentAngle = Math.min(leftAngle, rightAngle);
                  } else {
                    currentAngle = Math.round((leftAngle + rightAngle) / 2);
                  }
                }
              } else if (leftVis >= 0.35) {
                currentAngle = leftAngle;
              } else if (rightVis >= 0.35) {
                currentAngle = rightAngle;
              } else {
                currentAngle = currentConfig.direction === "increasing"
                  ? Math.max(leftAngle, rightAngle)
                  : Math.min(leftAngle, rightAngle);
              }

              // Tentukan phase display berdasarkan config threshold
              const th = currentConfig.thresholds;
              let currentPhase = currentConfig.phases.idle;
              if (currentConfig.direction === "decreasing") {
                if (currentAngle <= th.reachBottom) currentPhase = currentConfig.phases.bottom;
                else if (currentAngle < th.startDescending) currentPhase = currentConfig.phases.descending;
              } else {
                // increasing (Knee Extension, Shoulder Raise)
                if (currentAngle >= th.reachBottom) currentPhase = currentConfig.phases.bottom;
                else if (currentAngle > th.startDescending) currentPhase = currentConfig.phases.descending;
              }

              drawSkeleton(ctx, mappedLandmarks, currentAngle, currentConfig.jointLabel);

              onPoseCalculatedRef.current?.({
                kneeAngle: currentAngle,
                leftKnee: leftAngle,
                rightKnee: rightAngle,
                phase: currentPhase,
                isDemo: false,
              });
            } else {
              const now = performance.now();
              if (now - (lastDetectTimeRef.current || 0) > 2000) {
                console.warn("[PhysioV Pose] ⚠️ Tubuh belum terdeteksi. Mundur sedikit agar kepala hingga lutut/kaki terlihat di kamera.");
              }
            }
          } catch (detectionErr) {
            console.warn("[PhysioV Pose] Frame deteksi dilewati:", detectionErr);
          }
        }
      }

      // --- Skenario B: Mode Simulasi Demo (Per Exercise) ---
      if (isDemoMode) {
        const demo = demoAngleRef.current;
        const dmCfg = currentConfig.demoAngle;

        demo.angle += demo.direction * dmCfg.speed;
        if (demo.angle <= dmCfg.min) {
          demo.direction = 1;
          demo.phase = currentConfig.phases.ascending;
        } else if (demo.angle >= dmCfg.max) {
          demo.direction = -1;
          demo.phase = currentConfig.phases.descending;
        }

        const currentDemoAngle = Math.round(demo.angle);

        // ─── Gambar stick figure berbeda per exercise ───
        if (currentConfig.id === "squat") {
          drawSquatDemo(ctx, cw, ch, currentDemoAngle, currentConfig);
        } else if (currentConfig.id === "knee-extension") {
          drawKneeExtensionDemo(ctx, cw, ch, currentDemoAngle, currentConfig);
        } else if (currentConfig.id === "shoulder-raise") {
          drawShoulderRaiseDemo(ctx, cw, ch, currentDemoAngle, currentConfig);
        } else if (currentConfig.id === "hip-flexor-stretch") {
          drawHipFlexorStretchDemo(ctx, cw, ch, currentDemoAngle, currentConfig);
        } else if (currentConfig.id === "hip-abduction") {
          drawHipAbductionDemo(ctx, cw, ch, currentDemoAngle, currentConfig);
        }

        onPoseCalculatedRef.current?.({
          kneeAngle: currentDemoAngle,
          leftKnee: currentDemoAngle,
          rightKnee: currentDemoAngle,
          phase: demo.phase,
          isDemo: true,
        });
      }
    }

    animFrameRef.current = requestAnimationFrame(renderPose);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isDemoMode, cameraState.isActive, isActive, exercise, isPaused]);

  // ─── JSX ───

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[460px] lg:min-h-[520px] bg-[#121E31] rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center p-3 lg:p-4"
    >
      {/* Container Video Utama */}
      <div className="relative w-full max-w-[640px] h-full min-h-[440px] lg:min-h-[490px] rounded-2xl overflow-hidden bg-[#0C1524] flex items-center justify-center border border-white/10 shadow-inner">
        
        {/* Video element selalu terpasang di DOM */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover -scale-x-100 transition-opacity duration-300 ${
            isActive && !isDemoMode && cameraState.isActive ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
          }`}
        />

        {/* Pre-Session: tampilkan placeholder */}
        {!isActive && (
          <div className="w-full h-full relative bg-gradient-to-b from-[#162744] via-[#101D33] to-[#0A1220] flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-15 flex items-center justify-center">
              <div className="w-80 h-80 rounded-full bg-white/10 blur-3xl" />
            </div>
            <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Activity className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-sm font-bold text-white/50 uppercase tracking-widest">
                Kamera Standby
              </p>
              <p className="text-xs text-white/30 max-w-xs">
                Tekan &quot;Start Session&quot; untuk memulai tracking {config.name}
              </p>
            </div>
          </div>
        )}

        {/* Demo Mode Ambient Background */}
        {isActive && isDemoMode && (
          <div className="w-full h-full relative bg-gradient-to-b from-[#162744] via-[#101D33] to-[#0A1220] flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-20 flex items-center justify-center">
              <div className="w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl animate-pulse" />
            </div>
            <div className="absolute bottom-6 z-10">
              <p className="text-xs tracking-wider uppercase font-extrabold text-emerald-400/90 bg-emerald-950/70 px-3.5 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-md">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Simulasi Kinematik {config.name} (18 FPS)
              </p>
            </div>
          </div>
        )}

        {/* Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Status Loader MediaPipe Model */}
        {isActive && isModelLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 flex items-center gap-2 text-white text-xs">
            <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
            <span>Memuat MediaPipe AI...</span>
          </div>
        )}

        {/* Model Error Warning */}
        {isActive && modelError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-amber-500/90 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md">
            <AlertCircle className="w-4 h-4" />
            <span>{modelError}</span>
          </div>
        )}

        {/* State: Camera Loading */}
        {isActive && !isDemoMode && cameraState.isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 text-white/80 p-6 text-center z-20">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-base font-medium">Menghubungkan ke kamera...</p>
            <p className="text-xs text-white/50 max-w-xs">
              Sedang mengaktifkan feed video webcam...
            </p>
          </div>
        )}

        {/* State: Camera Error */}
        {isActive && !isDemoMode && !cameraState.isLoading && cameraState.error && (
          <div className="flex flex-col items-center justify-center gap-3 text-white p-6 text-center max-w-md z-20 bg-[#0C1524]/90 backdrop-blur-md rounded-2xl border border-red-500/20 m-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-1">
              <CameraOff className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-white">Kendala Akses Kamera</h3>
            <p className="text-xs text-red-200/90 leading-relaxed font-medium bg-red-950/40 p-2.5 rounded-xl border border-red-900/40">
              {cameraState.error}
            </p>
            <div className="flex flex-wrap gap-2.5 mt-2 justify-center">
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors border border-white/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Coba Hubungkan Ulang
              </button>
              {onToggleDemo && (
                <button
                  type="button"
                  onClick={onToggleDemo}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-slate-950 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Gunakan Demo Mode
                </button>
              )}
            </div>
          </div>
        )}

        {/* Overlay Badges: Sudut & Fase Gerakan — hanya saat sesi aktif */}
        {isActive && (
          <>
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 shadow-lg pointer-events-none">
              <span className="text-[11px] font-bold tracking-widest text-[#4EBA87] uppercase">
                {movementPhase}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                  {kneeAngle}°
                </span>
                <span className="text-[11px] font-bold text-white/70 uppercase">
                  {config.jointLabel}
                </span>
              </div>
            </div>

            <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1.5 pointer-events-none">
              <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 shadow-md">
                <span className="text-[11px] font-semibold tracking-wider text-white/75 uppercase">
                  Reps
                </span>
                <span className="text-base font-bold text-white">{repsCount}</span>
              </div>
              {isDemoMode && (
                <div className="bg-amber-500/25 border border-amber-400/40 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm">
                  <p className="text-[10px] font-bold text-amber-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Reps tidak dihitung dalam mode demo
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
