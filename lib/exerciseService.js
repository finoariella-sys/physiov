import { db } from "./firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { normalizeExerciseKey } from "./exerciseConfig";

// Ambil semua exercise yang tersedia
export async function getExercises() {
    const snapshot = await getDocs(collection(db, "exercises"));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Tambah exercise baru (dipakai admin)
export async function addExercise(name, description, jointFocus, configKey) {
    const slug = configKey || normalizeExerciseKey(name);
    const docRef = await addDoc(collection(db, "exercises"), {
        name,
        description,
        jointFocus,
        configKey: slug,
        createdAt: new Date(),
    });
    return docRef.id;
}