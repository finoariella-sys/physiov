import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

// Pasien ajukan keluhan ke dokter tertentu
export async function submitComplaint(patientId, doctorId, text) {
    const docRef = await addDoc(collection(db, "complaints"), {
        patientId,
        doctorId,
        text,
        status: "pending",
        createdAt: new Date(),
    });
    return docRef.id;
}

// Dokter lihat semua keluhan yang ditujukan ke dirinya
export async function getComplaintsForDoctor(doctorId) {
    const q = query(collection(db, "complaints"), where("doctorId", "==", doctorId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Pasien lihat keluhan yang dia ajukan sendiri
export async function getComplaintsForPatient(patientId) {
    const q = query(collection(db, "complaints"), where("patientId", "==", patientId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Tandai keluhan sudah ditangani
export async function markComplaintHandled(complaintId) {
    await updateDoc(doc(db, "complaints", complaintId), { status: "handled" });
}