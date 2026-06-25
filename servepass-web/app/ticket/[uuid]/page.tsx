"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function PublicTicketPage() {
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
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <p className="text-sm text-gray-500">Loading ticket...</p>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <Card className="max-w-md p-8 text-center">
          <h1 className="text-2xl font-black text-gray-950">Ticket not found</h1>
          <p className="mt-2 text-sm text-gray-500">
            This ticket link is invalid.
          </p>
        </Card>
      </main>
    );
  }

  const publicUrl =
    typeof window !== "undefined" ? window.location.href : "";

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8">
      <div className="mx-auto max-w-md">
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
              <p className="text-sm font-bold text-gray-500">
                {ticket.ticket_code}
              </p>
            </div>

            <div className="flex justify-center rounded-3xl bg-slate-50 p-6">
              <QRCodeCanvas value={publicUrl} size={220} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-gray-400">
                Ticket Holder
              </p>
              <h2 className="mt-1 text-2xl font-black text-gray-950">
                {ticket.holder_name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {ticket.matric_number || "No matric number"}
              </p>
            </div>

            <div className="grid gap-4 rounded-3xl bg-slate-50 p-5">
              <div>
                <p className="text-xs text-gray-500">Event</p>
                <p className="font-bold text-gray-950">{ticket.event_title}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Meal Session</p>
                <p className="font-bold text-gray-950">
                  {ticket.meal_session_title}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-bold text-gray-950">{ticket.location}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="font-bold text-gray-950">
                  {ticket.start_time} - {ticket.end_time}
                </p>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500">
              Present this ticket at the meal point for verification.
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}