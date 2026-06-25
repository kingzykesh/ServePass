"use client";

import { Toaster } from "react-hot-toast";

import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import TicketGenerator from "@/components/tickets/TicketGenerator";
import TicketList from "@/components/tickets/TicketList";

export default function TicketsPage() {
  return (
    <DashboardLayout>
      <Toaster position="top-center" />

      <div className="space-y-8">

        <PageHeader
          title="Ticket Generator"
          description="Generate and manage QR meal tickets."
        />

        <TicketGenerator />

        <div className="space-y-4">

          <h2 className="text-2xl font-black text-gray-950">
            Generated Tickets
          </h2>

          <TicketList />

        </div>

      </div>
    </DashboardLayout>
  );
}