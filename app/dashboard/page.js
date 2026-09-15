"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import PatientLayout from "@/components/PatientLayout";
import DoctorLayout from "@/components/DoctorLayout";
import PatientDashboardContent from "@/components/patient/PatientDashboardContent";
import WeeklyAIDigestBanner from "@/components/dashboard/WeeklyAIDigestBanner";
import PatientWatchlistTable from "@/components/dashboard/PatientWatchlistTable";
import PatientVolumeTrendCard from "@/components/dashboard/PatientVolumeTrendCard";
import AvgRecoveryDaysCard from "@/components/dashboard/AvgRecoveryDaysCard";
import ComplaintsManager from "@/components/dashboard/ComplaintsManager";
import ChatPanel from "@/components/dashboard/ChatPanel";
import { getComplaintsForDoctor } from "@/lib/complaintService";
import { getPrescriptionsForDoctor } from "@/lib/prescriptionService";
import { getSessionsForPatient } from "@/lib/sessionService";
import { getDoctors } from "@/lib/authService";
import { getUserProfile } from "@/lib/authService";
import { getPatientsForDoctor } from "@/lib/authService";

const DAY_LABELS = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];

function toSessionDate(s) {
  const d = s?.date;
  if (!d) return null;
  if (typeof d.toDate === "function") return d.toDate();
  if (d instanceof Date) return d;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Statistik dokumen dihitung dari data sesi real dokter.
function computeSessionStats(allSessions, sessionsByPatient, patientRows) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayDow = todayStart.getDay();

  // Minggu berjalan: Senin s.d. Minggu
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - (todayDow === 0 ? 6 : todayDow - 1));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // 7 hari terakhir vs 7 hari sebelumnya (untuk tren form score)
  const recentCutoff = new Date(todayStart);
  recentCutoff.setDate(todayStart.getDate() - 6);
  const priorStart = new Date(recentCutoff);
  priorStart.setDate(recentCutoff.getDate() - 7);

  const weeklyCounts = new Array(7).fill(0);
  const recentScores = [];
  const priorScores = [];

  for (const s of allSessions) {
    const d = toSessionDate(s);
    if (!d) continue;
    if (d >= weekStart && d < weekEnd) weeklyCounts[d.getDay()] += 1;
    if (d >= recentCutoff) recentScores.push(s.formScore || 0);
    else if (d >= priorStart) priorScores.push(s.formScore || 0);
  }

  const maxCount = Math.max(...weeklyCounts, 0);
  const volumeTrend = weeklyCounts.map((count, idx) => ({
    day: DAY_LABELS[idx],
    count,
    isHighlight: count > 0 && count === maxCount,
  }));

  const recentAvg = recentScores.length
    ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    : 0;
  const priorAvg = priorScores.length
    ? priorScores.reduce((a, b) => a + b, 0) / priorScores.length
    : 0;

  let recoveryVelocity = "—";
  let velocitySubtitle = "Belum ada cukup data untuk menghitung tren";
  if (priorAvg > 0 && recentScores.length > 0) {
    const pct = ((recentAvg - priorAvg) / priorAvg) * 100;
    recoveryVelocity = `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
    velocitySubtitle =
      "Perubahan rata-rata form score, 7 hari terakhir vs 7 hari sebelumnya";
  }

  // Rata-rata durasi pemulihan (hari) antara sesi pertama & terakhir per pasien
  const gaps = [];
  for (const patientId of Object.keys(sessionsByPatient)) {
    const sessList = sessionsByPatient[patientId];
    if (sessList.length < 2) continue;
    const first = toSessionDate(sessList[sessList.length - 1]);
    const last = toSessionDate(sessList[0]);
    if (first && last) {
      gaps.push(Math.max(Math.round((last - first) / 86400000), 0));
    }
  }
  const avgDays = gaps.length
    ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
    : 0;

  const progressAvg = patientRows.length
    ? Math.round(
        patientRows.reduce((sum, p) => {
          return sum + Math.min(100, ((p.totalRepsCompleted || 0) / (p.targetReps || 1)) * 100);
        }, 0) / patientRows.length
      )
    : 0;

  return {
    volumeTrend,
    recoveryVelocity,
    velocitySubtitle,
    recoveryDays: {
      avgDays,
      trend: gaps.length
        ? `Rata-rata dari ${gaps.length} pasien dengan >=2 sesi`
        : "Belum ada data sesi memadai",
      data: [
        { name: "Completed", value: progressAvg, color: "#152238" },
        { name: "Remaining", value: 100 - progressAvg, color: "#E3DDD2" },
      ],
    },
  };
}

function DoctorDashboardContent() {
  const { user, profile } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComplaints, setShowComplaints] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [sessionsSummary, setSessionsSummary] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [comps, prescriptions, assignedPatients] = await Promise.all([
          getComplaintsForDoctor(user.uid),
          getPrescriptionsForDoctor(user.uid),
          getPatientsForDoctor(user.uid),
        ]);
        setComplaints(comps.filter(c => c.status !== "handled"));
        
        // Watchlist: sumber utama adalah assignedDoctorId di profil pasien.
        // Prescriptions hanya pelengkap untuk data legacy yang belum punya assignedDoctorId.
        const assignedPatientIds = (assignedPatients || []).map(p => p.id);
        const prescriptionPatientIds = prescriptions.map(p => p.patientId);
        const uniquePatientIds = [...new Set([...assignedPatientIds, ...prescriptionPatientIds])];
        
        const allDoctorSessions = [];
        const patientSessionsByPatient = {};
        
        // Load patient profiles and enrich with prescription/session data
        const patientData = await Promise.all(
          uniquePatientIds.map(async (pid) => {
            try {
              const patientProfile = await getUserProfile(pid);
              
              // Get prescriptions for this patient from this doctor
              const patientPrescriptions = prescriptions.filter(p => p.patientId === pid);
              
              // Get sessions for this patient
              const sessions = await getSessionsForPatient(pid);
              const doctorSessions = sessions.filter(s => 
                patientPrescriptions.some(pp => pp.id === s.prescriptionId)
              );
              allDoctorSessions.push(...doctorSessions);
              patientSessionsByPatient[pid] = doctorSessions;
              
              // Calculate total reps completed from doctor's sessions
              const totalRepsCompleted = doctorSessions.reduce((sum, s) => sum + (s.reps || 0), 0);
              
              // Calculate average form score
              const avgForm = doctorSessions.length > 0
                ? Math.round(doctorSessions.reduce((sum, s) => sum + (s.formScore || 0), 0) / doctorSessions.length)
                : null;
              
              // Determine target reps (from first prescription)
              const firstPrescription = patientPrescriptions[0];
              const targetReps = firstPrescription?.targetReps || 50;
              
              // Determine status
              let status = "NO SESSION";
              let statusType = "neutral";
              if (totalRepsCompleted >= targetReps) {
                status = "COMPLETED";
                statusType = "completed";
              } else if (totalRepsCompleted > 0) {
                status = "ON TRACK";
                statusType = "success";
              }
              
              // Get clinician name (logged-in doctor)
              const clinicianName = profile?.name ? `dr. ${profile.name}` : "";
              
              // Get condition from complaints
              const patientComplaints = comps.filter(c => c.patientId === pid);
              const condition = patientComplaints[0]?.text || "Rehabilitasi";
              
              // Generate initials
              const initials = patientProfile?.name
                ? patientProfile.name.split(" ").map(n => n[0]).join("").toUpperCase()
                : "PT";
              
              return {
                id: pid,
                name: patientProfile?.name || "Unknown Patient",
                initials,
                clinician: clinicianName,
                condition,
                targetReps,
                totalRepsCompleted,
                avgForm,
                reps: `${totalRepsCompleted}/${targetReps}`,
                status,
                statusType,
              };
            } catch (err) {
              console.error(`Error loading patient ${pid}:`, err);
              // Log more details to debug "Unknown Patient"
              console.error(`Patient ID: ${pid}, Error details:`, err.message, err.stack);
              return { id: pid, name: "Unknown Patient" };
            }
          })
        );
        setPatients(patientData);
        setSessionsSummary(computeSessionStats(allDoctorSessions, patientSessionsByPatient, patientData));
      } catch (err) {
        console.error("Error loading clinician dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (user) loadData();
  }, [user, profile?.name]);

  const dashboardData = {
    weeklyDigest: {
      recoveryVelocity: sessionsSummary?.recoveryVelocity ?? "—",
      velocitySubtitle: sessionsSummary?.velocitySubtitle ?? "Belum ada sesi tercatat",
      adherenceRate: patients.length > 0 ? `${Math.round((patients.filter(p => p.totalRepsCompleted > 0).length / patients.length) * 100)}%` : "0%",
      adherenceSubtitle: `${patients.filter(p => p.totalRepsCompleted > 0).length} of ${patients.length} patients active`,
      riskAlerts: complaints.length.toString().padStart(2, "0"),
      riskSubtitle: "Manual review required",
    },
    volumeTrend: sessionsSummary?.volumeTrend ?? DAY_LABELS.map(day => ({ day, count: 0, isHighlight: false })),
    recoveryDays: sessionsSummary?.recoveryDays ?? {
      avgDays: 0,
      trend: "Belum ada data sesi",
      data: [
        { name: "Completed", value: 0, color: "#152238" },
        { name: "Remaining", value: 100, color: "#E3DDD2" },
      ],
    },
  };

  const { weeklyDigest, volumeTrend, recoveryDays } = dashboardData;

return (
    <DoctorLayout>
      <div className="min-h-screen bg-[#EFEBE4] text-[#111A28] p-4 sm:p-6 lg:p-8 flex flex-col">
        <div className="max-w-[1440px] w-full mx-auto flex flex-col flex-1 gap-5 sm:gap-6">
          {/* Top: Weekly AI Digest - full width */}
          <WeeklyAIDigestBanner
            recoveryVelocity={weeklyDigest.recoveryVelocity}
            velocitySubtitle={weeklyDigest.velocitySubtitle}
            adherenceRate={weeklyDigest.adherenceRate}
            adherenceSubtitle={weeklyDigest.adherenceSubtitle}
            riskAlerts={weeklyDigest.riskAlerts}
            riskSubtitle={weeklyDigest.riskSubtitle}
          />
          
          {/* Middle: Two columns - Left: stacked cards, Right: tall tabbed card */}
          <div className="flex-1 flex gap-5 sm:gap-6">
            {/* Left Column: Stacked cards */}
            <div className="flex-1 lg:w-2/3 flex flex-col gap-5 sm:gap-6 min-w-0">
              {/* Patient Watchlist */}
              <div className="flex-1 min-h-0">
                <PatientWatchlistTable patients={patients} />
              </div>
              {/* Patient Volume Trend */}
              <div className="flex-1 min-h-0">
                <PatientVolumeTrendCard data={volumeTrend} />
              </div>
              {/* Avg Recovery Days */}
              <div className="flex-1 min-h-0">
                <AvgRecoveryDaysCard
                  avgDays={recoveryDays.avgDays}
                  trend={recoveryDays.trend}
                  data={recoveryDays.data}
                />
              </div>
            </div>
            
            {/* Right Column: Single tall tabbed card matching left column height */}
            <div className="lg:w-1/3 flex-1 min-h-0 lg:min-h-[calc(100vh-280px)]">
              <div className="h-full flex flex-col bg-white rounded-3xl border border-[#E3DDD2] shadow-sm">
                {/* Tab Headers */}
                <div className="flex border-b border-[#E3DDD2] flex-shrink-0">
                  <button
                    onClick={() => { setShowComplaints(true); setShowChat(false); }}
                    className={`flex-1 px-4 py-3 text-sm font-bold rounded-tl-xl transition-all ${
                      showComplaints
                        ? "bg-[#152238] text-white"
                        : "bg-white text-[#718096] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    Keluhan Masuk ({complaints.length})
                  </button>
                  <button
                    onClick={() => { setShowChat(true); setShowComplaints(false); }}
                    className={`flex-1 px-4 py-3 text-sm font-bold rounded-tr-xl transition-all ${
                      showChat
                        ? "bg-[#152238] text-white"
                        : "bg-white text-[#718096] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    Chat Pasien
                  </button>
                </div>
                {/* Tab Content - fills remaining height */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  {showComplaints ? (
                    <ComplaintsManager doctorId={user.uid} />
                  ) : (
                    <ChatPanel doctorId={user.uid} patients={patients} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <footer className="mt-8 text-center text-xs font-semibold text-[#718096]">
          PhysioV Platform · Clinician Rehabilitation Monitoring
        </footer>
      </div>
    </DoctorLayout>
  );
}

function DashboardRouter() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile?.role === "admin") {
      router.push("/admin");
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (profile?.role === "patient") {
    return (
      <PatientLayout>
        <PatientDashboardContent />
      </PatientLayout>
    );
  }

  if (profile?.role === "doctor") {
    return <DoctorDashboardContent />;
  }

  return (
    <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["patient", "doctor"]}>
      <DashboardRouter />
    </ProtectedRoute>
  );
}