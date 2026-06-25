"use client";

import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import EventCard from "@/components/events/EventCard";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";
import Input from "@/components/ui/Input";
import EventForm from "@/components/events/EventForm";
import { deleteEvent, getEvents } from "@/services/events";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [search, setSearch] = useState("");

  async function load() {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data);
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const term = search.toLowerCase();

      return (
        event.title?.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.location?.toLowerCase().includes(term)
      );
    });
  }, [events, search]);

  function openCreate() {
    setSelectedEvent(null);
    setDrawerOpen(true);
  }

  function openEdit(event: any) {
    setSelectedEvent(event);
    setDrawerOpen(true);
  }

  async function handleDelete(event: any) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.title}"?`
    );

    if (!confirmed) return;

    try {
      await deleteEvent(event.id);
      toast.success("Event deleted successfully");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to delete event");
    }
  }

  return (
    <DashboardLayout>
      <Toaster position="top-center" />

      <div className="space-y-6">
        <PageHeader
          title="Events"
          description="Manage all organization events."
          action={
            <Button onClick={openCreate} className="w-full px-6 sm:w-auto">
              New Event
            </Button>
          }
        />

        <div className="max-w-md">
          <Input
            label="Search Events"
            placeholder="Search by title, description or location"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading events...</p>
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            title="No events found"
            description="Create a new event or adjust your search."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={() => openEdit(event)}
                onDelete={() => handleDelete(event)}
              />
            ))}
          </div>
        )}
      </div>

      <Drawer
        open={drawerOpen}
        title={selectedEvent ? "Edit Event" : "Create New Event"}
        onClose={() => setDrawerOpen(false)}
      >
        <EventForm
          event={selectedEvent}
          onSuccess={() => {
            setDrawerOpen(false);
            setSelectedEvent(null);
            load();
          }}
        />
      </Drawer>
    </DashboardLayout>
  );
}