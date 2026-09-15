"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logoutUser } from "@/lib/authService";

export default function DisabledAccountPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-12 text-center">
        {/* Big emoji/icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center mb-6 mx-auto">
  <span className="text-8xl font-bold text-amber-600">😜</span>
          </div>
        </div>

        <h1 className="text-3xl font-black text-[#152238] mb-4 tracking-tight">
          Yahh, akun kamu dinonaktifkan
        </h1>
        
        <p className="text-lg text-[#526071] mb-8 max-w-sm mx-auto leading-relaxed">
          Silakan hubungi admin klinik untuk informasi lebih lanjut.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-6 h-6 text-amber-500 flex-shrink-0 font-bold text-lg">hi</span>
            <div>
              <p className="font-bold text-amber-800">Informasi Penting</p>
              <p className="text-sm text-amber-700 mt-1">
                Akun ini dinonaktifkan oleh admin klinik. Anda tidak bisa login atau menggunakan fitur aplikasi sampai akun diaktifkan kembali.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-amber-200">
            <p className="text-sm text-amber-700 text-center">
              Jika ini kesalahan, silakan hubungi admin klinik Anda.
            </p>
          </div>
        </div>

        <button
          onClick={async () => {
            await logoutUser();
            router.push("/auth");
          }}
          className="mt-8 w-full px-6 py-3 bg-[#152238] text-white rounded-2xl font-bold text-base hover:bg-[#1C2E4C] transition-colors shadow-md"
        >
          Kembali ke Halaman Login
        </button>
      </div>
    </div>
  );
}