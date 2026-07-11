"use client";

import Link from "next/link";
import { Toaster } from "react-hot-toast";
import { Tickets } from "lucide-react";

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
          action={
            <Link
              href="/dashboard/tickets/armbands"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800 sm:w-auto"
            >
              <Tickets size={18} />
              Print Armbands
            </Link>
          }
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