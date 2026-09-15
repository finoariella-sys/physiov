"use client";

import { logoutUser } from "@/lib/authService";
import { useAuth } from "@/context/AuthContext";
import { addExercise } from "@/lib/exerciseService";
import ProtectedRoute from "@/components/ProtectedRoute";

function TestFirebaseContent() {
    const { user, profile, loading } = useAuth();

    async function handleSeedExercises() {
        try {
            await addExercise("Squat", "Gerakan turun-naik menekuk lutut dan pinggul.", "Knee");
            alert("Exercise berhasil di-seed!");
        } catch (error) {
            alert("Gagal: " + error.message);
        }
    }

    async function handleLogout() {
        try {
            await logoutUser();
            alert("Logout berhasil");
        } catch (error) {
            alert("Gagal: " + error.message);
        }
    }

    return (
        <div style={{ padding: 40 }}>
            <h1>Halaman Test Firebase</h1>

            <div style={{ marginBottom: 20, padding: 10, background: "#eee" }}>
                <strong>Status AuthContext:</strong>
                <p>Loading: {loading ? "true" : "false"}</p>
                <p>User login: {user ? user.email : "belum ada"}</p>
                <p>Role: {profile ? profile.role : "belum ada"}</p>
            </div>

            <button onClick={handleSeedExercises}>Seed Exercises</button>
            <br /><br />
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}

export default function TestFirebasePage() {
    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <TestFirebaseContent />
        </ProtectedRoute>
    );
}