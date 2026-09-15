"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/auth");
      return;
    }

    if (profile && allowedRoles && !allowedRoles.includes(profile.role)) {
      // Redirect to correct dashboard based on actual role instead of home
      if (profile.role === "admin") {
        router.push("/admin");
      } else if (profile.role === "doctor") {
        router.push("/dashboard");
      } else if (profile.role === "patient") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    }
  }, [user, profile, loading, allowedRoles, router]);

  if (loading || !user || (profile && allowedRoles && !allowedRoles.includes(profile.role))) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
