"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import { ArrowLeft, ExternalLink, Printer } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";

export default function TicketDetailsPage() {
  const { uuid } = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTicket() {
      try {
        const res = await api.get(`/api/public/ticket/${uuid}`);
        setTicket(res.data.data);
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [uuid]);

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-sm text-gray-600">Loading ticket...</p>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-black text-gray-950">Ticket not found</h1>
        </Card>
      </DashboardLayout>
    );
  }

  const ticketUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/ticket/${ticket.ticket_uuid}`
      : ticket.qr_payload;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/tickets"
            className="flex items-center gap-2 text-sm font-bold text-gray-700"
          >
            <ArrowLeft size={18} />
            Back
          </Link>

          <a
            href={`/ticket/${ticket.ticket_uuid}`}
            target="_blank"
            className="flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-bold text-white"
          >
            <ExternalLink size={16} />
            Public Ticket
          </a>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="bg-green-600 p-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-widest">
              ServePass
            </p>
            <h1 className="mt-2 text-3xl font-black">Meal Ticket</h1>
          </div>

          <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
              <Badge>{ticket.status}</Badge>
              <p className="text-sm font-bold text-gray-600">
                {ticket.ticket_code}
              </p>
            </div>

            <div className="flex justify-center rounded-3xl bg-slate-50 p-6">
              <QRCodeCanvas value={ticketUrl} size={220} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-gray-500">
                Ticket Holder
              </p>
              <h2 className="mt-1 text-2xl font-black text-gray-950">
                {ticket.holder_name}
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-600">
                {ticket.matric_number || "No matric number"}
              </p>
            </div>

            <div className="grid gap-4 rounded-3xl bg-slate-50 p-5">
              <Info label="Event" value={ticket.event_title} />
              <Info label="Meal Session" value={ticket.meal_session_title} />
              <Info label="Location" value={ticket.location} />
              <Info
                label="Time"
                value={`${ticket.start_time} - ${ticket.end_time}`}
              />
            </div>

            <Button onClick={() => window.print()}>
              <span className="flex items-center justify-center gap-2">
                <Printer size={16} />
                Print Ticket
              </span>
            </Button>

            <p className="text-center text-sm text-gray-500">
              Present this ticket at the meal point for verification.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="font-bold text-gray-950">{value}</p>
    </div>
  );
}