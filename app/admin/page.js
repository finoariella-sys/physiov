"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { loginUser, logoutUser } from "@/lib/authService";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  // Auto-redirect if already logged in as admin
  useEffect(() => {
    if (!loading && user && profile?.role === "admin") {
      router.push("/admin/dashboard");
    }
  }, [user, profile, loading, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // loginUser returns the user directly, use that instead of auth.currentUser
      const user = await loginUser(email, password);
      
      // Check if user is admin
      const { getUserProfile } = await import("@/lib/authService");
      const profile = await getUserProfile(user.uid);
      
      // Check if account is disabled
      if (profile?.isActive === false) {
        await logoutUser();
        router.push("/auth/disabled");
        return;
      }
      
      if (profile?.role === "admin") {
        router.push("/admin/dashboard");
        return;
      }
      
      setError("Akses ditolak. Hanya admin yang diperbolehkan.");
    } catch (err) {
      if (err?.code === "ACCOUNT_DISABLED") {
        router.push("/auth/disabled");
      } else {
        setError("Email atau password salah.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If already logged in but not admin, show access denied
  if (user && profile?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#152238] mb-4 shadow-xl">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.066 2.573c-.94-1.543-.826-3.31-2.37-2.37a1.724 1.724 0 00-2.572 1.065c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31-2.37-2.37a1.724 1.724 0 00-2.572 1.065c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31-2.37-2.37a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31-2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#111A28] mb-1">PhysioV Admin</h1>
            <p className="text-sm text-gray-500">Panel Pengelola Klinik</p>
          </div>

          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 21v-6m0-5l-6 6m0 0l6 6m0-5v-3.5A2.5 2.5 0 1113.5 2.5A2.5 2.5 0 0119 9.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 12h-4.48m0 0l-3.26-3.26m0 0l3.26 3.26m-9.75 0h.01M12 12h-.01m0 0a4 4 0 100-8 4 4 0 000 8zm0 0H7.5" />
            </svg>
            <p className="text-sm text-amber-800">Anda tidak memiliki akses ke halaman admin.</p>
          </div>
        </div>
      </div>
    );
  }

  // If already logged in as admin, the useEffect will redirect
  // But show loading while checking
  if (user && profile?.role === "admin") {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#152238] mb-4 shadow-xl">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-1.066 2.573c-.94-1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-1.066 2.573c-.94-1.543-.826 3.31-2.37-2.37a1.724 1.724 0 00-2.572 1.065c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 002.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#111A28] mb-1">PhysioV Admin</h1>
          <p className="text-sm text-gray-500">Panel Pengelola Klinik</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email Admin"
            className="border rounded-lg px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            className="border rounded-lg px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && (
            <div className={`flex items-center gap-2 p-3 rounded-xl ${
              error.includes("dinonaktifkan") 
                ? "bg-amber-50 border border-amber-200 text-amber-800" 
                : "bg-red-50 border border-red-200 text-red-600"
            }`}>
              {error.includes("dinonaktifkan") && (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 21v-6m0-5l-6 6m0 0l6 6m0-5v-3.5A2.5 2.5 0 1113.5 2.5A2.5 2.5 0 0119 9.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 12h-4.48m0 0l-3.26-3.26m0 0l3.26 3.26m-9.75 0h.01M12 12h-.01m0 0a4 4 0 100-8 4 4 0 010 8zm0 0h.01M12 12h-.01m0 0a4 4 0 118 0 4 4 0 01-8 0z" />
                </svg>
              )}
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#152238] text-white rounded-lg py-2 text-sm font-medium mt-2 disabled:opacity-50"
          >
            {isSubmitting ? "Memproses..." : "Masuk ke Admin Panel"}
          </button>
        </form>

      </div>
    </div>
  );
}