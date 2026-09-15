/**
 * PhysioV Exercise Configuration
 *
 * Konfigurasi sentral per exercise: threshold sudut, label fase,
 * feedback template, parameter animasi demo, dan arah deteksi.
 *
 * `direction`:
 *   - "decreasing" → gerakan aktif = sudut menurun (Squat, Hip Abduction, Hip Flexor Stretch)
 *   - "increasing" → gerakan aktif = sudut meningkat (Knee Extension, Shoulder Raise)
 */

export const EXERCISE_CONFIG = {
  squat: {
    id: "squat",
    configKey: "squat",
    name: "Squat",
    jointLabel: "KNEE",
    direction: "decreasing", // Sudut menurun saat turun
    idealAngle: 95, // Sudut ideal saat peak depth (target scoring form)

    // Landmark MediaPipe yang dipakai untuk kalkulasi sudut
    landmarks: {
      // hip → knee → ankle (sudut lutut)
      left: { a: 23, b: 25, c: 27 },
      right: { a: 24, b: 26, c: 28 },
    },

    // Threshold state machine (arah: decreasing)
    thresholds: {
      startDescending: 140,
      reachBottom: 120,
      startAscending: 125,
      repComplete: 145,
      cancelRep: 145,
    },

    // Parameter animasi demo (derajat)
    demoAngle: { min: 88, max: 165, speed: 1.5 },

    // Label fase gerakan untuk UI
    phases: {
      idle: "STANDING",
      descending: "DESCENDING",
      bottom: "BOTTOM",
      ascending: "ASCENDING",
    },

    // Template feedback AI per fase
    feedbackTemplates: {
      standing: "Mulai turun perlahan (Squat)",
      descending: "Turunkan lebih dalam",
      optimal: "Bagus, kedalaman optimal! Dorong naik",
      tooDeep: "Terlalu rendah, angkat sedikit panggul",
      asymmetry: "Seimbangkan beban pada kedua kaki",
    },

    // Deskripsi singkat untuk pre-session screen
    description: "Gerakan turun-naik dengan menekuk lutut dan pinggul. Fokus pada kedalaman dan keseimbangan bilateral.",
    targetReps: 10,
  },

  "knee-extension": {
    id: "knee-extension",
    configKey: "knee-extension",
    name: "Knee Extension",
    jointLabel: "KNEE",
    direction: "increasing", // Sudut meningkat saat kaki meluruskan
    idealAngle: 170, // Sudut ideal saat full extension (target scoring form)

    landmarks: {
      left: { a: 23, b: 25, c: 27 },
      right: { a: 24, b: 26, c: 28 },
    },

    // Threshold state machine (arah: increasing — logika terbalik)
    thresholds: {
      startDescending: 115,  // Sudut naik melewati ini → mulai "extending"
      reachBottom: 160,       // Sudut ≥ ini → "full extension"
      startAscending: 155,    // Sudut turun di bawah ini → mulai "flexing"
      repComplete: 115,       // Sudut ≤ ini → kembali resting → REP COUNTED
      cancelRep: 155,         // Kembali ke extension tanpa cukup fleksi
    },

    demoAngle: { min: 90, max: 175, speed: 1.2 },

    phases: {
      idle: "RESTING",
      descending: "EXTENDING",
      bottom: "FULL EXTENSION",
      ascending: "FLEXING",
    },

    feedbackTemplates: {
      standing: "Luruskan kaki perlahan dari posisi duduk",
      descending: "Terus luruskan, hampir mencapai ekstensi penuh",
      optimal: "Ekstensi penuh tercapai! Tahan sejenak lalu tekuk kembali",
      tooDeep: "Jangan paksa berlebihan, kembali perlahan",
      asymmetry: "Jaga pinggul tetap stabil di kursi",
    },

    description: "Gerakan meluruskan kaki dari posisi duduk menekuk. Fokus pada kontrol quadriceps dan ekstensi penuh.",
    targetReps: 12,
  },

  "shoulder-raise": {
    id: "shoulder-raise",
    configKey: "shoulder-raise",
    name: "Shoulder Raise",
    jointLabel: "SHOULDER",
    direction: "increasing", // Sudut meningkat saat lengan diangkat ke atas/samping
    idealAngle: 90, // Sudut ideal saat peak raise setinggi bahu (target scoring form)

    // Landmark MediaPipe: hip → shoulder → elbow (sudut elevasi bahu)
    landmarks: {
      left: { a: 23, b: 11, c: 13 },
      right: { a: 24, b: 12, c: 14 },
    },

    // Threshold state machine (arah: increasing)
    // RESTING (≤ 35°) → RAISING (> startDescending=45°)
    // RAISING → PEAK RAISE (≥ reachBottom=85°)
    // PEAK RAISE → LOWERING (< startAscending=80°)
    // LOWERING → RESTING (≤ repComplete=40°) → REP COUNTED
    thresholds: {
      startDescending: 45,
      reachBottom: 85,
      startAscending: 80,
      repComplete: 40,
      cancelRep: 80,
    },

    demoAngle: { min: 25, max: 92, speed: 1.2 },

    phases: {
      idle: "RESTING",
      descending: "RAISING",
      bottom: "PEAK RAISE",
      ascending: "LOWERING",
    },

    feedbackTemplates: {
      standing: "Mulai angkat lengan perlahan setinggi bahu",
      descending: "Terus angkat hingga sejajar bahu",
      optimal: "Ketinggian optimal! Tahan sejenak lalu turunkan",
      tooDeep: "Jangan angkat melebihi tinggi bahu",
      asymmetry: "Jaga bahu tetap rileks, jangan mengangkat leher",
    },

    description: "Gerakan mengangkat lengan hingga setinggi bahu dari posisi berdiri tegak. Fokus pada kontrol deltoid dan stabilisasi bahu.",
    targetReps: 10,
  },

  "hip-flexor-stretch": {
    id: "hip-flexor-stretch",
    configKey: "hip-flexor-stretch",
    name: "Hip Flexor Stretch",
    jointLabel: "HIP",
    direction: "decreasing", // Sudut panggul anterior menurun saat meregang/lunge
    idealAngle: 115, // Sudut ideal saat deep stretch (target scoring form)

    // Landmark MediaPipe: shoulder → hip → knee (sudut sendi panggul)
    landmarks: {
      left: { a: 11, b: 23, c: 25 },
      right: { a: 12, b: 24, c: 26 },
    },

    // Threshold state machine (arah: decreasing)
    // STANDING (≥ 165°) → STRETCHING (< startDescending=155°)
    // STRETCHING → DEEP STRETCH (≤ reachBottom=115°)
    // DEEP STRETCH → RETURNING (≥ startAscending=125°)
    // RETURNING → STANDING (≥ repComplete=155°) → REP COUNTED
    thresholds: {
      startDescending: 155,
      reachBottom: 115,
      startAscending: 125,
      repComplete: 155,
      cancelRep: 155,
    },

    demoAngle: { min: 110, max: 170, speed: 1.0 },

    phases: {
      idle: "STANDING",
      descending: "STRETCHING",
      bottom: "DEEP STRETCH",
      ascending: "RETURNING",
    },

    feedbackTemplates: {
      standing: "Mulai dorong panggul ke depan secara perlahan (Stretch)",
      descending: "Dorong panggul lebih dalam ke depan",
      optimal: "Regangan optimal tercapai! Tahan sejenak lalu kembali",
      tooDeep: "Regangan terlalu dalam, jaga punggung tetap tegak",
      asymmetry: "Jaga posisi pinggul lurus menghadap ke depan",
    },

    description: "Gerakan meregangkan fleksor panggul dengan posisi lunge terkontrol. Fokus pada pembukaan panggul dan postur tegak.",
    targetReps: 8,
  },

  "hip-abduction": {
    id: "hip-abduction",
    configKey: "hip-abduction",
    name: "Hip Abduction",
    jointLabel: "HIP",
    direction: "decreasing", // Sudut antara paha menurun saat kaki terangkat ke samping
    idealAngle: 145, // Sudut ideal saat peak abduction (target scoring form)

    landmarks: {
      left: { a: 11, b: 23, c: 25 },
      right: { a: 12, b: 24, c: 26 },
    },

    thresholds: {
      startDescending: 164,
      reachBottom: 152,
      startAscending: 157,
      repComplete: 164,
      cancelRep: 165,
    },

    demoAngle: { min: 146, max: 172, speed: 0.8 },

    phases: {
      idle: "NEUTRAL",
      descending: "ABDUCTING",
      bottom: "PEAK ABDUCTION",
      ascending: "RETURNING",
    },

    feedbackTemplates: {
      standing: "Angkat kaki ke samping perlahan",
      descending: "Terus angkat, jaga pinggul tetap stabil",
      optimal: "Abduksi optimal! Tahan 1-2 detik lalu kembali",
      tooDeep: "Cukup, jangan terlalu lebar — jaga kontrol",
      asymmetry: "Jaga tubuh tetap tegak, jangan condong ke sisi lain",
    },

    description: "Gerakan mengangkat kaki ke samping dari posisi berdiri. Fokus pada stabilitas pinggul dan kontrol gluteus medius.",
    targetReps: 15,
  },
};

// Aliases untuk backward compatibility jika dicari dengan nama lama yang menggunakan spasi
EXERCISE_CONFIG["Squat"] = EXERCISE_CONFIG["squat"];
EXERCISE_CONFIG["Knee Extension"] = EXERCISE_CONFIG["knee-extension"];
EXERCISE_CONFIG["Shoulder Raise"] = EXERCISE_CONFIG["shoulder-raise"];
EXERCISE_CONFIG["Hip Flexor Stretch"] = EXERCISE_CONFIG["hip-flexor-stretch"];
EXERCISE_CONFIG["Hip Abduction"] = EXERCISE_CONFIG["hip-abduction"];

/**
 * Helper internal untuk normalisasi string nama/tipe menjadi standard slug
 */
export function normalizeExerciseKey(key) {
  if (!key || typeof key !== "string") return "";
  return key
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-");
}

/**
 * Helper utama: ambil config untuk exercise tertentu.
 * Mendukung pencocokan:
 * 1. Objek exercise Firestore: { configKey, type, name, id }
 * 2. String slug configKey: "knee-extension", "squat", dll.
 * 3. String nama display: "Knee Extension", "Squat", dll.
 * 4. ID acak Firestore: dicari terhadap daftar `exercisesList`
 *
 * PENTING: Jika tidak ditemukan, fungsi ini mengembalikan `null` (BUKAN fallback diam-diam ke Squat)
 * agar caller dapat mendeteksi dan menampilkan error eksplisit.
 */
export function getExerciseConfig(input, exercisesList = []) {
  if (!input) return null;

  // 1. Jika input adalah objek (dokumen exercise dari Firestore atau prescription)
  if (typeof input === "object") {
    // Cek jika field configKey atau type ada langsung
    const rawKey = input.configKey || input.type;
    if (rawKey) {
      const slug = normalizeExerciseKey(rawKey);
      if (EXERCISE_CONFIG[slug]) return EXERCISE_CONFIG[slug];
    }

    // Cek berdasarkan nama exercise
    if (input.name) {
      const slug = normalizeExerciseKey(input.name);
      if (EXERCISE_CONFIG[slug]) return EXERCISE_CONFIG[slug];
    }

    // Cek jika objek memiliki exerciseId (seperti dokumen prescription)
    if (input.exerciseId && Array.isArray(exercisesList) && exercisesList.length > 0) {
      const matched = exercisesList.find((e) => e.id === input.exerciseId);
      if (matched) return getExerciseConfig(matched, exercisesList);
    }

    // Cek jika ID dokumen cocok dengan salah satu key
    if (input.id) {
      const slug = normalizeExerciseKey(input.id);
      if (EXERCISE_CONFIG[slug]) return EXERCISE_CONFIG[slug];
      // Cari di exercisesList jika ID adalah ID acak Firestore
      if (Array.isArray(exercisesList) && exercisesList.length > 0) {
        const matched = exercisesList.find((e) => e.id === input.id);
        if (matched && matched !== input) return getExerciseConfig(matched, exercisesList);
      }
    }

    return null;
  }

  // 2. Jika input adalah string
  if (typeof input === "string") {
    // Cek direct lookup
    if (EXERCISE_CONFIG[input]) {
      return EXERCISE_CONFIG[input];
    }

    // Cek normalized slug
    const slug = normalizeExerciseKey(input);
    if (EXERCISE_CONFIG[slug]) {
      return EXERCISE_CONFIG[slug];
    }

    // Jika string adalah ID acak Firestore, cari di exercisesList
    if (Array.isArray(exercisesList) && exercisesList.length > 0) {
      const matched = exercisesList.find((e) => e.id === input || e.name === input);
      if (matched) {
        return getExerciseConfig(matched, exercisesList);
      }
    }
  }

  return null;
}

/**
 * Daftar nama exercise unik yang tersedia (hanya key canonical slug)
 */
export const EXERCISE_KEYS = ["squat", "knee-extension", "shoulder-raise", "hip-flexor-stretch", "hip-abduction"];
export const EXERCISE_NAMES = EXERCISE_KEYS.map((k) => EXERCISE_CONFIG[k].name);
