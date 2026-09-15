"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import AnalyticsHeader from "@/components/analytics/AnalyticsHeader";
import OverallFormScoreCard from "@/components/analytics/OverallFormScoreCard";
import FormAccuracyMetricCard from "@/components/analytics/FormAccuracyMetricCard";
import RepQualityDonutCard from "@/components/analytics/RepQualityDonutCard";
import ClinicalInsightCard from "@/components/analytics/ClinicalInsightCard";
import { getSessionAnalyticsById } from "@/lib/sessionService";
import { useAuth } from "@/context/AuthContext";

function UnavailableDataCard({ title }) {
  return (
    <div className="w-full bg-white rounded-2xl p-6 border border-[#E3DDD2] shadow-sm h-full flex flex-col items-center justify-center text-center">
      <div className="w-10 h-10 rounded-xl bg-[#EFEBE4] flex items-center justify-center mb-3">
        <Info className="w-5 h-5 text-[#718096]" />
      </div>
      <h3 className="text-sm font-black text-[#152238]">{title}</h3>
      <p className="text-xs font-medium text-[#718096] mt-1.5 italic max-w-xs">
        Data detail tidak tersedia untuk sesi ini
      </p>
      <p className="text-[10px] text-[#9AA6B2] mt-2">
        Sesi dijalankan sebelum penyimpanan data detail (per-rep scoring) tersedia.
      </p>
    </div>
  );
}

export default function SessionAnalyticsView({ sessionId = "latest" }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await getSessionAnalyticsById(sessionId, user?.uid);
        if (isMounted && res.status === "success" && res.data) {
          setAnalyticsData(res.data);
        } else if (isMounted) {
          setError(res.message || "Failed to load analytics");
        }
      } catch (err) {
        console.error("Error loading session analytics:", err);
        if (isMounted) setError("Error loading analytics");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();

    return () => {
      isMounted = false;
    };
  }, [sessionId, user?.uid]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
        <div className="bg-white p-6 rounded-2xl border border-[#E3DDD2] text-center">
          <p className="text-red-600">{error}</p>
          <button onClick={() => window.history.back()} className="mt-4 px-4 py-2 bg-[#152238] text-white rounded-xl">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-[#EFEBE4] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#152238] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const {
    patient,
    overallScore,
    accuracyMetric,
    repQualityDistribution,
    clinicalInsight,
  } = analyticsData;

  return (
    <div className="min-h-screen bg-[#EFEBE4] text-[#111A28] p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
      {/* Container Lebar Sesuai Gambar 2 */}
      <div className="max-w-[1400px] w-full mx-auto flex flex-col gap-6">
        {/* Header: Navigasi, Identitas Pasien & Action Buttons */}
        <AnalyticsHeader patient={patient} />

        {/* 2x2 Grid Layout Sesuai Gambar 2 */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          {/* Card 1: Overall Form Score (4/12 kolom pada desktop) */}
          <div className="lg:col-span-4 flex">
            <OverallFormScoreCard
              score={overallScore.score}
              grade={overallScore.grade}
              status={overallScore.status}
              totalReps={overallScore.totalReps}
              sessionsCount={overallScore.sessionsCount}
            />
          </div>

          {/* Card 2: Form Accuracy Metric (8/12 kolom pada desktop) */}
          <div className="lg:col-span-8 flex">
            {accuracyMetric.available ? (
              <FormAccuracyMetricCard
                optimal={accuracyMetric.optimal}
                variant={accuracyMetric.variant}
                critical={accuracyMetric.critical}
                details={accuracyMetric.details}
              />
            ) : (
              <UnavailableDataCard title="Form Accuracy Metric" />
            )}
          </div>

          {/* Card 3: Rep Quality Distribution Donut (4/12 kolom pada desktop) */}
          <div className="lg:col-span-4 flex">
            {repQualityDistribution.available ? (
              <RepQualityDonutCard
                totalReps={repQualityDistribution.total}
                data={repQualityDistribution.items}
              />
            ) : (
              <UnavailableDataCard title="Rep Quality Distribution" />
            )}
          </div>

          {/* Card 4: Clinical Insight & Stability (Dark Navy Card 8/12 kolom pada desktop) */}
          <div className="lg:col-span-8 flex">
            {clinicalInsight.available ? (
              <ClinicalInsightCard
                stabilityCoefficient={clinicalInsight.stabilityCoefficient}
                stabilityChange={clinicalInsight.stabilityChange}
                fatigueResistance={clinicalInsight.fatigueResistance}
                maxFatigue={clinicalInsight.maxFatigue}
                aiInterpretation={clinicalInsight.aiInterpretation}
                validatorBadge={clinicalInsight.validatorBadge}
              />
            ) : (
              <UnavailableDataCard title="Clinical Insight & Stability" />
            )}
          </div>
        </main>
      </div>

      {/* Footer Hak Cipta Ringkas */}
      <footer className="mt-8 text-center text-xs font-semibold text-[#718096]">
        PhysioV Platform · Orthopedic Physical Therapy Recovery
      </footer>
    </div>
  );
}
