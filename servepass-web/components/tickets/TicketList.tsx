"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { getTickets } from "@/services/tickets";
import { Copy, ExternalLink } from "lucide-react";

export default function TicketList() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      setTickets(await getTickets());
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    toast.success("Ticket link copied");
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading tickets...</p>;

  if (tickets.length === 0) {
    return <EmptyState title="No tickets yet" description="Generate tickets to see them here." />;
  }

  return (
    <div className="grid gap-4">
      {tickets.map((ticket) => (
        <Card key={ticket.id} className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-black text-gray-950">
                  {ticket.holder_name}
                </h3>
                <Badge>{ticket.status}</Badge>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {ticket.matric_number || "No matric number"} • {ticket.ticket_code}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {ticket.event_title} • {ticket.meal_session_title}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => copyLink(ticket.qr_payload)}
                className="flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700"
              >
                <Copy size={16} />
                Copy
              </button>

              <a
               href={`/ticket/${ticket.ticket_uuid}`}
                target="_blank"
                className="flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-bold text-white"
              >
                <ExternalLink size={16} />
                View
              </a>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}