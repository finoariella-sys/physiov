"use client";

import ClientLayout from "@/components/ClientLayout";

// Wrapper netral untuk semua rute.
// Setiap halaman role (Patient/Doctor/Admin) membungkus dirinya sendiri dengan
// layout masing-masing DI DALAM page.js, dan ProtectedRoute menangani otorisasi.
// Layout lanjutan TIDAK boleh me-null-kan children di sini supaya halaman
// publik seperti /admin (login) tetap bisa dirender oleh user yang belum login.
export default function LayoutWrapper({ children }) {
  return <ClientLayout>{children}</ClientLayout>;
}