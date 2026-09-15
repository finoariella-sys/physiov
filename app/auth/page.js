"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { registerPatient, loginUser, logoutUser } from "@/lib/authService";
import { Frown } from "lucide-react";

function translateFirebaseError(message) {
  if (message.includes("auth/email-already-in-use")) return "Email sudah terdaftar.";
  if (message.includes("auth/invalid-credential")) return "Email atau password salah.";
  if (message.includes("auth/weak-password")) return "Password minimal 6 karakter.";
  if (message.includes("auth/invalid-email")) return "Format email tidak valid.";
  return message;
}

export default function AuthPage() {
    const [mode, setMode] = useState("login"); // "login" | "register"

    // Support deep-link: /auth?mode=login | /auth?mode=register (from landing page)
    useEffect(() => {
        try {
            const q = new URLSearchParams(window.location.search).get("mode");
            if (q === "register" || q === "login") {
                const modeTimer = setTimeout(() => setMode(q), 0);
                return () => clearTimeout(modeTimer);
            }
        } catch { /* ignore */ }
    }, []);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            if (mode === "register") {
                await registerPatient(email, password, name, "");
            } else {
                await loginUser(email, password);
            }
            router.push("/");
        } catch (err) {
            if (err?.code === "ACCOUNT_DISABLED") {
              router.push("/auth/disabled");
            } else {
              setError(translateFirebaseError(err.message));
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center p-6">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
                <h1 className="text-xl font-bold text-[#111A28] mb-1">PhysioV</h1>
                <p className="text-sm text-gray-500 mb-6">
                    {mode === "login" ? "Masuk ke akun kamu" : "Daftar sebagai pasien"}
                </p>

                <div className="flex mb-6 border-b">
                    <button
                        className={`flex-1 pb-2 text-sm font-medium ${mode === "login" ? "border-b-2 border-[#152238] text-[#152238]" : "text-gray-400"}`}
                        onClick={() => setMode("login")}
                        type="button"
                    >
                        Login
                    </button>
                    <button
                        className={`flex-1 pb-2 text-sm font-medium ${mode === "register" ? "border-b-2 border-[#152238] text-[#152238]" : "text-gray-400"}`}
                        onClick={() => setMode("register")}
                        type="button"
                    >
                        Register (Pasien)
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    {mode === "register" && (
                        <input
                            type="text"
                            placeholder="Nama lengkap"
                            className="border rounded-lg px-3 py-2 text-sm"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email"
                        className="border rounded-lg px-3 py-2 text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="border rounded-lg px-3 py-2 text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {error && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl ${
                    error.includes("dinonaktifkan") 
                      ? "bg-amber-50 border border-amber-200 text-amber-800" 
                      : "bg-red-50 border border-red-200 text-red-600"
                  }`}>
                    {error.includes("dinonaktifkan") && (
                      <Frown className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    )}
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#152238] text-white rounded-lg py-2 text-sm font-medium mt-2 disabled:opacity-50"
                    >
                        {isSubmitting ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
                    </button>
                </form>

                {mode === "login" && (
                    <p className="text-xs text-gray-400 mt-4">
                        Dokter: gunakan akun yang sudah diberikan admin klinik.
                    </p>
                )}
            </div>
        </div>
    );
}