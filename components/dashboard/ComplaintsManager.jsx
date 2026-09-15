"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getComplaintsForDoctor } from "@/lib/complaintService";
import { getExercises } from "@/lib/exerciseService";
import { createPrescription } from "@/lib/prescriptionService";
import { getUserProfile } from "@/lib/authService"; // we might need to get patient names, but complaints might just have patientId. We can fetch patient names.

export default function ComplaintsManager({ doctorId }) {
  const [complaints, setComplaints] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientsCache, setPatientsCache] = useState({});
  const patientsCacheRef = useRef({});

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [targetReps, setTargetReps] = useState(10);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [comps, exers] = await Promise.all([
        getComplaintsForDoctor(doctorId),
        getExercises(),
      ]);
      
      const pendingComps = comps.filter(c => c.status !== "handled");
      
      // Fetch patient names for these complaints
      const pCache = { ...patientsCacheRef.current };
      for (const c of pendingComps) {
        if (!pCache[c.patientId]) {
          try {
            const p = await getUserProfile(c.patientId);
            pCache[c.patientId] = p;
          } catch (e) {
            pCache[c.patientId] = { name: "Unknown Patient" };
          }
        }
      }
      
      patientsCacheRef.current = pCache;
      setPatientsCache(pCache);
      setComplaints(pendingComps);
      setExercises(exers);
    } catch (error) {
      console.error("Error loading complaints:", error);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId) return;
    let cancelled = false;
    const loadTimer = setTimeout(() => {
      if (!cancelled) loadData();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(loadTimer);
    };
  }, [doctorId, loadData]);

  async function handleAssign(e) {
    e.preventDefault();
    if (!selectedComplaint || !selectedExerciseId || targetReps <= 0) return;

    setSubmitting(true);
    try {
      await createPrescription({
        complaintId: selectedComplaint.id,
        patientId: selectedComplaint.patientId,
        doctorId: doctorId,
        exerciseId: selectedExerciseId,
        targetReps: parseInt(targetReps, 10),
        notes: notes,
      });
      
      // Remove handled complaint from list
      setComplaints(complaints.filter(c => c.id !== selectedComplaint.id));
      setSelectedComplaint(null);
      setNotes("");
    } catch (error) {
      console.error("Error creating prescription:", error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-6 bg-white rounded-2xl border border-gray-200 animate-pulse h-64"></div>;
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#E3DDD2] shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold">
          !
        </div>
        <div>
          <h2 className="text-lg font-black text-[#152238] tracking-tight">Keluhan Masuk</h2>
          <p className="text-xs text-[#718096] font-semibold">Butuh penanganan & penugasan latihan</p>
        </div>
      </div>

      {!selectedComplaint ? (
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {complaints.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              Tidak ada keluhan baru dari pasien.
            </div>
          ) : (
            complaints.map(c => (
              <div key={c.id} className="p-4 border border-orange-100 bg-orange-50/50 rounded-2xl">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-[#152238]">{patientsCache[c.patientId]?.name}</h4>
                  <span className="text-xs text-gray-500">
                    {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('id-ID') : ""}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">{c.text}</p>
                <button
                  onClick={() => setSelectedComplaint(c)}
                  className="text-xs font-bold text-white bg-[#152238] hover:bg-[#1f3152] px-4 py-2 rounded-lg transition-colors"
                >
                  Tanggapi & Assign Latihan
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full border-t border-gray-100 pt-4 mt-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[#152238]">
              Tanggapi {patientsCache[selectedComplaint.patientId]?.name}
            </h3>
            <button
              onClick={() => setSelectedComplaint(null)}
              className="text-xs text-gray-500 hover:text-[#152238] underline"
            >
              Batal
            </button>
          </div>
          
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl mb-4 border border-gray-100">
            {selectedComplaint.text}
          </div>

          <form onSubmit={handleAssign} className="space-y-4 flex-1">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Latihan</label>
              <select
                required
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white"
              >
                <option value="" disabled>-- Pilih Jenis Latihan --</option>
                {exercises.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Target Repetisi</label>
              <input
                type="number"
                min="1"
                required
                value={targetReps}
                onChange={(e) => setTargetReps(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Catatan Tambahan (Opsional)</label>
              <textarea
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Fokus pada rentang gerak..."
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white resize-none"
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={submitting || !selectedExerciseId}
              className="w-full bg-[#152238] text-white font-bold text-sm py-2.5 rounded-xl disabled:opacity-50"
            >
              {submitting ? "Memproses..." : "Tugaskan Latihan"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
