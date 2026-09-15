import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { markComplaintHandled } from "./complaintService";

export async function createPrescription({ complaintId, patientId, doctorId, exerciseId, targetReps, notes }) {
    const docRef = await addDoc(collection(db, "prescriptions"), {
        complaintId,
        patientId,
        doctorId,
        exerciseId,
        targetReps,
        notes: notes || "",
        createdAt: new Date(),
        status: "active", // active, completed
    });

    if (complaintId) {
        await markComplaintHandled(complaintId);
    }

    return docRef.id;
}

export async function getPrescriptionsForPatient(patientId) {
    const q = query(collection(db, "prescriptions"), where("patientId", "==", patientId));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return list.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (new Date(a.createdAt || 0)).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (new Date(b.createdAt || 0)).getTime();
        return timeB - timeA;
    });
}

export async function getPrescriptionsForDoctor(doctorId) {
    const q = query(collection(db, "prescriptions"), where("doctorId", "==", doctorId));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return list.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (new Date(a.createdAt || 0)).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (new Date(b.createdAt || 0)).getTime();
        return timeB - timeA;
    });
}

export async function updatePrescriptionStatus(prescriptionId, status) {
    await updateDoc(doc(db, "prescriptions", prescriptionId), {
        status,
        updatedAt: new Date(),
    });
}