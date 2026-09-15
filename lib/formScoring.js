/**
 * PhysioV Real Form Scoring Engine
 *
 * Menghitung form score 0-100 berdasarkan KEDEKATAN sudut sendi aktual
 * dari MediaPipe dengan sudut ideal per gerakan yang didefinisikan di
 * exerciseConfig.js (field `idealAngle`). Menggantikan scoring dummy yang
 * sebelumnya diambil dari lib/mockApi.js.
 */

const SCORE_TOLERANCE = 5;

/**
 * Ambil sudut ideal (target peak depth) sebuah exercise.
 * Dahulukan field `idealAngle` dari exerciseConfig, lalu fallback.
 */
export function getIdealAngle(config, fallback = 90) {
  const ideal = config?.idealAngle;
  return typeof ideal === "number" && ideal > 0 ? ideal : fallback;
}

/**
 * Skor 0-100 berdasarkan kedekatan sudut aktual dengan sudut ideal.
 *  - Deviasi 0°          → 100
 *  - Deviasi <= tolerance → 100..90 (turun halus)
 *  - Deviasi tolerance..+20° → 90..0 (penalti progresif)
 *  - Deviasi > tolerance+20° → 0
 */
export function calculateRealFormScore(actualAngle, idealAngle, tolerance = SCORE_TOLERANCE) {
  const ideal = typeof idealAngle === "number" && idealAngle !== null ? idealAngle : 90;
  const tol = Math.max(tolerance, 1);
  const deviation = Math.abs(actualAngle - ideal);

  if (deviation <= tol) {
    return Math.round(100 - (deviation / tol) * 10);
  }

  const scaling = 20;
  const fraction = Math.min(1, (deviation - tol) / scaling);
  return Math.max(0, Math.round(90 - fraction * 90));
}

/** Klasifikasi skor sample frame (Optimal / Variant / Critical). */
export function classifyFrameScore(score) {
  if (score >= 80) return "optimal";
  if (score >= 65) return "variant";
  return "critical";
}

/** Klasifikasi skor sebuah rep (Perfect / Minor / Failed). */
export function classifyRepScore(score) {
  if (score >= 85) return "perfect";
  if (score >= 70) return "minor";
  return "failed";
}

/**
 * Scoring frame real-time untuk UI live session.
 * Skor hanya dihasilkan saat gerakan berlangsung (bukan idle), sehingga
 * angka yang tampil mencerminkan kualitas gerakan saat bergerak.
 */
export function getLiveFrameScoring(config, currentAngle, phase) {
  const t = config?.feedbackTemplates || {};
  const ideal = getIdealAngle(config);
  const phases = config?.phases || {};

  const isIdle = phase === phases.idle;
  const isDescending = phase === phases.descending;
  const isBottom = phase === phases.bottom;

  let feedback = t.optimal || "Pertahankan posisi";
  if (isIdle) {
    feedback = t.standing || t.ascending || feedback;
  } else if (isDescending) {
    feedback = t.descending || feedback;
  } else if (isBottom) {
    const frameScore = calculateRealFormScore(currentAngle, ideal, SCORE_TOLERANCE);
    feedback = frameScore >= 90 ? t.optimal || feedback : t.tooDeep || t.descending || feedback;
  } else {
    feedback = t.optimal || feedback;
  }

  if (isIdle) {
    return { score: null, feedback };
  }

  return {
    score: Math.max(0, calculateRealFormScore(currentAngle, ideal, SCORE_TOLERANCE)),
    feedback,
  };
}

/**
 * Ringkas statistik sesi menjadi field yang disimpan ke dokumen sessions:
 * { perRepScores, formAccuracy, repQuality, avgAngleDeviation }.
 * field bernilai null jika data terkait tidak tersedia (bukan 0).
 */
export function buildSessionStats(stats) {
  const repScores = (stats && Array.isArray(stats.repScores) ? stats.repScores : []).slice();
  const frameScores = stats && Array.isArray(stats.scores) ? stats.scores : [];
  const deviations = stats && Array.isArray(stats.angleDeviations) ? stats.angleDeviations : [];
  const totalSamples = stats?.totalSamples || 0;

  let formAccuracy = null;
  if (totalSamples > 0) {
    formAccuracy = {
      optimal: Math.round((stats.optimalCount / totalSamples) * 100) || 0,
      variant: Math.round((stats.variantCount / totalSamples) * 100) || 0,
      critical: Math.round((stats.criticalCount / totalSamples) * 100) || 0,
    };
  }

  let repQuality = null;
  if (repScores.length > 0) {
    repQuality = {
      perfect: repScores.filter((s) => s >= 85).length,
      minor: repScores.filter((s) => s >= 70 && s < 85).length,
      failed: repScores.filter((s) => s < 70).length,
    };
  }

  let avgAngleDeviation = null;
  if (deviations.length > 0) {
    const totalDev = deviations.reduce((a, b) => a + b, 0);
    avgAngleDeviation = Math.round((totalDev / deviations.length) * 10) / 10;
  }

  return { perRepScores: repScores, formAccuracy, repQuality, avgAngleDeviation };
}

/**
 * Stability Coefficient (0.2 - 0.99) dari konsistensi perRepScores.
 * Koefisien variasi kecil (skor konsisten) → stabil mendekati 1, DIBOBOTI
 * level kualitas rata-rata (mean/100) agar "konsisten buruk" tidak tampil
 * sebagai stabil sempurna. Semua turunan dari data real.
 */
export function computeStabilityCoefficient(scores) {
  if (!Array.isArray(scores) || scores.length < 2) return 0.99;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (mean <= 0) return 0.2;
  const variance = scores.reduce((acc, s) => acc + (s - mean) ** 2, 0) / scores.length;
  const std = Math.sqrt(variance);
  const cv = std / mean;
  const quality = Math.min(1, Math.max(0.5, mean / 100));
  return Math.min(0.99, Math.max(0.2, Number(((1 - cv) * quality).toFixed(2))));
}

/**
 * Fatigue Resistance (0-100) dari tren skor rep awal vs rep akhir.
 * 100 = tidak ada penurunan performa; makin turun di akhir = makin rendah.
 */
export function computeFatigueResistance(scores) {
  if (!Array.isArray(scores) || scores.length < 2) return 100;
  const n = scores.length;
  const k = Math.ceil(n / 2);
  const early = scores.slice(0, k);
  const late = scores.slice(k);
  const earlyAvg = early.reduce((a, b) => a + b, 0) / early.length;
  const lateAvg = late.reduce((a, b) => a + b, 0) / late.length;
  const drop = earlyAvg - lateAvg; // positif = kelelahan
  if (drop <= 0) return 100;
  return Math.round(Math.min(100, Math.max(30, 100 - drop * 2.5)));
}