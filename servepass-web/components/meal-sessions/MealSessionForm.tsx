"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import { createMealSession } from "@/services/meal-sessions";
import { getEvents } from "@/services/events";

export default function MealSessionForm({ onSuccess }: { onSuccess: () => void }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    event_id: "",
    title: "",
    description: "",
    capacity: "",
    meal_type: "LUNCH",
    serving_location: "",
    start_time: "",
    end_time: "",
    allow_late_verification: 0,
  });

  useEffect(() => {
    async function loadEvents() {
      const data = await getEvents();
      setEvents(data);
    }

    loadEvents();
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit() {
    if (!form.event_id) {
      toast.error("Select an event");
      return;
    }

    try {
      setLoading(true);

      await createMealSession({
        ...form,
        event_id: Number(form.event_id),
        capacity: Number(form.capacity),
      });

      toast.success("Meal session created");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to create session");
    } finally {
      setLoading(false);
    }
  }

  return (
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

      <Input label="Session Title" placeholder="Lunch" value={form.title} onChange={(e) => update("title", e.target.value)} />

      <Textarea label="Description" placeholder="Main lunch session" value={form.description} onChange={(e) => update("description", e.target.value)} />

      <Input label="Capacity" placeholder="500" value={form.capacity} onChange={(e) => update("capacity", e.target.value)} />

      <Select label="Meal Type" value={form.meal_type} onChange={(e) => update("meal_type", e.target.value)}>
        <option value="BREAKFAST">Breakfast</option>
        <option value="LUNCH">Lunch</option>
        <option value="DINNER">Dinner</option>
        <option value="SNACK">Snack</option>
        <option value="OTHER">Other</option>
      </Select>

      <Input label="Serving Location" placeholder="Main Auditorium" value={form.serving_location} onChange={(e) => update("serving_location", e.target.value)} />

      <Input label="Start Time" type="datetime-local" value={form.start_time} onChange={(e) => update("start_time", e.target.value)} />

      <Input label="End Time" type="datetime-local" value={form.end_time} onChange={(e) => update("end_time", e.target.value)} />

      <Button loading={loading} onClick={submit}>
        Create Meal Session
      </Button>
    </div>
  );
}