import { db } from "./firebase";
import { getUserProfile } from "./authService";
import { computeStabilityCoefficient, computeFatigueResistance } from "./formScoring";
import { collection, addDoc, query, where, getDocs, orderBy, updateDoc, doc, getDoc } from "firebase/firestore";

export async function saveSession({ patientId, prescriptionId, reps, formScore, extra = {} }) {
    const docRef = await addDoc(collection(db, "sessions"), {
        patientId,
        prescriptionId,
        reps,
        formScore,
        date: new Date(),
        status: "completed",
        ...extra,
    });
    return docRef.id;
}

export async function getSessionsForPatient(patientId) {
    const q = query(
        collection(db, "sessions"),
        where("patientId", "==", patientId),
        orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Save or update a paused session
export async function savePausedSession({ patientId, prescriptionId, reps, formScore, pausedAt, extra = {} }) {
    // Check if there's already a paused session for this prescription
    const q = query(
        collection(db, "sessions"),
        where("patientId", "==", patientId),
        where("prescriptionId", "==", prescriptionId),
        where("status", "==", "paused")
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
        // Update existing paused session
        const pausedDoc = snapshot.docs[0];
        await updateDoc(doc(db, "sessions", pausedDoc.id), {
            reps,
            formScore,
            pausedAt: pausedAt || new Date(),
            updatedAt: new Date(),
            ...extra,
        });
        return pausedDoc.id;
    } else {
        // Create new paused session
        const docRef = await addDoc(collection(db, "sessions"), {
            patientId,
            prescriptionId,
            reps,
            formScore,
            date: new Date(),
            status: "paused",
            pausedAt: pausedAt || new Date(),
            ...extra,
        });
        return docRef.id;
    }
}

// Get paused session for a specific prescription
export async function getPausedSession(patientId, prescriptionId) {
    const q = query(
        collection(db, "sessions"),
        where("patientId", "==", patientId),
        where("prescriptionId", "==", prescriptionId),
        where("status", "==", "paused")
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
}

// Resume a paused session (update reps, keep paused status)
export async function updatePausedSession(sessionId, { reps, formScore, extra = {} }) {
    await updateDoc(doc(db, "sessions", sessionId), {
        reps,
        formScore,
        updatedAt: new Date(),
        ...extra,
    });
}

// Complete a paused session (mark as completed)
export async function completePausedSession(sessionId, { reps, formScore, extra = {} }) {
    await updateDoc(doc(db, "sessions", sessionId), {
        reps,
        formScore,
        status: "completed",
        completedAt: new Date(),
        ...extra,
    });
}

// Get all paused sessions for a patient
export async function getPausedSessionsForPatient(patientId) {
    const q = query(
        collection(db, "sessions"),
        where("patientId", "==", patientId),
        where("status", "==", "paused"),
        orderBy("pausedAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Check and complete expired paused sessions (older than 24 hours)
export async function checkAndCompleteExpiredPausedSessions(patientId) {
    const pausedSessions = await getPausedSessionsForPatient(patientId);
    const now = new Date();
    const expiredSessions = pausedSessions.filter(session => {
        const pausedAt = session.pausedAt?.toDate ? session.pausedAt.toDate() : new Date(session.pausedAt);
        const hoursDiff = (now - pausedAt) / (1000 * 60 * 60);
        return hoursDiff >= 24;
    });

    for (const session of expiredSessions) {
        await completePausedSession(session.id, {
            reps: session.reps,
            formScore: session.formScore,
        });
    }

    return expiredSessions.length;
}

// Cek otorisasi akses ke sebuah sesi.
// Pasien hanya boleh mengakses sesi miliknya, dokter hanya sesi pasien yang
// ditanganinya (via prescription terkait atau assignedDoctorId), admin bebas.
async function canAccessSession(session, currentUserUid) {
  if (!session?.patientId || !currentUserUid) return false;

  if (session.patientId === currentUserUid) return true;

  let callerRole = null;
  try {
    const callerProfile = await getUserProfile(currentUserUid);
    callerRole = callerProfile?.role || null;
  } catch {
    callerRole = null;
  }

  if (callerRole === "admin") return true;

  if (callerRole === "doctor") {
    // 1) Dokter yang membuat prescription untuk sesi ini
    if (session.prescriptionId) {
      try {
        const prescriptionRef = doc(db, "prescriptions", session.prescriptionId);
        const prescriptionSnap = await getDoc(prescriptionRef);
        if (prescriptionSnap.exists() && prescriptionSnap.data().doctorId === currentUserUid) {
          return true;
        }
      } catch {
        // Permission error / doc tidak ada → lanjut cek jalur lain
      }
    }

    // 2) Pasien yang menunjuk dokter ini (assignedDoctorId)
    try {
      const patientProfile = await getUserProfile(session.patientId);
      if (patientProfile?.assignedDoctorId === currentUserUid) {
        return true;
      }
    } catch {
      // Profil pasien tidak terbaca → tolak
    }
  }

  return false;
}

// Compute analytics for a specific session from Firestore data
export async function getSessionAnalyticsById(sessionId, currentUserUid = null) {
    const sessionRef = doc(db, "sessions", sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
        return { status: "error", code: "NOT_FOUND", message: "Session not found" };
    }
    
    const session = { id: sessionSnap.id, ...sessionSnap.data() };

    // Otorisasi akses: tanpa login atau bukan pemilik/dokter-wajib/admin → tolak.
    const authorized = await canAccessSession(session, currentUserUid);
    if (!authorized) {
        return { status: "error", code: "NO_ACCESS", message: "Anda tidak memiliki akses ke data ini" };
    }
    
    // Get patient info
    let patientName = "Pasien";
    let patientCondition = "";
    let doctorName = "Dokter";
    let exerciseName = "Exercise";
    let targetReps = null;
    
    try {
        const patientProfile = await getUserProfile(session.patientId);
        patientName = patientProfile?.name || "Pasien";
        patientCondition = patientProfile?.condition || "";
        
        if (session.prescriptionId) {
            const prescriptionRef = doc(db, "prescriptions", session.prescriptionId);
            const prescriptionSnap = await getDoc(prescriptionRef);
            if (prescriptionSnap.exists()) {
                const prescription = prescriptionSnap.data();
                targetReps = typeof prescription.targetReps === "number" ? prescription.targetReps : null;
                const doctorProfile = await getUserProfile(prescription.doctorId);
                doctorName = doctorProfile?.name ? `dr. ${doctorProfile.name}` : "Dokter";
                
                // Get exercise name
                const exerciseRef = doc(db, "exercises", prescription.exerciseId);
                const exerciseSnap = await getDoc(exerciseRef);
                if (exerciseSnap.exists()) {
                    exerciseName = exerciseSnap.data().name;
                }
            }
        }
    } catch (err) {
        console.error("Error fetching related data:", err);
    }
    
    const score = session.formScore || 0;
    const grade = score >= 90 ? "A" : score >= 80 ? "B+" : score >= 70 ? "B" : score >= 60 ? "C" : "D";
    const status = score >= 80 ? "OPTIMAL PROGRESS" : "NEEDS REVIEW";

    // ─── Data detail real yang disimpan per sesi (tanpa fallback angka karangan) ───
    const perRepScores =
        Array.isArray(session.perRepScores) && session.perRepScores.length > 0
            ? session.perRepScores
            : null;

    const fa = session.formAccuracy;
    const hasAccuracyData = !!(fa && typeof fa.optimal === "number" && typeof fa.variant === "number" && typeof fa.critical === "number");
    const optimal = hasAccuracyData ? fa.optimal : null;
    const variant = hasAccuracyData ? fa.variant : null;
    const critical = hasAccuracyData ? fa.critical : null;

    const rq = session.repQuality;
    const hasRepQualityData = !!(rq && typeof rq.perfect === "number" && typeof rq.minor === "number" && typeof rq.failed === "number");
    let perfect = hasRepQualityData ? rq.perfect : null;
    let minor = hasRepQualityData ? rq.minor : null;
    let failed = hasRepQualityData ? rq.failed : null;

    // Jika repQuality tak tersimpan, turunkan dari perRepScores yang tersedia
    if (!hasRepQualityData && perRepScores) {
        perfect = perRepScores.filter((s) => s >= 85).length;
        minor = perRepScores.filter((s) => s >= 70 && s < 85).length;
        failed = perRepScores.filter((s) => s < 70).length;
    }

    const hasPerRepData = !!perRepScores;
    const avgAngleDeviation = typeof session.avgAngleDeviation === "number" ? session.avgAngleDeviation : null;
    const durationSec = typeof session.duration === "number" ? session.duration : null;
    const formattedDuration = durationSec !== null
        ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
        : "N/A";

    // Stability Coefficient & Fatigue Resistance: dihitung dari perRepScores real
    let stabilityCoefficient = null;
    let fatigueResistance = null;
    if (hasPerRepData) {
        stabilityCoefficient = computeStabilityCoefficient(perRepScores);
        fatigueResistance = computeFatigueResistance(perRepScores);
    }

    const totalReps = session.reps || 0;

    // Get all sessions for this patient to compute sessions count & trend stability
    const allSessions = await getSessionsForPatient(session.patientId);
    const sessionsCount = allSessions.length;

    // Trend stability: bandingkan dgn rata-rata stabilitas sesi sebelumnya (real)
    let stabilityChange = null;
    const prevStabs = allSessions
        .filter((s) => s.id !== session.id && Array.isArray(s.perRepScores) && s.perRepScores.length > 0)
        .map((s) => computeStabilityCoefficient(s.perRepScores));
    if (stabilityCoefficient !== null && prevStabs.length > 0) {
        const avgPrev = prevStabs.reduce((a, b) => a + b, 0) / prevStabs.length;
        if (avgPrev > 0) {
            const diffPct = ((stabilityCoefficient - avgPrev) / avgPrev) * 100;
            stabilityChange = `${diffPct >= 0 ? "+" : ""}${diffPct.toFixed(0)}%`;
        }
    }

    // AI interpretation berbasis data real sesi ini
    let aiInterpretation = null;
    if (hasPerRepData || hasRepQualityData) {
        const parts = [];
        if (perRepScores) {
            const avgRepScore = Math.round(perRepScores.reduce((a, b) => a + b, 0) / perRepScores.length);
            parts.push(`Average per-rep form reached ${avgRepScore}%`);
        }
        if (perRepScores) {
            parts.push(`${perfect} of ${perRepScores.length} reps executed perfectly`);
        } else if (hasRepQualityData) {
            const repTotal = perfect + minor + failed;
            parts.push(`${perfect} of ${repTotal} reps executed perfectly`);
        }
        if (avgAngleDeviation !== null) {
            parts.push(`mean angle deviation of ${avgAngleDeviation}°`);
        }
        if (fatigueResistance !== null) {
            parts.push(`fatigue resistance scored ${fatigueResistance}/100`);
        }
        aiInterpretation = parts.join(". ") + ".";
    }
    
    const formattedData = {
        sessionId: session.id,
        patient: {
            id: session.patientId,
            name: patientName,
            condition: patientCondition,
            clinician: doctorName,
            sessionDate: session.date?.toDate ? session.date.toDate().toLocaleString("id-ID", { 
                day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" 
            }) : new Date().toLocaleString("id-ID"),
            exercise: exerciseName,
        },
        overallScore: {
            score,
            grade,
            status,
            statusBadgeColor: score >= 80 ? "emerald" : "amber",
            totalReps,
            targetReps,
            sessionsCount,
            duration: formattedDuration,
        },
        accuracyMetric: {
            optimal,
            variant,
            critical,
            available: hasAccuracyData,
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
            available: hasRepQualityData || hasPerRepData,
            items: [
                { name: "Perfect Execution", value: perfect, color: "#152238" },
                { name: "Minor Deviations", value: minor, color: "#D6C3A8" },
                { name: "Failed Reps", value: failed, color: "#D9534F" },
            ],
        },
        clinicalInsight: {
            stabilityCoefficient,
            stabilityChange,
            stabilityDirection: stabilityChange?.startsWith("-") ? "declining" : "improving",
            fatigueResistance,
            maxFatigue: 100,
            available: hasPerRepData,
            aiInterpretation,
            validatorBadge: "Validated by AI Clinician Assist & Human Review",
        },
    };
    
    return {
        status: "success",
        data: formattedData,
        ...formattedData,
    };
}