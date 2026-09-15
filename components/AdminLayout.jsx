"use client";

import { LayoutDashboard, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import DashboardShell from "@/components/DashboardShell";

export default function AdminLayout({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || profile?.role !== "admin") {
    return null;
  }

  return (
    <DashboardShell
      navItems={[
        { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
      ]}
      brandHref="/admin/dashboard"
      brandIcon={Shield}
      brandTitle="PhysioV Admin"
      roleLabel="Admin"
      avatarFallback="AD"
    >
      {children}
    </DashboardShell>
  );
}