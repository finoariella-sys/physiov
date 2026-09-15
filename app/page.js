"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import LandingPage from "@/app/landing/page";

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      return;
    }

    if (profile) {
      if (profile.role === "patient" || profile.role === "doctor") {
        router.push("/dashboard");
      } else if (profile.role === "admin") {
        router.push("/admin");
      }
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}