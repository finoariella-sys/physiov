"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getPatientsForDoctor, getPatients } from "@/lib/authService";
import { getSessionsForPatient } from "@/lib/sessionService";

function toSessionDate(s) {
  const d = s?.date;
  if (!d) return null;
  if (typeof d.toDate === "function") return d.toDate();
  if (d instanceof Date) return d;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Halaman /analytics tanpa sessionId: resolve sesi terbaru milik user yang
// sedang login lalu arahkan ke /analytics/:id. Jika tidak ada, ke /history.
function LatestSessionResolver() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !profile?.role) return;

    let cancelled = false;

    async function resolveLatest() {
      try {
        let patientIds = [];
        if (profile.role === "patient") {
          patientIds = [user.uid];
        } else if (profile.role === "doctor") {
          patientIds = (await getPatientsForDoctor(user.uid)).map((p) => p.id);
        } else {
          patientIds = (await getPatients()).map((p) => p.id);
        }

        let latest = null;
        let latestTime = -Infinity;
        for (const pid of patientIds) {
          const sessions = await getSessionsForPatient(pid);
          // getSessionsForPatient mengurutkan berdasarkan date desc, jadi sesi
          // terbaru pasien ini ada di indeks [0].
          const first = sessions[0];
          if (!first) continue;
          const d = toSessionDate(first);
          if (d && d.getTime() > latestTime) {
            latestTime = d.getTime();
            latest = first;
          }
        }

        if (!cancelled) {
          if (latest) {
            router.replace(`/analytics/${latest.id}`);
          } else {
            router.replace("/history");
          }
        }
      } catch (err) {
        console.error("Gagal resolve sesi terbaru:", err);
        if (!cancelled) router.replace("/history");
      }
    }

    resolveLatest();

    return () => {
      cancelled = true;
    };
  }, [user, profile?.role, loading, router]);

  return (
    <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function SessionAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}>
      <LatestSessionResolver />
    </ProtectedRoute>
  );
}