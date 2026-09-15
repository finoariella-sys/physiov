"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getDoctors, updateUserAssignedDoctor } from "@/lib/authService";
import { getSessionsForPatient, checkAndCompleteExpiredPausedSessions } from "@/lib/sessionService";
import { getPrescriptionsForPatient } from "@/lib/prescriptionService";
import { getExercises } from "@/lib/exerciseService";
import { submitComplaint } from "@/lib/complaintService";
import { useRouter } from "next/navigation";

export default function PatientDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [doctors, setDoctors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [exercises, setExercises] = useState([]);
  
  const [loadingData, setLoadingData] = useState(true);

  // Form keluhan
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [complaintText, setComplaintText] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Selesaikan otomatis sesi yang dijeda > 24 jam sebelum memuat data
      await checkAndCompleteExpiredPausedSessions(user.uid).catch((err) =>
        console.warn("Gagal menyelesaikan sesi paused kadaluarsa:", err)
      );
      const [docs, sess, pres, exers] = await Promise.all([
        getDoctors(),
        getSessionsForPatient(user.uid),
        getPrescriptionsForPatient(user.uid),
        getExercises(),
      ]);
      setDoctors(docs);
      setSessions(sess);
      setPrescriptions(pres);
      setExercises(exers);
    } catch (error) {
      console.error("Error fetching patient dashboard data:", error);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const loadTimer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(loadTimer);
  }, [user, fetchData]);

  async function handleComplaintSubmit(e) {
    e.preventDefault();
    if (!selectedDoctorId || !complaintText.trim()) return;

    setSubmittingComplaint(true);
    try {
      await submitComplaint(user.uid, selectedDoctorId, complaintText);
      try {
        await updateUserAssignedDoctor(user.uid, selectedDoctorId);
      } catch (updateErr) {
        console.error("Error updating assignedDoctorId:", updateErr);
      }
      setComplaintText("");
      setComplaintSuccess(true);
      setTimeout(() => setComplaintSuccess(false), 3000);
    } catch (error) {
      console.error("Error submitting complaint:", error);
    } finally {
      setSubmittingComplaint(false);
    }
  }

  // Calculate summary stats
  const totalReps = sessions.reduce((sum, s) => sum + (s.reps || 0), 0);
  const lastSession = sessions.length > 0 ? sessions[0] : null;
  const latestFormScore = lastSession ? lastSession.formScore : 0;

  // Enhance prescriptions with doctor and exercise names
  const enhancedPrescriptions = prescriptions.map((p) => {
    const doc = doctors.find((d) => d.id === p.doctorId);
    const exer = exercises.find((e) => e.id === p.exerciseId);
    return {
      ...p,
      doctorName: doc ? doc.name : "Klinisi",
      exerciseName: exer ? exer.name : "Latihan",
    };
  });

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <div className="min-h-screen bg-[#EFEBE4] text-[#152238] font-sans pb-12">
        {/* Header */}
        <header className="bg-[#152238] text-white p-6 lg:px-12 rounded-b-[2rem] shadow-md">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1">PhysioV</h1>
              <p className="text-sm text-gray-300">Portal Pasien</p>
            </div>
            <button
              onClick={() => {
                import("@/lib/authService").then((m) => {
                  m.logoutUser();
                  router.push("/");
                });
              }}
              className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              Keluar
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold">Selamat datang, {profile?.name}</h2>
            <p className="text-gray-600 mt-2">Pantau progres pemulihan Anda dan kerjakan latihan dari dokter.</p>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-600">Total Repetisi</h3>
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl">
                      🔄
                    </div>
                  </div>
                  <div className="text-4xl font-extrabold">{totalReps}</div>
                  <p className="text-xs text-gray-400 mt-2">Sepanjang masa pemulihan</p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-600">Akurasi Terakhir</h3>
                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-xl">
                      🎯
                    </div>
                  </div>
                  <div className="text-4xl font-extrabold">{latestFormScore}%</div>
                  <p className="text-xs text-gray-400 mt-2">Dari sesi terakhir</p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-600">Status</h3>
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-xl">
                      ⭐
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">On Track</div>
                  <p className="text-xs text-gray-400 mt-2">Terus pertahankan konsistensi</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Prescriptions */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span>📋</span> Latihan Aktif (Prescription)
                  </h3>
                  {enhancedPrescriptions.length === 0 ? (
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center shadow-sm">
                      <div className="text-4xl mb-4">🛌</div>
                      <p className="text-gray-500 text-sm">Belum ada latihan yang ditugaskan.<br />Silakan ajukan keluhan jika butuh penanganan.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {enhancedPrescriptions.map((pres) => (
                        <div key={pres.id} className="bg-white p-6 rounded-3xl border-l-4 border-l-green-500 shadow-sm transition-transform hover:-translate-y-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-lg">{pres.exerciseName}</h4>
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
                              Baru
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            Ditugaskan oleh dr. {pres.doctorName} <br />
                            Target: <span className="font-bold">{pres.targetReps} Repetisi</span>
                          </p>
                          {pres.notes && (
                            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-xl mb-4 border border-blue-100">
                              <span className="font-bold">Catatan:</span> {pres.notes}
                            </div>
                          )}
                          <button
                            onClick={() => router.push(`/live?prescriptionId=${pres.id}`)}
                            className="w-full bg-[#152238] hover:bg-[#1f3152] text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
                          >
                            Mulai Sesi
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ajukan Keluhan */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span>💬</span> Ajukan Keluhan Baru
                  </h3>
                  <form onSubmit={handleComplaintSubmit} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Dokter</label>
                      <select
                        required
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#152238] focus:outline-none bg-gray-50"
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                      >
                        <option value="" disabled>-- Pilih Dokter yang Dituju --</option>
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            dr. {d.name} {d.specialization ? `(${d.specialization})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Keluhan</label>
                      <textarea
                        required
                        rows="4"
                        placeholder="Deskripsikan kondisi atau rasa sakit yang dialami..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#152238] focus:outline-none bg-gray-50 resize-none"
                        value={complaintText}
                        onChange={(e) => setComplaintText(e.target.value)}
                      ></textarea>
                    </div>

                    {complaintSuccess && (
                      <div className="bg-green-50 text-green-700 text-sm p-3 rounded-xl border border-green-200">
                        Keluhan berhasil dikirim! Menunggu respon dokter.
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submittingComplaint || !selectedDoctorId || !complaintText.trim()}
                      className="w-full bg-[#4A6FA5] hover:bg-[#3d5d8c] text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {submittingComplaint ? "Mengirim..." : "Kirim Keluhan"}
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
