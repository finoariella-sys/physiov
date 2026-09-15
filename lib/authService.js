import { auth, db } from "./firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";

export async function registerPatient(email, password, name, condition) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        role: "patient",
        condition: condition,
        assignedDoctorId: null,
        createdAt: new Date()
    });

    return user;
}

export async function updateUserAssignedDoctor(uid, doctorId) {
    await updateDoc(doc(db, "users", uid), {
        assignedDoctorId: doctorId,
        updatedAt: new Date()
    });
}

export async function loginUser(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if user account is disabled
    const { getUserProfile } = await import("./authService");
    const profile = await getUserProfile(user.uid);
    
    if (profile?.isActive === false) {
      await signOut(auth);
      const error = new Error("ACCOUNT_DISABLED");
      error.code = "ACCOUNT_DISABLED";
      throw error;
    }
    
    return user;
}

function clearPhysioStorage() {
    // Bersihkan data sesi/pasien yang tersimpan lokal agar tidak bocor antar akun
    try {
        const fixedKeys = [
            "physiov_active_patient",
            "physiov_patients",
            "physiov_session_history",
            "physiov_resume_patient",
            "physiov_resume_patient_id",
            "physiov_prescriptions",
            "latest_session",
        ];
        fixedKeys.forEach((k) => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
        });

        // Hapus juga kunci dinamis (mis. `session_<id>`) serta apa pun berisi "physiov"
        for (const storage of [localStorage, sessionStorage]) {
            const staleKeys = [];
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                if (key && (key.startsWith("session_") || key.includes("physiov"))) {
                    staleKeys.push(key);
                }
            }
            staleKeys.forEach((k) => storage.removeItem(k));
        }
    } catch (error) {
        console.warn("Gagal membersihkan storage lokal:", error);
    }
}

export async function logoutUser() {
    try {
        await signOut(auth);
    } finally {
        clearPhysioStorage();
    }
}

export async function seedAdmin(email, password, name) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        role: "admin",
        createdAt: new Date()
    });

    return user;
}

export async function seedDoctor(email, password, name, specialization) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        role: "doctor",
        specialization: specialization,
        createdAt: new Date()
    });

    return user;
}

export async function getUserProfile(uid) {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        throw new Error("Profile user tidak ditemukan di Firestore");
    }
}
// Ambil semua user dengan role "doctor" (dipakai di dropdown pilih dokter)
export async function getDoctors() {
    const q = query(collection(db, "users"), where("role", "==", "doctor"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Ambil semua user dengan role "patient"
export async function getPatients() {
    const q = query(collection(db, "users"), where("role", "==", "patient"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Ambil pasien yang ditugaskan ke dokter tertentu (sumber utama watchlist dokter)
export async function getPatientsForDoctor(doctorId) {
    const q = query(
        collection(db, "users"),
        where("role", "==", "patient"),
        where("assignedDoctorId", "==", doctorId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Update user status (disable/enable)
export async function updateUserStatus(uid, isActive) {
    await updateDoc(doc(db, "users", uid), {
        isActive: isActive,
        updatedAt: new Date()
    });
}

// Get all users (for admin monitoring)
export async function getAllUsers() {
    const snapshot = await getDocs(collection(db, "users"));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}