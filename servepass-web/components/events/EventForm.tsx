"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { createEvent } from "@/services/events";

export default function EventForm({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    start_date: "",
    end_date: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit() {
    try {
      setLoading(true);

      await createEvent(form);

      toast.success("Event created successfully");
      onSuccess();

      setForm({
        title: "",
        description: "",
        location: "",
        start_date: "",
        end_date: "",
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to create event");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Input
        label="Event Name"
        placeholder="NACOS Tech Week 2026"
        value={form.title}
        onChange={(e) => updateField("title", e.target.value)}
      />

      <Textarea
        label="Description"
        placeholder="Short description of this event"
        value={form.description}
        onChange={(e) => updateField("description", e.target.value)}
      />

      <Input
        label="Location"
        placeholder="Anchor University Lagos"
        value={form.location}
        onChange={(e) => updateField("location", e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Start Date"
          type="date"
          value={form.start_date}
          onChange={(e) => updateField("start_date", e.target.value)}
        />

        <Input
          label="End Date"
          type="date"
          value={form.end_date}
          onChange={(e) => updateField("end_date", e.target.value)}
        />
      </div>

      <Button loading={loading} onClick={submit}>
        Create Event
      </Button>
    </div>
  );
}