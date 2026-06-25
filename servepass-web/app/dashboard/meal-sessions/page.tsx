"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import MealSessionForm from "@/components/meal-sessions/MealSessionForm";
import { getMealSessions } from "@/services/meal-sessions";

export default function MealSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const data = await getMealSessions();
      setSessions(data);
    } catch {
      toast.error("Failed to load meal sessions");
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
          title="Meal Sessions"
          description="Manage breakfast, lunch, dinner, and other serving sessions."
          action={
            <Button onClick={() => setDrawerOpen(true)} className="w-full px-6 sm:w-auto">
              New Session
            </Button>
          }
        />

        {loading ? (
          <p className="text-sm text-gray-500">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <EmptyState title="No meal sessions" description="Create your first meal session." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {sessions.map((session) => (
              <Card key={session.id} className="p-6">
                <h3 className="text-xl font-black text-gray-950">{session.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{session.description}</p>
                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-gray-500">Capacity</p>
                  <p className="text-2xl font-black text-green-700">{session.capacity ?? 0}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Drawer open={drawerOpen} title="Create Meal Session" onClose={() => setDrawerOpen(false)}>
        <MealSessionForm
          onSuccess={() => {
            setDrawerOpen(false);
            load();
          }}
        />
      </Drawer>
    </DashboardLayout>
  );
}