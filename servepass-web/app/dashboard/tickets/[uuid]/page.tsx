"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Download,
  QrCode,
  Calendar,
  MapPin,
  Clock,
  User,
  BadgeCheck,
} from "lucide-react";

import Link from "next/link";

import { api } from "@/lib/api";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function TicketDetailsPage() {
  const { uuid } = useParams();

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTicket();
  }, []);

  async function loadTicket() {
    try {
      const res = await api.get(`/api/public/ticket/${uuid}`);
      setTicket(res.data.data);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-gray-500">
          Loading ticket...
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center">
          <h2 className="text-3xl font-black">
            Ticket not found
          </h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}

        <div className="flex items-center justify-between">

          <Link
            href="/dashboard/tickets"
            className="flex items-center gap-2 text-gray-600 hover:text-black"
          >
            <ArrowLeft size={18} />
            Back
          </Link>

          <div className="flex gap-3">

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl border px-5 py-3 font-semibold"
            >
              <Printer size={18} />
              Print
            </button>

            <a
              href={`/ticket/${ticket.ticket_uuid}`}
              target="_blank"
              className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white"
            >
              <Download size={18} />
              Public Ticket
            </a>

          </div>

        </div>

        <div className="grid gap-8 lg:grid-cols-2">

          {/* Left */}

          <Card className="space-y-6">

            <div className="flex justify-between">

              <div>

                <h2 className="text-3xl font-black">
                  {ticket.ticket_code}
                </h2>

                <p className="text-gray-500">
                  Ticket Code
                </p>

              </div>

              <Badge>{ticket.status}</Badge>

            </div>

            <div className="rounded-3xl bg-slate-50 p-10 flex justify-center">

              <img
                src={ticket.qr_image}
                alt="QR Code"
                className="w-72"
              />

            </div>

          </Card>

          {/* Right */}

          <Card className="space-y-6">

            <div className="flex items-center gap-3">

              <User />

              <div>

                <p className="text-sm text-gray-500">
                  Ticket Holder
                </p>

                <h3 className="text-2xl font-bold">
                  {ticket.holder_name}
                </h3>

              </div>

            </div>

            <div className="flex items-center gap-3">

              <BadgeCheck />

              <div>

                <p className="text-sm text-gray-500">
                  Matric Number
                </p>

                <p className="font-semibold">
                  {ticket.matric_number || "-"}
                </p>

              </div>

            </div>

            <div className="flex items-center gap-3">

              <Calendar />

              <div>

                <p className="text-sm text-gray-500">
                  Event
                </p>

                <p className="font-semibold">
                  {ticket.event_title}
                </p>

              </div>

            </div>

            <div className="flex items-center gap-3">

              <QrCode />

              <div>

                <p className="text-sm text-gray-500">
                  Meal Session
                </p>

                <p className="font-semibold">
                  {ticket.meal_session_title}
                </p>

              </div>

            </div>

            <div className="flex items-center gap-3">

              <MapPin />

              <div>

                <p className="text-sm text-gray-500">
                  Location
                </p>

                <p className="font-semibold">
                  {ticket.location}
                </p>

              </div>

            </div>

            <div className="flex items-center gap-3">

              <Clock />

              <div>

                <p className="text-sm text-gray-500">
                  Serving Time
                </p>

                <p className="font-semibold">
                  {ticket.start_time}
                </p>

                <p className="font-semibold">
                  {ticket.end_time}
                </p>

              </div>

            </div>

          </Card>

        </div>

      </div>

    </DashboardLayout>
  );
}