"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";
import { getEvents } from "@/services/events";
import { getMealSessions } from "@/services/meal-sessions";
import { api } from "@/lib/api";

export default function TicketGenerator() {
  const [events, setEvents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    event_id: "",
    meal_session_id: "",
    batch_name: "",
    names: "",
  });

  const filteredSessions = sessions.filter(
    (session) => String(session.event_id) === String(form.event_id)
  );

  const totalParticipants = useMemo(() => {
    return form.names
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean).length;
  }, [form.names]);

  useEffect(() => {
    async function loadData() {
      const eventData = await getEvents();
      const sessionData = await getMealSessions();

      setEvents(eventData);
      setSessions(sessionData);
    }

    loadData();
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "event_id" ? { meal_session_id: "" } : {}),
    }));
  }

  async function generateTickets() {
    if (!form.event_id) return toast.error("Select an event");
    if (!form.meal_session_id) return toast.error("Select a meal session");
    if (!form.names.trim()) return toast.error("Paste participant names");

    try {
      setLoading(true);

      const res = await api.post("/api/tickets/generate-bulk", {
        event_id: Number(form.event_id),
        meal_session_id: Number(form.meal_session_id),
        batch_name: form.batch_name || "Ticket Batch",
        names: form.names,
      });

      toast.success(`${res.data.data.total_generated} tickets generated`);

      setForm({
        event_id: form.event_id,
        meal_session_id: form.meal_session_id,
        batch_name: "",
        names: "",
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to generate tickets");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="p-6">
        <div className="space-y-5">
          <Select
            label="Event"
            value={form.event_id}
            onChange={(e) => update("event_id", e.target.value)}
          >
            <option value="">Select event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </Select>

          <Select
            label="Meal Session"
            value={form.meal_session_id}
            onChange={(e) => update("meal_session_id", e.target.value)}
            disabled={!form.event_id}
          >
            <option value="">
              {form.event_id ? "Select meal session" : "Select event first"}
            </option>
            {filteredSessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.title} — {session.meal_type}
              </option>
            ))}
          </Select>

          <Input
            label="Batch Name"
            placeholder="Lunch Batch 001"
            value={form.batch_name}
            onChange={(e) => update("batch_name", e.target.value)}
          />

          <Textarea
            label="Participants"
            placeholder={`Ezirim Kingdom, AUL/CMP/20/001
John Daniel, AUL/CMP/20/002
Mary Samuel, AUL/CMP/20/003`}
            value={form.names}
            onChange={(e) => update("names", e.target.value)}
          />

          <Button loading={loading} onClick={generateTickets}>
            Generate QR Tickets
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-black text-gray-950">Preview</h3>
        <p className="mt-2 text-sm text-gray-500">
          Confirm your batch before generating tickets.
        </p>

        <div className="mt-6 rounded-3xl bg-green-50 p-6">
          <p className="text-sm font-semibold text-green-700">
            Participants detected
          </p>
          <h2 className="mt-2 text-5xl font-black text-green-700">
            {totalParticipants}
          </h2>
        </div>

        <div className="mt-6 space-y-3 text-sm text-gray-600">
          <p>
            <strong>Event:</strong>{" "}
            {events.find((e) => String(e.id) === String(form.event_id))?.title ??
              "Not selected"}
          </p>

          <p>
            <strong>Meal Session:</strong>{" "}
            {sessions.find((s) => String(s.id) === String(form.meal_session_id))
              ?.title ?? "Not selected"}
          </p>

          <p>
            <strong>Batch:</strong> {form.batch_name || "Ticket Batch"}
          </p>
        </div>
      </Card>
    </div>
  );
}