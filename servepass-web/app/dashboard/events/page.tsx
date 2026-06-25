"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import EventCard from "@/components/events/EventCard";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";
import EventForm from "@/components/events/EventForm";
import { getEvents } from "@/services/events";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  return (
    <DashboardLayout>
      <Toaster position="top-center" />

      <div className="space-y-6">
        <PageHeader
          title="Events"
          description="Manage all organization events."
          action={
            <Button
              onClick={() => setDrawerOpen(true)}
              className="w-full sm:w-auto px-6"
            >
              New Event
            </Button>
          }
        />

        {loading ? (
          <p className="text-sm text-gray-500">Loading events...</p>
        ) : events.length === 0 ? (
          <EmptyState title="No events" description="Create your first event." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      <Drawer
        open={drawerOpen}
        title="Create New Event"
        onClose={() => setDrawerOpen(false)}
      >
        <EventForm
          onSuccess={() => {
            setDrawerOpen(false);
            load();
          }}
        />
      </Drawer>
    </DashboardLayout>
  );
}