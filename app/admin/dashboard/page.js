"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getExercises, addExercise } from "@/lib/exerciseService";
import { seedDoctor, getDoctors, getPatients, updateUserStatus, getAllUsers } from "@/lib/authService";
import AdminLayout from "@/components/AdminLayout";

function AdminDashboardContent() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [exercises, setExercises] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showAddDoctor, setShowAddDoctor] = useState(false);

  // Form Exercise
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseDescription, setExerciseDescription] = useState("");
  const [exerciseJointFocus, setExerciseJointFocus] = useState("");

  // Form Doctor
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [doctorPassword, setDoctorPassword] = useState("");
  const [doctorSpecialization, setDoctorSpecialization] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [exers, docs, pts, all] = await Promise.all([
          getExercises(),
          getDoctors(),
          getPatients(),
          getAllUsers(),
        ]);
        setExercises(exers);
        setDoctors(docs.filter(d => d.role === "doctor"));
        setPatients(pts);
        setAllUsers(all);
      } catch (error) {
        console.error("Error loading admin data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddExercise = async (e) => {
    e.preventDefault();
    if (!exerciseName.trim() || !exerciseDescription.trim() || !exerciseJointFocus.trim()) return;

    setSubmitting(true);
    try {
      await addExercise(exerciseName, exerciseDescription, exerciseJointFocus);
      setMessage("Exercise berhasil ditambahkan!");
      setExerciseName("");
      setExerciseDescription("");
      setExerciseJointFocus("");
      setShowAddExercise(false);
      const exers = await getExercises();
      setExercises(exers);
    } catch (error) {
      setMessage("Error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!doctorName.trim() || !doctorEmail.trim() || !doctorPassword.trim() || !doctorSpecialization.trim()) return;

    setSubmitting(true);
    try {
      // Store admin credentials before creating doctor
      const { getUserProfile } = await import("@/lib/authService");
      const { auth } = await import("@/lib/firebase");
      const adminUser = auth.currentUser;
      let adminEmail = "";
      let adminPassword = "";
      
      if (adminUser) {
        // Get admin email from profile
        const adminProfile = await getUserProfile(adminUser.uid);
        adminEmail = adminProfile?.email || "";
      }
      
      await seedDoctor(doctorEmail, doctorPassword, doctorName, doctorSpecialization);
      setMessage("Dokter berhasil ditambahkan!");
      setDoctorName("");
      setDoctorEmail("");
      setDoctorPassword("");
      setDoctorSpecialization("");
      setShowAddDoctor(false);
      
      // After creating doctor, Firebase auto-logs in the new user
      // Sign out the new doctor and sign back in as admin
      if (adminEmail) {
        try {
          const { logoutUser, loginUser } = await import("@/lib/authService");
          await logoutUser();
          // We don't have admin password stored, so we'll redirect to login
          // In production, this should use Firebase Admin SDK via API route
          setMessage("Dokter berhasil ditambahkan! Silakan login kembali sebagai admin.");
          setTimeout(() => {
            router.push("/admin");
          }, 2000);
        } catch (err) {
          console.error("Error restoring admin session:", err);
        }
      }
      
      const docs = await getDoctors();
      setDoctors(docs.filter(d => d.role === "doctor"));
    } catch (error) {
      setMessage("Error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (uid, currentStatus) => {
    try {
      await updateUserStatus(uid, !currentStatus);
      setMessage(currentStatus ? "Akun dinonaktifkan" : "Akun diaktifkan");
      // Reload users
      const all = await getAllUsers();
      setAllUsers(all);
      const docs = await getDoctors();
      setDoctors(docs.filter(d => d.role === "doctor"));
      const pts = await getPatients();
      setPatients(pts);
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  };

  const handleLogout = () => {
    import("@/lib/authService").then((m) => {
      m.logoutUser();
      router.push("/");
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeDoctors = doctors.filter(d => d.isActive !== false).length;
  const activePatients = patients.filter(p => p.isActive !== false).length;
  const inactiveUsers = allUsers.filter(u => u.isActive === false).length;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#EFEBE4] text-[#152238]">
        <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E3DDD2]">
            <h3 className="font-bold text-[#526071] mb-2">Dokter Aktif</h3>
            <div className="text-4xl font-extrabold text-[#152238]">{activeDoctors}</div>
            <p className="text-xs text-[#7A889B] mt-2">Total dokter terdaftar: {doctors.length}</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E3DDD2]">
            <h3 className="font-bold text-[#526071] mb-2">Pasien Terdaftar</h3>
            <div className="text-4xl font-extrabold text-[#152238]">{activePatients}</div>
            <p className="text-xs text-[#7A889B] mt-2">Total pasien: {patients.length}</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E3DDD2]">
            <h3 className="font-bold text-[#526071] mb-2">Exercise Tersedia</h3>
            <div className="text-4xl font-extrabold text-[#152238]">{exercises.length}</div>
            <p className="text-xs text-[#7A889B] mt-2">Master data latihan</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E3DDD2]">
            <h3 className="font-bold text-[#526071] mb-2">Akun Nonaktif</h3>
            <div className="text-4xl font-extrabold text-emerald-600">{inactiveUsers}</div>
            <p className="text-xs text-[#7A889B] mt-2">Butuh perhatian</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-3xl border border-[#E3DDD2] shadow-sm overflow-hidden">
          <div className="flex border-b border-[#E3DDD2] overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 px-6 py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "overview"
                  ? "border-[#152238] text-[#152238]"
                  : "border-transparent text-[#7A889B] hover:text-[#152238]"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("patients")}
              className={`flex-1 px-6 py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "patients"
                  ? "border-[#152238] text-[#152238]"
                  : "border-transparent text-[#7A889B] hover:text-[#152238]"
              }`}
            >
              Pasien
            </button>
            <button
              onClick={() => setActiveTab("doctors")}
              className={`flex-1 px-6 py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "doctors"
                  ? "border-[#152238] text-[#152238]"
                  : "border-transparent text-[#7A889B] hover:text-[#152238]"
              }`}
            >
              Dokter
            </button>
            <button
              onClick={() => setActiveTab("exercises")}
              className={`flex-1 px-6 py-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "exercises"
                  ? "border-[#152238] text-[#152238]"
                  : "border-transparent text-[#7A889B] hover:text-[#152238]"
              }`}
            >
              Exercise
            </button>
          </div>

          <div className="p-6">
            {message && (
              <div className={`mb-4 p-3 rounded-xl text-sm ${message.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                {message}
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#EBE5DA]">
                    <h3 className="text-lg font-bold text-[#152238] mb-4">Statistik Cepat</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-[#526071]">Total Dokter</span><span className="font-bold text-[#152238]">{doctors.length}</span></div>
                      <div className="flex justify-between"><span className="text-[#526071]">Dokter Aktif</span><span className="font-bold text-emerald-600">{activeDoctors}</span></div>
                      <div className="flex justify-between"><span className="text-[#526071]">Total Pasien</span><span className="font-bold text-[#152238]">{patients.length}</span></div>
                      <div className="flex justify-between"><span className="text-[#526071]">Pasien Aktif</span><span className="font-bold text-emerald-600">{activePatients}</span></div>
                      <div className="flex justify-between"><span className="text-[#526071]">Exercise Tersedia</span><span className="font-bold text-[#152238]">{exercises.length}</span></div>
                      <div className="flex justify-between"><span className="text-[#526071]">Akun Nonaktif</span><span className="font-bold text-emerald-600">{inactiveUsers}</span></div>
                    </div>
                  </div>
                  <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#EBE5DA]">
                    <h3 className="text-lg font-bold text-[#152238] mb-4">Aksi Cepat</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setActiveTab("patients")} className="p-4 bg-white border border-[#E3DDD2] rounded-xl hover:border-[#152238] hover:shadow-md transition-all text-left">
                        <p className="font-bold text-[#152238]">Kelola Pasien</p>
                        <p className="text-xs text-[#7A889B]">Lihat, aktifkan/nonaktifkan akun</p>
                      </button>
                      <button onClick={() => setActiveTab("doctors")} className="p-4 bg-white border border-[#E3DDD2] rounded-xl hover:border-[#152238] hover:shadow-md transition-all text-left">
                        <p className="font-bold text-[#152238]">Kelola Dokter</p>
                        <p className="text-xs text-[#7A889B]">Tambah, edit, nonaktifkan akun</p>
                      </button>
                      <button onClick={() => setActiveTab("exercises")} className="p-4 bg-white border border-[#E3DDD2] rounded-xl hover:border-[#152238] hover:shadow-md transition-all text-left">
                        <p className="font-bold text-[#152238]">Kelola Exercise</p>
                        <p className="text-xs text-[#7A889B]">Tambah, edit master data latihan</p>
                      </button>
                      <button onClick={() => setShowAddDoctor(true)} className="p-4 bg-white border border-[#E3DDD2] rounded-xl hover:border-[#152238] hover:shadow-md transition-all text-left">
                        <p className="font-bold text-[#4A6FA5]">+ Tambah Dokter</p>
                        <p className="text-xs text-[#7A889B]">Buat akun dokter baru</p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Patients Tab */}
            {activeTab === "patients" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Daftar Pasien ({patients.length})</h3>
                </div>

                {patients.length === 0 ? (
                  <div className="text-center py-8 text-[#7A889B]">
                    Belum ada pasien terdaftar.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs font-bold uppercase text-[#7A889B] border-b border-[#E3DDD2]">
                          <th className="py-3 px-4">Nama</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Keluhan</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Dibuat</th>
                          <th className="py-3 px-4">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E3DDD2]">
                        {patients.map((p) => (
                          <tr key={p.id} className={`hover:bg-[#FAF7F2] ${p.isActive === false ? "opacity-50 bg-red-50" : ""}`}>
                            <td className="py-3 px-4 font-medium">{p.name}</td>
                            <td className="py-3 px-4 text-sm text-[#526071]">{p.email}</td>
                            <td className="py-3 px-4 text-sm text-[#7A889B] max-w-xs truncate">{p.condition || "-"}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${p.isActive === false ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${p.isActive === false ? "bg-red-500" : "bg-emerald-500"}`} />
                                {p.isActive === false ? "Nonaktif" : "Aktif"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-[#7A889B]">{p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString("id-ID") : "-"}</td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleUserStatus(p.id, p.isActive !== false)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${p.isActive === false ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                              >
                                {p.isActive === false ? "Aktifkan" : "Nonaktifkan"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Doctors Tab */}
            {activeTab === "doctors" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Daftar Dokter ({doctors.length})</h3>
                  <button
                    onClick={() => setShowAddDoctor(true)}
                    className="px-4 py-2 bg-[#4A6FA5] text-white rounded-xl text-sm font-bold hover:bg-[#3d5d8c] transition-colors"
                  >
                    + Tambah Dokter
                  </button>
                </div>

                {doctors.length === 0 ? (
                  <div className="text-center py-8 text-[#7A889B]">
                    Belum ada dokter. Klik &apos;Tambah Dokter&apos; untuk membuat akun dokter baru.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs font-bold uppercase text-[#7A889B] border-b border-[#E3DDD2]">
                          <th className="py-3 px-4">Nama</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Spesialisasi</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Dibuat</th>
                          <th className="py-3 px-4">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E3DDD2]">
                        {doctors.map((doc) => (
                          <tr key={doc.id} className={`hover:bg-[#FAF7F2] ${doc.isActive === false ? "opacity-50 bg-red-50" : ""}`}>
                            <td className="py-3 px-4 font-medium">dr. {doc.name}</td>
                            <td className="py-3 px-4 text-sm text-[#526071]">{doc.email}</td>
                            <td className="py-3 px-4 text-sm text-[#7A889B]">{doc.specialization || "-"}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${doc.isActive === false ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${doc.isActive === false ? "bg-red-500" : "bg-emerald-500"}`} />
                                {doc.isActive === false ? "Nonaktif" : "Aktif"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-[#7A889B]">{doc.createdAt?.toDate ? doc.createdAt.toDate().toLocaleDateString("id-ID") : "-"}</td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleUserStatus(doc.id, doc.isActive !== false)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${doc.isActive === false ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                              >
                                {doc.isActive === false ? "Aktifkan" : "Nonaktifkan"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add Doctor Modal */}
                {showAddDoctor && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl border border-[#E3DDD2] shadow-2xl w-full max-w-md p-6">
                      <h3 className="text-lg font-bold mb-4">Tambah Dokter Baru</h3>
                      <form onSubmit={handleAddDoctor} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#526071] mb-1">Nama Lengkap</label>
                          <input
                            type="text"
                            required
                            value={doctorName}
                            onChange={(e) => setDoctorName(e.target.value)}
                            className="w-full border border-[#E3DDD2] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#152238] focus:outline-none"
                            placeholder="Contoh: Dr. Budi Santoso"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#526071] mb-1">Email</label>
                          <input
                            type="email"
                            required
                            value={doctorEmail}
                            onChange={(e) => setDoctorEmail(e.target.value)}
                            className="w-full border border-[#E3DDD2] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#152238] focus:outline-none"
                            placeholder="dokter@klinik.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#526071] mb-1">Password Sementara</label>
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={doctorPassword}
                            onChange={(e) => setDoctorPassword(e.target.value)}
                            className="w-full border border-[#E3DDD2] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#152238] focus:outline-none"
                            placeholder="Minimal 6 karakter"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#526071] mb-1">Spesialisasi</label>
                          <input
                            type="text"
                            required
                            value={doctorSpecialization}
                            onChange={(e) => setDoctorSpecialization(e.target.value)}
                            className="w-full border border-[#E3DDD2] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#152238] focus:outline-none"
                            placeholder="Contoh: Ortopedi / Fisioterapi"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddDoctor(false)}
                            className="flex-1 px-4 py-2.5 bg-[#E3DDD2] text-[#152238] rounded-xl font-bold hover:bg-[#DDD5C7] transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2.5 bg-[#4A6FA5] text-white rounded-xl font-bold hover:bg-[#3d5d8c] disabled:opacity-50 transition-colors"
                          >
                            {submitting ? "Menyimpan..." : "Simpan Dokter"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Exercises Tab */}
            {activeTab === "exercises" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Daftar Exercise ({exercises.length})</h3>
                  <button
                    onClick={() => setShowAddExercise(true)}
                    className="px-4 py-2 bg-[#152238] text-white rounded-xl text-sm font-bold hover:bg-[#1C2E4C] transition-colors"
                  >
                    + Tambah Exercise
                  </button>
                </div>

                {exercises.length === 0 ? (
                  <div className="text-center py-8 text-[#7A889B]">
                    Belum ada exercise. Klik &apos;Tambah Exercise&apos; untuk memulai.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs font-bold uppercase text-[#7A889B] border-b border-[#E3DDD2]">
                          <th className="py-3 px-4">Nama</th>
                          <th className="py-3 px-4">Deskripsi</th>
                          <th className="py-3 px-4">Joint Focus</th>
                          <th className="py-3 px-4">ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E3DDD2]">
                        {exercises.map((ex) => (
                          <tr key={ex.id} className="hover:bg-[#FAF7F2]">
                            <td className="py-3 px-4 font-medium">{ex.name}</td>
                            <td className="py-3 px-4 text-sm text-[#526071] max-w-xs truncate">{ex.description}</td>
                            <td className="py-3 px-4 text-sm text-[#526071]">{ex.jointFocus}</td>
                            <td className="py-3 px-4 text-xs font-mono text-[#7A889B]">{ex.id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add Exercise Modal */}
                {showAddExercise && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl border border-[#E3DDD2] shadow-2xl w-full max-w-md p-6">
                      <h3 className="text-lg font-bold mb-4">Tambah Exercise Baru</h3>
                      <form onSubmit={handleAddExercise} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#526071] mb-1">Nama Exercise</label>
                          <input
                            type="text"
                            required
                            value={exerciseName}
                            onChange={(e) => setExerciseName(e.target.value)}
                            className="w-full border border-[#E3DDD2] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#152238] focus:outline-none"
                            placeholder="Contoh: Shoulder Raise"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#526071] mb-1">Deskripsi</label>
                          <textarea
                            required
                            rows="3"
                            value={exerciseDescription}
                            onChange={(e) => setExerciseDescription(e.target.value)}
                            className="w-full border border-[#E3DDD2] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#152238] focus:outline-none resize-none"
                            placeholder="Deskripsi gerakan dan tujuan latihan..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#526071] mb-1">Joint Focus</label>
                          <input
                            type="text"
                            required
                            value={exerciseJointFocus}
                            onChange={(e) => setExerciseJointFocus(e.target.value)}
                            className="w-full border border-[#E3DDD2] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#152238] focus:outline-none"
                            placeholder="Contoh: Bahu (Flexi/Abduksi)"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddExercise(false)}
                            className="flex-1 px-4 py-2.5 bg-[#E3DDD2] text-[#152238] rounded-xl font-bold hover:bg-[#DDD5C7] transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2.5 bg-[#152238] text-white rounded-xl font-bold hover:bg-[#1C2E4C] disabled:opacity-50 transition-colors"
                          >
                            {submitting ? "Menyimpan..." : "Simpan Exercise"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-12 text-center text-xs font-semibold text-[#718096] pb-8">
        PhysioV Admin Panel · Kelola Klinik
      </footer>
    </div>
    </AdminLayout>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}