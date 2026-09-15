"use client";

import { LayoutDashboard, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import DashboardShell from "@/components/DashboardShell";

export default function DoctorLayout({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || profile?.role !== "doctor") {
    return null;
  }

  return (
    <DashboardShell
      navItems={[
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ]}
      brandIcon={Activity}
      roleLabel="Dokter"
      profileNamePrefix="dr. "
      avatarFallback="DR"
    >
      {children}
    </DashboardShell>
  );
}