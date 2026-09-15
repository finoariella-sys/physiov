/**
 * PhysioV Mock API Service
 * 
 * Sesuai kesepakatan API Contract:
 * POST /api/exercises/analyze
 * Request:
 * {
 *   "exercise_id": "squat",
 *   "angles": { "left_knee": 85, "right_knee": 90 }
 * }
 * Response:
 * {
 *   "status": "success",
 *   "feedback": "Jaga posisi lutut",
 *   "form_score": 72,
 *   "rep_valid": true
 * }
 */

export const ACTIVE_PATIENT = {
  id: "p1",
  name: "Eleanor Voss",
  initials: "EV",
  condition: "POST KNEE REPLACEMENT (LEFT)",
  clinician: "Dr. Rivera",
  targetReps: 50,
  totalRepsCompleted: 24,
  completedReps: 0,
};

export const EXERCISE_OPTIONS = [
  { id: "squat", name: "Squat", targetAngleMin: 80, targetAngleMax: 100 },
  { id: "knee-extension", name: "Knee Extension", targetAngleMin: 160, targetAngleMax: 180 },
  { id: "shoulder-raise", name: "Shoulder Raise", targetAngleMin: 80, targetAngleMax: 95 },
  { id: "hip-flexor-stretch", name: "Hip Flexor Stretch", targetAngleMin: 105, targetAngleMax: 125 },
  { id: "hip-abduction", name: "Hip Abduction", targetAngleMin: 35, targetAngleMax: 45 },
];

/**
 * Mock endpoint: /api/exercises/analyze
 * Mengkalkulasi feedback form dan akurasi berdasarkan sudut sendi.
 */
export async function analyzeExercise({ exercise_id = "squat", angles = {} }) {
  // Simulasi network latency pendek (10-30ms)
  await new Promise((resolve) => setTimeout(resolve, 20));

  const leftAngle = angles.left_knee ?? angles.left ?? 180;
  const rightAngle = angles.right_knee ?? angles.right ?? 180;
  const avgAngle = (leftAngle + rightAngle) / 2;
  const asymmetry = Math.abs(leftAngle - rightAngle);

  const exId = String(exercise_id).toLowerCase().trim().replace(/[\s_]+/g, "-");

  let feedback = "Posisi siap";
  let formScore = 95;
  let repValid = false;

  if (exId === "squat") {
    if (avgAngle > 155) {
      feedback = "Mulai turun perlahan (Squat)";
      formScore = 90;
      repValid = false;
    } else if (avgAngle > 115) {
      feedback = "Turunkan lebih dalam";
      formScore = 78;
      repValid = false;
    } else if (avgAngle >= 75 && avgAngle <= 110) {
      if (asymmetry > 15) {
        feedback = "Seimbangkan beban pada kedua kaki";
        formScore = 68;
        repValid = true;
      } else {
        feedback = "Bagus, kedalaman optimal! Dorong naik";
        formScore = 94;
        repValid = true;
      }
    } else if (avgAngle < 75) {
      feedback = "Terlalu rendah, angkat sedikit panggul";
      formScore = 65;
      repValid = true;
    }
  } else if (exId === "knee-extension") {
    // Knee Extension: gunakan sudut kaki aktif yang meluruskan (Math.max)
    const activeKnee = Math.max(leftAngle, rightAngle);
    if (activeKnee < 115) {
      feedback = "Posisi duduk siap. Luruskan kaki perlahan";
      formScore = 90;
      repValid = false;
    } else if (activeKnee < 155) {
      feedback = "Terus luruskan kaki, hampir mencapai ekstensi penuh";
      formScore = 82;
      repValid = false;
    } else {
      feedback = "Ekstensi penuh tercapai! Tahan sejenak lalu tekuk kembali";
      formScore = 95;
      repValid = true;
    }
  } else if (exId === "shoulder-raise") {
    // Shoulder Raise: gunakan sudut lengan aktif yang terangkat (Math.max)
    const activeShoulder = Math.max(leftAngle, rightAngle);
    if (activeShoulder < 45) {
      feedback = "Mulai angkat lengan perlahan setinggi bahu";
      formScore = 90;
      repValid = false;
    } else if (activeShoulder < 80) {
      feedback = "Terus angkat hingga sejajar bahu";
      formScore = 82;
      repValid = false;
    } else if (activeShoulder >= 80 && activeShoulder <= 95) {
      feedback = "Ketinggian optimal! Tahan sejenak lalu turunkan perlahan";
      formScore = 95;
      repValid = true;
    } else {
      feedback = "Jangan angkat melebihi tinggi bahu";
      formScore = 70;
      repValid = true;
    }
  } else if (exId === "hip-flexor-stretch") {
    // Hip Flexor Stretch: gunakan sudut panggul lunge stretch (Math.min, menurun ke ~115°)
    const activeHip = Math.min(leftAngle, rightAngle);
    if (activeHip > 155) {
      feedback = "Mulai condongkan panggul ke depan perlahan (Stretch)";
      formScore = 90;
      repValid = false;
    } else if (activeHip > 125) {
      feedback = "Dorong panggul lebih dalam ke depan";
      formScore = 82;
      repValid = false;
    } else if (activeHip >= 105 && activeHip <= 125) {
      feedback = "Regangan optimal tercapai! Tahan sejenak lalu kembali";
      formScore = 95;
      repValid = true;
    } else {
      feedback = "Regangan terlalu dalam, jaga postur punggung tetap tegak";
      formScore = 70;
      repValid = true;
    }
  } else if (exId === "hip-abduction") {
    // Hip Abduction: gunakan sudut panggul aktif yang abduksi (Math.min, menurun ke ~150°)
    const activeHip = Math.min(leftAngle, rightAngle);
    if (activeHip > 164) {
      feedback = "Posisi berdiri siap. Angkat satu kaki ke samping perlahan";
      formScore = 90;
      repValid = false;
    } else if (activeHip > 152) {
      feedback = "Terus angkat ke samping, jaga pinggul tetap stabil";
      formScore = 82;
      repValid = false;
    } else if (activeHip >= 135 && activeHip <= 152) {
      feedback = "Abduksi optimal! Tahan 1-2 detik lalu kembali perlahan";
      formScore = 94;
      repValid = true;
    } else if (activeHip < 135) {
      feedback = "Cukup, jangan terlalu lebar — jaga kontrol otot pinggul";
      formScore = 70;
      repValid = true;
    }
  } else {
    // Default fallback
    feedback = "Jaga posisi sendi dan ritme gerakan";
    formScore = 80;
    repValid = true;
  }

  return {
    status: "success",
    feedback,
    form_score: Math.round(formScore),
    rep_valid: repValid,
  };
}

/**
 * Data Riwayat Sesi Awal (Default Historical Sessions)
 * Terurut dari terbaru ke terlama.
 */
export const DEFAULT_SESSION_HISTORY = [
  {
    sessionId: "sess-20240524-0930",
    date: "24 Mei 2024 · 09:30 WIB",
    exercise: "Squat",
    totalReps: 10,
    targetReps: 10,
    overallFormScore: 82,
    formAccuracy: { optimal: 72, variant: 20, critical: 8 },
    repQuality: { perfect: 7, minor: 2, failed: 1 },
    stabilityCoefficient: 0.61,
    fatigueResistance: 78,
    patient: { id: "p1", name: "Eleanor Voss" },
    patientName: "Eleanor Voss",
  },
  {
    sessionId: "sess-20240522-1415",
    date: "22 Mei 2024 · 14:15 WIB",
    exercise: "Squat",
    totalReps: 8,
    targetReps: 10,
    overallFormScore: 78,
    formAccuracy: { optimal: 65, variant: 25, critical: 10 },
    repQuality: { perfect: 5, minor: 2, failed: 1 },
    stabilityCoefficient: 0.58,
    fatigueResistance: 72,
    patient: { id: "p1", name: "Eleanor Voss" },
    patientName: "Eleanor Voss",
  },
  {
    sessionId: "sess-20240519-1000",
    date: "19 Mei 2024 · 10:00 WIB",
    exercise: "Squat",
    totalReps: 6,
    targetReps: 10,
    overallFormScore: 74,
    formAccuracy: { optimal: 58, variant: 30, critical: 12 },
    repQuality: { perfect: 3, minor: 2, failed: 1 },
    stabilityCoefficient: 0.52,
    fatigueResistance: 68,
    patient: { id: "p1", name: "Eleanor Voss" },
    patientName: "Eleanor Voss",
  },
];

let memorySessionHistory = [...DEFAULT_SESSION_HISTORY];

/**
 * Membaca riwayat sesi dari localStorage atau memory
 */
export function getLocalSessionHistory() {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("physiov_session_history");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Gagal membaca history dari localStorage:", e);
    }
  }
  return memorySessionHistory;
}

/**
 * Menyimpan sesi baru ke riwayat (selalu ditambahkan di paling depan/paling atas)
 * dan mengupdate data reps pasien secara AKUMULATIF (totalRepsCompleted += sessionReps)
 */
export function saveSessionToHistory(sessionData) {
  const currentHistory = getLocalSessionHistory();
  const currentActivePt = sessionData.patient || getActivePatient() || ACTIVE_PATIENT;
  const sessionReps = Number(sessionData.totalReps) || 0;

  // Update profil pasien di physiov_patients: reps bertambah secara akumulatif
  let updatedPt = null;
  try {
    const rawPatients = getRawLocalPatients();
    let patientMatched = false;

    const updatedPatients = rawPatients.map((p) => {
      const matchId = p.id && currentActivePt.id && p.id === currentActivePt.id;
      const matchName =
        p.name &&
        currentActivePt.name &&
        p.name.toLowerCase().trim() === currentActivePt.name.toLowerCase().trim();

      if (matchId || matchName) {
        patientMatched = true;
        const prevCompleted = Math.max(
          Number(p.totalRepsCompleted) || 0,
          Number(currentActivePt.totalRepsCompleted) || 0
        );
        const newTotalRepsCompleted = prevCompleted + sessionReps;
        const targetReps = Number(p.targetReps) > 0
          ? Number(p.targetReps)
          : (Number(currentActivePt.targetReps) || sessionData.originalTargetReps || 50);

        let newStatus = "NO SESSION";
        let newStatusType = "neutral";
        if (newTotalRepsCompleted >= targetReps) {
          newStatus = "COMPLETED";
          newStatusType = "completed";
        } else if (newTotalRepsCompleted > 0) {
          newStatus = "ON TRACK";
          newStatusType = "success";
        }

        updatedPt = {
          ...p,
          targetReps,
          totalRepsCompleted: newTotalRepsCompleted,
          avgForm: sessionData.overallFormScore || p.avgForm || 80,
          reps: `${newTotalRepsCompleted}/${targetReps}`,
          status: newStatus,
          statusType: newStatusType,
        };
        return updatedPt;
      }
      return p;
    });

    if (!patientMatched && currentActivePt) {
      const prevCompleted = Number(currentActivePt.totalRepsCompleted) || 0;
      const newTotalRepsCompleted = prevCompleted + sessionReps;
      const targetReps = Number(currentActivePt.targetReps) > 0
        ? Number(currentActivePt.targetReps)
        : (sessionData.originalTargetReps || 50);

      let newStatus = newTotalRepsCompleted >= targetReps ? "COMPLETED" : newTotalRepsCompleted > 0 ? "ON TRACK" : "NO SESSION";
      let newStatusType = newTotalRepsCompleted >= targetReps ? "completed" : newTotalRepsCompleted > 0 ? "success" : "neutral";

      updatedPt = {
        ...currentActivePt,
        targetReps,
        totalRepsCompleted: newTotalRepsCompleted,
        avgForm: sessionData.overallFormScore || 80,
        reps: `${newTotalRepsCompleted}/${targetReps}`,
        status: newStatus,
        statusType: newStatusType,
      };
      updatedPatients.push(updatedPt);
    }

    saveLocalPatients(updatedPatients);
    if (updatedPt) {
      setActivePatient(updatedPt);
    }
  } catch (err) {
    console.error("Gagal update profil pasien setelah sesi:", err);
  }

  const enrichedSession = {
    ...sessionData,
    patient: updatedPt || currentActivePt,
    patientName: (updatedPt || currentActivePt).name,
  };

  const updatedHistory = [
    enrichedSession,
    ...currentHistory.filter((s) => s.sessionId !== sessionData.sessionId),
  ];
  memorySessionHistory = updatedHistory;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("physiov_session_history", JSON.stringify(updatedHistory));
      sessionStorage.setItem(`session_${sessionData.sessionId}`, JSON.stringify(enrichedSession));
      sessionStorage.setItem("latest_session", JSON.stringify(enrichedSession));
    } catch (e) {
      console.error("Gagal menyimpan session ke storage:", e);
    }
  }

  return {
    status: "success",
    data: enrichedSession,
  };
}

/**
 * Mock endpoint: GET /api/sessions/history
 * Mengembalikan list sesi terurut dari TERBARU ke TERLAMA
 */
export async function getSessionHistory() {
  await new Promise((resolve) => setTimeout(resolve, 30));
  const history = getLocalSessionHistory();
  return {
    status: "success",
    data: history,
  };
}

/**
 * Mock endpoint: GET /api/sessions/:sessionId
 */
export async function getSessionById(sessionId) {
  await new Promise((resolve) => setTimeout(resolve, 20));
  const history = getLocalSessionHistory();
  let session = null;

  if (typeof window !== "undefined") {
    try {
      if (sessionId === "latest") {
        const storedLatest = sessionStorage.getItem("latest_session");
        if (storedLatest) session = JSON.parse(storedLatest);
      } else {
        const storedSess = sessionStorage.getItem(`session_${sessionId}`);
        if (storedSess) session = JSON.parse(storedSess);
      }
    } catch { }
  }

  if (!session) {
    if (sessionId === "latest") {
      session = history[0] || DEFAULT_SESSION_HISTORY[0];
    } else {
      session = history.find((s) => s.sessionId === sessionId);
    }
  }

  return {
    status: "success",
    data: session || history[0] || DEFAULT_SESSION_HISTORY[0],
  };
}

/**
 * Mock endpoint: GET /api/sessions/analytics
 * Menghasilkan struktur analytics penuh sesuai data real yang tersimpan
 */
export async function getSessionAnalytics(sessionId = "latest") {
  await new Promise((resolve) => setTimeout(resolve, 30));

  const history = getLocalSessionHistory();
  let session = null;

  // Cek sessionStorage browser dulu jika ada
  if (typeof window !== "undefined") {
    try {
      if (sessionId === "latest") {
        const storedLatest = sessionStorage.getItem("latest_session");
        if (storedLatest) session = JSON.parse(storedLatest);
      } else {
        const storedSess = sessionStorage.getItem(`session_${sessionId}`);
        if (storedSess) session = JSON.parse(storedSess);
      }
    } catch { }
  }

  // Cek dari history
  if (!session) {
    if (sessionId === "latest") {
      session = history[0] || DEFAULT_SESSION_HISTORY[0];
    } else {
      session = history.find((s) => s.sessionId === sessionId);
    }
  }

  // Fallback ke sesi pertama
  if (!session) {
    session = history[0] || DEFAULT_SESSION_HISTORY[0];
  }

  const score = session.overallFormScore ?? 82;
  const grade =
    score >= 90 ? "A" : score >= 80 ? "B+" : score >= 70 ? "B" : score >= 60 ? "C" : "D";
  const status = score >= 80 ? "OPTIMAL PROGRESS" : "NEEDS REVIEW";
  const optimal = session.formAccuracy?.optimal ?? 72;
  const variant = session.formAccuracy?.variant ?? 20;
  const critical = session.formAccuracy?.critical ?? 8;
  const totalReps = session.totalReps ?? 10;
  const targetReps = session.targetReps ?? 10;

  const perfect = session.repQuality?.perfect ?? Math.round(totalReps * 0.7);
  const minor = session.repQuality?.minor ?? Math.round(totalReps * 0.2);
  const failed = session.repQuality?.failed ?? Math.max(0, totalReps - perfect - minor);

  const activePt = session.patient || getActivePatient() || ACTIVE_PATIENT;
  const formattedData = {
    sessionId: session.sessionId,
    patient: {
      id: activePt.id || "pt-01",
      name: activePt.name || "Eleanor Voss",
      condition: activePt.condition || "POST KNEE REPLACEMENT (LEFT)",
      clinician: activePt.clinician || "Dr. Rivera",
      sessionDate: session.date || "24 Mei 2024 · 09:30 WIB",
      exercise: session.exercise || "Squat",
    },
    overallScore: {
      score,
      grade,
      status,
      statusBadgeColor: score >= 80 ? "emerald" : "amber",
      totalReps,
      targetReps,
      sessionsCount: history.length,
      duration: "12m 45s",
    },
    accuracyMetric: {
      optimal,
      variant,
      critical,
      details: [
        {
          title: "Optimal Alignment",
          desc: "Shoulder-to-hip vector within 5°",
          type: "optimal",
          icon: "check",
        },
        {
          title: "Variant Path",
          desc: "Compensatory chain shift (Knee valgus tendency)",
          type: "variant",
          icon: "triangle",
        },
        {
          title: "Critical Failure",
          desc: "Hyper-extension at peak load (> 10° deviation)",
          type: "critical",
          icon: "circle",
        },
      ],
    },
    repQualityDistribution: {
      total: totalReps,
      items: [
        { name: "Perfect Execution", value: perfect, color: "#152238" },
        { name: "Minor Deviations", value: minor, color: "#D6C3A8" },
        { name: "Failed Reps", value: failed, color: "#D9534F" },
      ],
    },
    clinicalInsight: {
      stabilityCoefficient: session.stabilityCoefficient ?? 0.61,
      stabilityChange: session.stabilityCoefficient <= 0.65 ? "-2%" : "+1%",
      stabilityDirection: "improving",
      fatigueResistance: session.fatigueResistance ?? 78,
      maxFatigue: 100,
      aiInterpretation:
        score >= 88
          ? `Outstanding neuromuscular control during ${session.exercise || "Squat"}. Average form reached ${score}%. Bilateral symmetry improved with minimal valgus deviation.`
          : score >= 75
            ? `Core-extremity coordination is reaching functional maturity. Pelvic tilt control is steady with minor compensatory chain shift under fatigue.`
            : `Compensatory hip elevation observed during peak flexion. Recommend reducing rep speed and focusing on bilateral load symmetry.`,
      validatorBadge: "Validated by AI Clinician Assist & Human Review",
    },
  };

  return {
    status: "success",
    data: formattedData,
    ...formattedData,
  };
}

export const SESSION_ANALYTICS_DATA = {
  patient: {
    id: "pt-01",
    name: "Eleanor Voss",
    condition: "POST KNEE REPLACEMENT (LEFT)",
    clinician: "Dr. Rivera",
    sessionDate: "24 Mei 2024 · 09:30 WIB",
  },
  overallScore: {
    score: 82,
    grade: "B+",
    status: "OPTIMAL PROGRESS",
    statusBadgeColor: "emerald",
    totalReps: 10,
    targetReps: 10,
    sessionsCount: 4,
    duration: "12m 45s",
  },
  accuracyMetric: {
    optimal: 72,
    variant: 20,
    critical: 8,
    details: [
      {
        title: "Optimal Alignment",
        desc: "Shoulder-to-hip vector within 5°",
        type: "optimal",
        icon: "check",
      },
      {
        title: "Variant Path",
        desc: "Compensatory chain shift (Knee valgus tendency)",
        type: "variant",
        icon: "triangle",
      },
      {
        title: "Critical Failure",
        desc: "Hyper-extension at peak load (> 10° deviation)",
        type: "critical",
        icon: "circle",
      },
    ],
  },
  repQualityDistribution: {
    total: 10,
    items: [
      { name: "Perfect Execution", value: 7, color: "#152238" },
      { name: "Minor Deviations", value: 2, color: "#D6C3A8" },
      { name: "Failed Reps", value: 1, color: "#D9534F" },
    ],
  },
  clinicalInsight: {
    stabilityCoefficient: 0.61,
    stabilityChange: "-2%",
    stabilityDirection: "improving",
    fatigueResistance: 78,
    maxFatigue: 100,
    aiInterpretation:
      "Core-extremity coordination is reaching functional maturity. Pelvic tilt control is now automatic at sub-maximal loads. Left knee valgus tendency reduced by 14% compared to baseline session.",
    validatorBadge: "Validated by AI Clinician Assist & Human Review",
  },
};

/**
 * Data Pasien Standar Awal (Acuan Gambar 3 Recova)
 */
export const DEFAULT_PATIENTS = [
  {
    id: "p1",
    name: "Eleanor Voss",
    initials: "EV",
    clinician: "Dr. Rivera",
    condition: "Post knee replacement (left)",
    targetReps: 50,
    totalRepsCompleted: 24,
    avgForm: 78,
    reps: "24/50",
    status: "ON TRACK",
    statusType: "success",
  },
  {
    id: "p2",
    name: "Marcus Chen",
    initials: "MC",
    clinician: "Dr. Rivera",
    condition: "ACL reconstruction recovery",
    targetReps: 40,
    totalRepsCompleted: 0,
    avgForm: null,
    reps: "0/40",
    status: "NO SESSION",
    statusType: "neutral",
  },
  {
    id: "p3",
    name: "Rosa Delgado",
    initials: "RD",
    clinician: "Dr. Patel",
    condition: "Hip flexor rehabilitation",
    targetReps: 30,
    totalRepsCompleted: 0,
    avgForm: null,
    reps: "0/30",
    status: "NO SESSION",
    statusType: "neutral",
  },
];

let memoryPatients = [...DEFAULT_PATIENTS];

/**
 * Membaca raw data pasien dari localStorage atau memory tanpa kalkulasi
 */
export function getRawLocalPatients() {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("physiov_patients");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalisasi data lama agar targetReps dan totalRepsCompleted konsisten
          const normalized = parsed.map((p) => {
            let targetReps = Number(p.targetReps);
            if (p.id === "p1" && (!targetReps || targetReps === 10)) targetReps = 50;
            else if (p.id === "p2" && (!targetReps || targetReps === 10)) targetReps = 40;
            else if (p.id === "p3" && (!targetReps || targetReps === 10 || targetReps === 12)) targetReps = 30;
            else if (!targetReps) targetReps = 50;

            const totalRepsCompleted =
              typeof p.totalRepsCompleted === "number"
                ? p.totalRepsCompleted
                : p.id === "p1"
                  ? 24
                  : 0;

            return {
              ...p,
              targetReps,
              totalRepsCompleted,
              reps: `${totalRepsCompleted}/${targetReps}`,
            };
          });
          memoryPatients = normalized;
          return normalized;
        }
      }
    } catch (e) {
      console.error("Gagal membaca daftar pasien dari storage:", e);
    }
  }
  return memoryPatients;
}

/**
 * Menyinkronkan daftar pasien dengan riwayat sesi yang tersimpan di storage
 * Menghitung akumulasi totalRepsCompleted dari SELURUH sesi di history
 * dan menentukan 3 kemungkinan status: NO SESSION, ON TRACK, COMPLETED
 */
export function enrichPatientsWithHistory(patientsList) {
  if (!Array.isArray(patientsList)) return [];
  const history = getLocalSessionHistory();

  return patientsList.map((pt) => {
    // Cari semua sesi yang terkait dengan pasien ini
    const ptSessions = history.filter((s) => {
      const matchId = s.patient?.id && pt.id && s.patient.id === pt.id;
      const ptName = pt.name ? pt.name.toLowerCase().trim() : "";
      const sPtName = (s.patientName || s.patient?.name || "").toLowerCase().trim();
      const matchName =
        ptName &&
        sPtName &&
        (ptName === sPtName || sPtName.includes(ptName) || ptName.includes(sPtName));
      return matchId || matchName;
    });

    const targetReps = Number(pt.targetReps) > 0 ? Number(pt.targetReps) : 50;

    // Akumulasi reps dari SELURUH sesi yang pernah dilakukan pasien ini
    const sessionRepsSum = ptSessions.reduce(
      (acc, s) => acc + (Number(s.totalReps) || 0),
      0
    );

    const totalRepsCompleted = Math.max(
      sessionRepsSum,
      Number(pt.totalRepsCompleted) || 0
    );

    // 1. LOGIKA 3 STATUS PASIEN:
    // - NO SESSION: belum pernah ada reps selesai sama sekali (totalRepsCompleted === 0)
    // - COMPLETED: totalRepsCompleted sudah mencapai atau melebihi targetReps
    // - ON TRACK: sudah mulai latihan tapi belum mencapai targetReps total
    let status = "NO SESSION";
    let statusType = "neutral";
    if (totalRepsCompleted >= targetReps) {
      status = "COMPLETED";
      statusType = "completed";
    } else if (totalRepsCompleted > 0) {
      status = "ON TRACK";
      statusType = "success";
    }

    let avgScore = pt.avgForm;
    if (ptSessions.length > 0) {
      const totalScore = ptSessions.reduce(
        (acc, s) => acc + (Number(s.overallFormScore) || 0),
        0
      );
      avgScore = Math.round(totalScore / ptSessions.length);
    }

    return {
      ...pt,
      targetReps,
      totalRepsCompleted,
      avgForm: avgScore,
      reps: `${totalRepsCompleted}/${targetReps}`,
      status,
      statusType,
    };
  });
}

/**
 * Membaca daftar pasien dari localStorage atau memory,
 * dan secara otomatis menyinkronkan status dengan riwayat sesi yang ada
 */
export function getLocalPatients() {
  const base = getRawLocalPatients();
  const enriched = enrichPatientsWithHistory(base);
  memoryPatients = enriched;
  return enriched;
}

/**
 * Menyimpan daftar pasien ke localStorage dan memory
 */
export function saveLocalPatients(patients) {
  memoryPatients = patients;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("physiov_patients", JSON.stringify(patients));
    } catch (e) {
      console.error("Gagal menyimpan pasien ke storage:", e);
    }
  }
  return patients;
}

/**
 * Menambahkan pasien baru ke daftar
 * Otomatis generate inisial dan menyimpannya ke storage
 */
export function addPatient({ name, condition, targetReps = 50, clinician = "Dr. Rivera" }) {
  if (!name || !name.trim()) return null;

  const currentPatients = getLocalPatients();
  const trimmedName = name.trim();

  // Hitung inisial otomatis dari 2 kata pertama atau karakter awal
  const parts = trimmedName.split(/\s+/).filter(Boolean);
  const initials = parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : trimmedName.slice(0, 2).toUpperCase();

  const numTargetReps = Number(targetReps) > 0 ? Number(targetReps) : 50;

  const newPatient = {
    id: "p-" + Date.now(),
    name: trimmedName,
    initials: initials || "PT",
    clinician: clinician?.trim() || "Dr. Rivera",
    condition: condition?.trim() || "General Rehabilitation",
    targetReps: numTargetReps,
    totalRepsCompleted: 0,
    avgForm: null,
    reps: `0/${numTargetReps}`,
    status: "NO SESSION",
    statusType: "neutral",
  };

  const updated = [newPatient, ...currentPatients];
  saveLocalPatients(updated);
  setActivePatient(newPatient);

  return newPatient;
}

/**
 * Membaca pasien aktif dari sessionStorage / localStorage
 */
export function getActivePatient() {
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("physiov_active_patient") || localStorage.getItem("physiov_active_patient");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          const targetReps = Number(parsed.targetReps) > 0
            ? Number(parsed.targetReps)
            : (typeof parsed.reps === "string" && parsed.reps.includes("/")
              ? parseInt(parsed.reps.split("/")[1], 10)
              : 50);
          const totalRepsCompleted = typeof parsed.totalRepsCompleted === "number"
            ? parsed.totalRepsCompleted
            : (typeof parsed.reps === "string" && parsed.reps.includes("/")
              ? parseInt(parsed.reps.split("/")[0], 10)
              : 0);

          return {
            ...parsed,
            targetReps,
            totalRepsCompleted,
            reps: `${totalRepsCompleted}/${targetReps}`,
          };
        }
      }
    } catch (e) {
      console.error("Gagal membaca active patient:", e);
    }
  }
  return null;
}

/**
 * Menyimpan pasien aktif saat ini ke session/local storage
 * dan menyinkronkan ke daftar pasien lokal
 */
export function setActivePatient(patient) {
  if (!patient) return null;
  if (typeof window !== "undefined") {
    try {
      const serialized = JSON.stringify(patient);
      sessionStorage.setItem("physiov_active_patient", serialized);
      localStorage.setItem("physiov_active_patient", serialized);

      // Sinkronisasi data pasien aktif ke memoryPatients dan storage
      const raw = getRawLocalPatients();
      let matched = false;
      const updated = raw.map((p) => {
        const matchId = p.id && patient.id && p.id === patient.id;
        const matchName =
          p.name &&
          patient.name &&
          p.name.toLowerCase().trim() === patient.name.toLowerCase().trim();
        if (matchId || matchName) {
          matched = true;
          return { ...p, ...patient };
        }
        return p;
      });
      if (!matched && patient.id) {
        updated.push(patient);
      }
      saveLocalPatients(updated);
    } catch (e) {
      console.error("Gagal menyimpan active patient:", e);
    }
  }
  return patient;
}

export const PATIENTS_DATA = DEFAULT_PATIENTS;

/**
 * Mock endpoint: GET /api/patients
 */
export async function getPatients() {
  await new Promise((resolve) => setTimeout(resolve, 30));
  return {
    status: "success",
    data: getLocalPatients(),
  };
}

/**
 * Data Mock Clinician Dashboard (Monitoring Multi-Pasien — Acuan Gambar 3 Recova)
 */
export const CLINICIAN_DASHBOARD_DATA = {
  header: {
    statusNote: "3 patients · All clear",
  },
  weeklyDigest: {
    recoveryVelocity: "-1.8%",
    velocitySubtitle: "Higher than cohort average",
    adherenceRate: "33%",
    adherenceSubtitle: "1 of 3 patients active",
    riskAlerts: "00",
    riskSubtitle: "Manual review required",
  },
  patients: PATIENTS_DATA,
  clinicalAlert: {
    id: "alert-1",
    tag: "COMPLIANCE DROP",
    time: "Today",
    title: "Missing Sessions",
    description: "Marcus Chen & Rosa Delgado have no active session recorded.",
    actionLabel: "SEND REMINDER",
    facilityCapacity: 78,
  },
  volumeTrend: [
    { day: "MON", count: 12, isHighlight: false },
    { day: "TUE", count: 18, isHighlight: false },
    { day: "WED", count: 14, isHighlight: false },
    { day: "THU", count: 20, isHighlight: false },
    { day: "FRI", count: 23, isHighlight: false },
    { day: "SAT", count: 32, isHighlight: true }, // Peak Highlight (Navy)
    { day: "SUN", count: 16, isHighlight: false },
  ],
  recoveryDays: {
    avgDays: 42,
    trend: "-4 days from last month",
    data: [
      { name: "Completed", value: 68, color: "#152238" },
      { name: "Remaining", value: 32, color: "#E3DDD2" },
    ],
  },
  nextSession: {
    dateMonth: "APR",
    dateDay: "26",
    patientName: "Eleanor Voss",
    condition: "Post knee replacement (left)",
    actionLabel: "PREPARE SESSION",
  },
};

/**
 * Mock endpoint: GET /api/clinician/dashboard
 */
export async function getClinicianDashboard() {
  await new Promise((resolve) => setTimeout(resolve, 30));
  const currentPatients = getLocalPatients();
  const activeCount = currentPatients.filter((p) => p.status !== "NO SESSION").length;
  const totalCount = currentPatients.length || 1;
  const adherencePercent = Math.round((activeCount / totalCount) * 100);

  const missingPatients = currentPatients
    .filter((p) => p.status === "NO SESSION")
    .map((p) => p.name);

  return {
    status: "success",
    data: {
      ...CLINICIAN_DASHBOARD_DATA,
      header: {
        statusNote: `${currentPatients.length} patients · ${missingPatients.length === 0 ? "All clear" : `${missingPatients.length} need attention`}`,
      },
      weeklyDigest: {
        ...CLINICIAN_DASHBOARD_DATA.weeklyDigest,
        adherenceRate: `${adherencePercent}%`,
        adherenceSubtitle: `${activeCount} of ${currentPatients.length} patients active`,
      },
      clinicalAlert: {
        ...CLINICIAN_DASHBOARD_DATA.clinicalAlert,
        description:
          missingPatients.length > 0
            ? `${missingPatients.slice(0, 2).join(" & ")}${missingPatients.length > 2 ? ` & ${missingPatients.length - 2} other(s)` : ""} have no active session recorded.`
            : "All registered patients have completed active sessions.",
      },
      patients: currentPatients,
    },
  };
}
