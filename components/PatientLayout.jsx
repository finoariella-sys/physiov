"use client";

import { LayoutDashboard, Activity, History } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import DashboardShell from "@/components/DashboardShell";

export default function PatientLayout({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || profile?.role !== "patient") {
    return null;
  }

  return (
    <DashboardShell
      navItems={[
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/live", label: "Live Session", icon: Activity },
        { href: "/history", label: "History", icon: History },
      ]}
      roleLabel="Pasien"
      avatarFallback="PT"
    >
      {children}
    </DashboardShell>
  );
}