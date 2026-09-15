"use client";

import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import SessionAnalyticsView from "@/components/analytics/SessionAnalyticsView";

export default function DynamicSessionAnalyticsPage() {
  const params = useParams();
  const sessionId = params?.sessionId || "latest";

  return (
    <ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}>
      <SessionAnalyticsView sessionId={sessionId} />
    </ProtectedRoute>
  );
}