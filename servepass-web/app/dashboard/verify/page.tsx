"use client";

import { Toaster } from "react-hot-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import QRVerifier from "@/components/verify/QRVerifier";

export default function VerifyPage() {
  return (
    <DashboardLayout>
      <Toaster position="top-center" />

      <div className="space-y-8">
        <PageHeader
          title="QR Verification"
          description="Scan QR meal tickets and verify access instantly."
        />

        <QRVerifier />
      </div>
    </DashboardLayout>
  );
}