import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDoctors, updateUserAssignedDoctor } from "@/lib/authService";
import { getSessionsForPatient, getPausedSession, checkAndCompleteExpiredPausedSessions } from "@/lib/sessionService";
import { getPrescriptionsForPatient } from "@/lib/prescriptionService";
import { getExercises } from "@/lib/exerciseService";
import { submitComplaint } from "@/lib/complaintService";
import { sendMessage, getConversationMessages } from "@/lib/chatService";
import { useRouter } from "next/navigation";
import { Activity, Target, TrendingUp, MessageSquare, Plus, Send, CheckCircle, Clock, AlertCircle, Users, RotateCcw } from "lucide-react";

export default function PatientDashboardContent() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [doctors, setDoctors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [complaintText, setComplaintText] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("prescriptions");
  const [pausedSessions, setPausedSessions] = useState({}); // prescriptionId -> paused session data

  // Chat state
  const [chatDoctorId, setChatDoctorId] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      console.log("Fetching doctors for user:", user.uid);
      // Selesaikan otomatis sesi yang dijeda > 24 jam sebelum memuat data
      await checkAndCompleteExpiredPausedSessions(user.uid).catch((err) =>
        console.warn("[fetchData] Gagal menyelesaikan sesi paused kadaluarsa:", err)
      );
      const [docs, sess, pres, exers] = await Promise.all([
        getDoctors(),
        getSessionsForPatient(user.uid),
        getPrescriptionsForPatient(user.uid),
        getExercises(),
      ]);
      console.log("Doctors fetched:", docs);
      setDoctors(docs);
      setSessions(sess);
      setPrescriptions(pres);
      setExercises(exers);

      // Fetch paused sessions for each prescription
      const pausedData = {};
      for (const p of pres) {
        const paused = await getPausedSession(user.uid, p.id);
        if (paused) {
          pausedData[p.id] = paused;
        }
      }
      setPausedSessions(pausedData);
    } catch (error) {
      console.error("Error fetching patient dashboard data:", error);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(loadTimer);
  }, [fetchData]);

  // Log chatDoctorId changes
  useEffect(() => {
    console.log("[Chat Debug] chatDoctorId changed:", chatDoctorId);
  }, [chatDoctorId]);

  // Chat effect - poll for messages every 3 seconds
  useEffect(() => {
    if (!user || !chatDoctorId) {
      const resetTimer = setTimeout(() => setChatMessages([]), 0);
      return () => clearTimeout(resetTimer);
    }

    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const msgs = await getConversationMessages(user.uid, chatDoctorId);
        if (isMounted) {
          console.log("[Chat Debug] Polling fetched messages:", { 
            chatDoctorId, 
            messageCount: msgs.length,
            messages: msgs 
          });
          setChatMessages(msgs);
        }
      } catch (error) {
        console.error("[Chat Debug] Polling error:", error);
      }
    };

    // Initial fetch
    fetchMessages();

    // Poll every 3 seconds
    const intervalId = setInterval(fetchMessages, 3000);

    return () => {
      clearInterval(intervalId);
      isMounted = false;
    };
  }, [user, chatDoctorId]);

  // Auto-scroll effect - only scroll when new messages arrive
  useEffect(() => {
    if (chatMessages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCountRef.current = chatMessages.length;
  }, [chatMessages]);

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
      setSelectedDoctorId("");
      setComplaintSuccess(true);
      setTimeout(() => setComplaintSuccess(false), 3000);
    } catch (error) {
      console.error("Error submitting complaint:", error);
    } finally {
      setSubmittingComplaint(false);
    }
  }

  async function handleSendChatMessage(e) {
    e.preventDefault();
    console.log("[Chat Debug] handleSendChatMessage called:", { 
      newChatMessage, 
      chatDoctorId, 
      userUid: user?.uid,
      sendingMessage 
    });
    if (!newChatMessage.trim() || !chatDoctorId || sendingMessage) return;

    setSendingMessage(true);
    try {
      console.log("[Chat Debug] Calling sendMessage with:", { 
        senderId: user.uid, 
        receiverId: chatDoctorId, 
        text: newChatMessage 
      });
      await sendMessage(user.uid, chatDoctorId, newChatMessage);
      console.log("[Chat Debug] sendMessage succeeded");
      setNewChatMessage("");
    } catch (error) {
      console.error("[Chat Debug] Failed to send message:", error);
    } finally {
      setSendingMessage(false);
    }
  }

  // Get doctors that have prescriptions for this patient (doctors they can chat with)
  const patientDoctors = prescriptions
    .filter(p => p.doctorId)
    .map(p => doctors.find(d => d.id === p.doctorId))
    .filter(Boolean);

  // Remove duplicates
  const uniquePatientDoctors = patientDoctors.filter((doc, index, self) =>
    index === self.findIndex(d => d.id === doc.id)
  );

  const totalReps = sessions.reduce((sum, s) => sum + (s.reps || 0), 0);
  const lastSession = sessions.length > 0 ? sessions[0] : null;
  const latestFormScore = lastSession ? lastSession.formScore : 0;

  const enhancedPrescriptions = prescriptions.map((p) => {
    const doc = doctors.find((d) => d.id === p.doctorId);
    const exer = exercises.find((e) => e.id === p.exerciseId);
    const paused = pausedSessions[p.id];
    const isPaused = !!paused;
    const isCompleted = p.status === "completed";
    const isExpired = isPaused && paused.pausedAt && ((new Date() - (paused.pausedAt.toDate ? paused.pausedAt.toDate() : new Date(paused.pausedAt))) / (1000 * 60 * 60) >= 24);
    
    return {
      ...p,
      doctorName: doc ? doc.name : "Klinisi",
      exerciseName: exer ? exer.name : "Latihan",
      pausedSession: isPaused && !isExpired ? paused : null,
      isPaused: isPaused && !isExpired,
      isExpired,
      isCompleted,
      // Display status
      displayStatus: isCompleted ? "completed" : isPaused && !isExpired ? "paused" : isExpired ? "expired" : "active",
    };
  });

  const pendingComplaints = prescriptions.filter(p => !p.doctorName || p.doctorName === "Klinisi").length;

  if (loadingData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#152238]">Selamat datang, {profile?.name}</h1>
        <p className="text-[#526071] mt-2">Pantau progres pemulihan Anda dan kerjakan latihan dari dokter.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E3DDD2] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-[#526071]">Total Repetisi</h3>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-extrabold text-[#152238]">{totalReps}</div>
          <p className="text-xs text-[#7A889B] mt-2">Sepanjang masa pemulihan</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E3DDD2] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-[#526071]">Akurasi Terakhir</h3>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-xl">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-extrabold text-[#152238]">{latestFormScore}%</div>
          <p className="text-xs text-[#7A889B] mt-2">Dari sesi terakhir</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E3DDD2] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-[#526071]">Status</h3>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">On Track</div>
          <p className="text-xs text-[#7A889B] mt-2">Terus pertahankan konsistensi</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-3xl border border-[#E3DDD2] shadow-sm overflow-hidden">
        <div className="flex border-b border-[#E3DDD2]">
          <button
            onClick={() => setActiveTab("prescriptions")}
            className={`flex-1 px-6 py-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === "prescriptions"
                ? "border-[#152238] text-[#152238] bg-[#FAF7F2]"
                : "text-[#7A889B] hover:text-[#152238] hover:bg-[#FAF7F2]"
            }`}
          >
            <Activity className="w-5 h-5 inline mr-2" /> Latihan Aktif
          </button>
          <button
            onClick={() => setActiveTab("complaint")}
            className={`flex-1 px-6 py-4 text-sm font-bold border-b-2 transition-all relative ${
              activeTab === "complaint"
                ? "border-[#152238] text-[#152238] bg-[#FAF7F2]"
                : "text-[#7A889B] hover:text-[#152238] hover:bg-[#FAF7F2]"
            }`}
          >
            <MessageSquare className="w-5 h-5 inline mr-2" /> Ajukan Keluhan
            {pendingComplaints > 0 && (
              <span className="ml-2 w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingComplaints}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 px-6 py-4 text-sm font-bold border-b-2 transition-all relative ${
              activeTab === "chat"
                ? "border-[#152238] text-[#152238] bg-[#FAF7F2]"
                : "text-[#7A889B] hover:text-[#152238] hover:bg-[#FAF7F2]"
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" /> Chat
            {uniquePatientDoctors.length > 0 && (
              <span className="ml-2 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {uniquePatientDoctors.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 px-6 py-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === "history"
                ? "border-[#152238] text-[#152238] bg-[#FAF7F2]"
                : "text-[#7A889B] hover:text-[#152238] hover:bg-[#FAF7F2]"
            }`}
          >
            <Clock className="w-5 h-5 inline mr-2" /> History
          </button>
        </div>

        <div className="p-6">
          {/* Active Prescriptions Tab */}
          {activeTab === "prescriptions" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-6 h-6 text-emerald-600" /> Latihan Aktif (Prescription)
              </h3>
              {enhancedPrescriptions.length === 0 ? (
                <div className="bg-[#FAF7F2] p-8 rounded-2xl border border-[#EBE5DA] text-center">
                  <div className="text-4xl mb-4">🛌</div>
                  <p className="text-[#526071] text-sm">Belum ada latihan yang ditugaskan.</p>
                  <p className="text-[#7A889B] text-xs mt-1">Silakan ajukan keluhan jika butuh penanganan di tab &quot;Ajukan Keluhan&quot;.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {enhancedPrescriptions.map((pres) => (
                    <div key={pres.id} className="bg-white p-6 rounded-2xl border border-[#E3DDD2] shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg text-[#152238]">{pres.exerciseName}</h4>
                        <span className={`bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-bold ${pres.isPaused ? "bg-blue-100 text-blue-700" : ""} ${pres.isExpired ? "bg-amber-100 text-amber-700" : ""} ${pres.isCompleted ? "bg-gray-100 text-gray-700" : ""}`}>
                          {pres.isPaused ? "Dijeda" : pres.isExpired ? "Kadaluarsa" : pres.isCompleted ? "Selesai" : "Baru"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-2 text-[#526071]">
                          <Target className="w-4 h-4 text-emerald-500" />
                          <span>Target: <span className="font-bold text-[#152238]">{pres.targetReps} Reps</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-[#526071]">
                          <MessageSquare className="w-4 h-4 text-emerald-500" />
                          <span>dr. <span className="font-bold text-[#152238]">{pres.doctorName}</span></span>
                        </div>
                      </div>
                      {pres.notes && (
                        <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-xl mb-4 border border-blue-100">
                          <span className="font-bold">Catatan Dokter:</span> {pres.notes}
                        </div>
                      )}
                      {pres.isPaused && pres.pausedSession && (
                        <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-xl mb-4 border border-blue-100 flex items-center gap-2">
                          <RotateCcw className="w-4 h-4" />
                          <span>Sesi dijeda pada {pres.pausedSession.pausedAt?.toDate ? pres.pausedSession.pausedAt.toDate().toLocaleString("id-ID") : "..."}. Reps terkumpul: {pres.pausedSession.reps}</span>
                        </div>
                      )}
                      {pres.isExpired && (
                        <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-xl mb-4 border border-amber-100 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>Sesi dijeda lebih dari 24 jam. Hasil reps terakhir ({pres.pausedSession?.reps || 0}) disimpan sebagai selesai.</span>
                        </div>
                      )}
                      <button
                        onClick={() => router.push(`/live?prescriptionId=${pres.id}`)}
                        disabled={pres.isCompleted || pres.isExpired}
                        className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 ${
                          pres.isCompleted || pres.isExpired
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : pres.isPaused
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-[#152238] hover:bg-[#1C2E4C] text-white"
                        }`}
                      >
                        {pres.isCompleted ? "Sesi Selesai" : pres.isExpired ? "Kadaluarsa" : pres.isPaused ? "Lanjutkan Sesi" : "Mulai Sesi"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Complaint Tab */}
          {activeTab === "complaint" && (
            <form onSubmit={handleComplaintSubmit} className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-emerald-600" /> Ajukan Keluhan Baru
              </h3>
              <p className="text-sm text-[#526071]">
                Deskripsikan kondisi atau rasa sakit yang dialami. Dokter akan meninjau dan menugaskan latihan yang sesuai.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-[#526071] mb-1">Pilih Dokter</label>
                <select
                  required
                  className="w-full border border-[#E3DDD2] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#152238] focus:outline-none bg-[#FAF7F2]"
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
                <label className="block text-sm font-medium text-[#526071] mb-1">Deskripsi Keluhan</label>
                <textarea
                  required
                  rows="5"
                  placeholder="Contoh: Sakit lutut kanan saat berjalan turun tangga, sudah 2 minggu tidak kunjung membaik..."
                  className="w-full border border-[#E3DDD2] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#152238] focus:outline-none bg-[#FAF7F2] resize-none"
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                ></textarea>
              </div>

              {complaintSuccess && (
                <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-xl border border-emerald-200 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span>Keluhan berhasil dikirim! Menunggu respon dokter.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingComplaint || !selectedDoctorId || !complaintText.trim()}
                className="w-full bg-[#152238] hover:bg-[#1C2E4C] text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submittingComplaint ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Keluhan</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Clock className="w-6 h-6 text-emerald-600" /> Riwayat Sesi
              </h3>
              {sessions.length === 0 ? (
                <div className="bg-[#FAF7F2] p-8 rounded-2xl border border-[#EBE5DA] text-center">
                  <div className="text-4xl mb-4">📭</div>
                  <p className="text-[#526071] text-sm">Belum ada riwayat sesi.</p>
                  <p className="text-[#7A889B] text-xs mt-1">Riwayat akan muncul setelah Anda menyelesaikan sesi latihan.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sessions.map((session) => (
                    <div key={session.id} className="bg-white p-4 rounded-xl border border-[#E3DDD2] hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <Activity className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#152238]">
                              {new Date(session.date).toLocaleDateString("id-ID", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                              })}
                            </p>
                            <p className="text-xs text-[#7A889B]">
                              {new Date(session.date).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })} WIB
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-extrabold text-[#152238]">{session.reps} Reps</p>
                          <p className="text-xs text-[#7A889B]">Form Score: {session.formScore}%</p>
                        </div>
                      </div>
                      {session.prescriptionId && (
                        <p className="text-xs text-[#7A889B] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Prescription: {session.prescriptionId.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

          {/* Chat Tab */}
          {activeTab === "chat" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6 text-emerald-600" /> Chat dengan Dokter
              </h3>
              <p className="text-sm text-[#526071]">
                Komunikasi langsung dengan dokter yang menanganinya untuk konsultasi dan pengingat sesi.
              </p>

              <div className="flex flex-1 overflow-hidden border border-[#E3DDD2] rounded-xl">
                {/* Contact List */}
                <div className="w-1/3 border-r border-[#E3DDD2] bg-[#FAF7F2] overflow-y-auto">
                  {uniquePatientDoctors.length === 0 ? (
                    <div className="p-6 text-center text-sm text-[#7A889B]">
                      Belum ada dokter yang terhubung.<br />
                      <span className="text-xs">Dokter akan muncul setelah assign latihan.</span>
                    </div>
                  ) : (
                    uniquePatientDoctors.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          console.log("[Chat Debug] Doctor selected, setting chatDoctorId:", doc.id);
                          setChatDoctorId(doc.id);
                        }}
                        className={`w-full text-left p-3 border-b border-[#E3DDD2] transition-colors text-sm ${
                          chatDoctorId === doc.id
                            ? "bg-blue-50 border-l-2 border-l-blue-600"
                            : "hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Users className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[#152238] truncate">dr. {doc.name}</div>
                            {doc.specialization && (
                              <div className="text-xs text-[#7A889B] truncate">{doc.specialization}</div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Chat Area */}
                <div className="w-2/3 flex flex-col bg-white">
                  {!chatDoctorId ? (
                    <div className="flex-1 flex items-center justify-center text-sm text-[#7A889B] p-4 text-center">
                      Pilih dokter untuk memulai percakapan
                    </div>
                  ) : (
                    <>
                      <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                        {chatMessages.length === 0 ? (
                          <div className="text-center text-xs text-[#7A889B] mt-4">Belum ada pesan. Mulai percakapan!</div>
                        ) : (
                          chatMessages.map(msg => {
                            const isMe = msg.senderId === user?.uid;
                            return (
                              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${isMe ? 'bg-[#152238] text-white rounded-tr-none' : 'bg-white border border-[#E3DDD2] text-gray-800 rounded-tl-none'}`}>
                                  {msg.text}
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-[#E3DDD2] flex gap-2">
                        <input
                          type="text"
                          value={newChatMessage}
                          onChange={(e) => setNewChatMessage(e.target.value)}
                          placeholder="Ketik pesan..."
                          className="flex-1 border border-[#E3DDD2] rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={!newChatMessage.trim() || sendingMessage}
                          className="bg-[#152238] text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
</div>
      </div>
  );
}