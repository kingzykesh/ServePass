"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  Printer,
  Search,
  Tickets,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import ArmbandTicket, {
  type ArmbandTicketData,
} from "@/components/tickets/ArmbandTicket";

import { getTickets } from "@/services/tickets";
import { getEvents } from "@/services/events";
import { getMealSessions } from "@/services/meal-sessions";

type EventItem = {
  id: number | string;
  title: string;
};

type MealSessionItem = {
  id: number | string;
  event_id: number | string;
  title: string;
  meal_type?: string;
};

type TicketItem = ArmbandTicketData & {
  event_id?: number | string;
  meal_session_id?: number | string;
};

export default function ArmbandsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [sessions, setSessions] = useState<MealSessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [eventId, setEventId] = useState("");
  const [mealSessionId, setMealSessionId] = useState("");
  const [search, setSearch] = useState("");

  async function loadData() {
    try {
      setLoading(true);

      const [ticketData, eventData, sessionData] =
        await Promise.all([
          getTickets(),
          getEvents(),
          getMealSessions(),
        ]);

      setTickets(Array.isArray(ticketData) ? ticketData : []);
      setEvents(Array.isArray(eventData) ? eventData : []);
      setSessions(Array.isArray(sessionData) ? sessionData : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load armband data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredSessions = useMemo(() => {
    if (!eventId) return sessions;

    return sessions.filter(
      (session) =>
        String(session.event_id) === String(eventId)
    );
  }, [sessions, eventId]);

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesEvent =
        !eventId ||
        String(ticket.event_id) === String(eventId);

      const matchesSession =
        !mealSessionId ||
        String(ticket.meal_session_id) ===
          String(mealSessionId);

      const matchesSearch =
        !term ||
        ticket.holder_name
          ?.toLowerCase()
          .includes(term) ||
        ticket.ticket_code
          ?.toLowerCase()
          .includes(term) ||
        ticket.matric_number
          ?.toLowerCase()
          .includes(term);

      return (
        matchesEvent &&
        matchesSession &&
        matchesSearch
      );
    });
  }, [
    tickets,
    eventId,
    mealSessionId,
    search,
  ]);

  function handleEventChange(value: string) {
    setEventId(value);
    setMealSessionId("");
  }

  return (
    <DashboardLayout>
      <Toaster position="top-center" />

      <style jsx global>{`
        .armband-print-item {
          box-sizing: border-box;
          flex-shrink: 0;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          #armband-print-area,
          #armband-print-area * {
            visibility: visible !important;
          }

          #armband-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 10in !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .armband-print-item {
            width: 10in !important;
            height: 1in !important;
            margin: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            overflow: hidden !important;
          }

          .armband-print-item:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          .no-print {
            display: none !important;
          }

          @page {
            size: 10in 1in;
            margin: 0;
          }
        }
      `}</style>

      <div className="space-y-8">
        <section className="no-print flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <Link
              href="/dashboard/tickets"
              className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-gray-600 transition hover:text-gray-950"
            >
              <ArrowLeft size={17} />
              Back to tickets
            </Link>

            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-green-100 p-3 text-green-700">
                <Tickets size={25} />
              </div>

              <div>
                <h1 className="text-3xl font-black text-gray-950">
                  Armband Generator
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Generate and print one personalized
                  10 × 1 inch armband for every ticket
                  holder.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => window.print()}
            disabled={filteredTickets.length === 0}
            className="w-full px-6 xl:w-auto"
          >
            <span className="flex items-center justify-center gap-2">
              <Printer size={18} />
              Print {filteredTickets.length} Armbands
            </span>
          </Button>
        </section>

        <Card className="no-print p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <Select
              label="Event"
              value={eventId}
              onChange={(event) =>
                handleEventChange(event.target.value)
              }
            >
              <option value="">All events</option>

              {events.map((event) => (
                <option
                  key={event.id}
                  value={event.id}
                >
                  {event.title}
                </option>
              ))}
            </Select>

            <Select
              label="Meal Session"
              value={mealSessionId}
              onChange={(event) =>
                setMealSessionId(event.target.value)
              }
            >
              <option value="">
                All meal sessions
              </option>

              {filteredSessions.map((session) => (
                <option
                  key={session.id}
                  value={session.id}
                >
                  {session.title}
                  {session.meal_type
                    ? ` — ${session.meal_type}`
                    : ""}
                </option>
              ))}
            </Select>

            <div className="relative">
              <Input
                label="Search Tickets"
                placeholder="Name, matric or ticket code"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              <Search
                size={17}
                className="pointer-events-none absolute bottom-4 right-4 text-gray-400"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-green-50 px-4 py-2 font-bold text-green-700">
              {filteredTickets.length} armbands
            </span>

            <span className="text-gray-500">
              Each print item is exactly 10 inches wide
              and 1 inch high.
            </span>
          </div>
        </Card>

        {loading ? (
          <Card className="no-print p-8 text-center">
            <p className="text-sm text-gray-500">
              Loading armbands...
            </p>
          </Card>
        ) : filteredTickets.length === 0 ? (
          <div className="no-print">
            <EmptyState
              title="No tickets found"
              description="Generate tickets or change your event and meal-session filters."
            />
          </div>
        ) : (
          <div
            id="armband-print-area"
            className="space-y-5 overflow-x-auto pb-8"
          >
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="mx-auto w-fit rounded-xl shadow-sm print:shadow-none"
              >
                <ArmbandTicket ticket={ticket} />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}