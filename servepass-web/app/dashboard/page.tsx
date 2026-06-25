"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Soup,
  Ticket,
  ScanLine,
  CheckCircle2,
  Clock,
  Ban,
  Activity,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import { getDashboardStats } from "@/services/dashboard";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();

    const interval = setInterval(loadStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      label: "Total Events",
      value: stats?.events ?? 0,
      icon: CalendarDays,
    },
    {
      label: "Meal Sessions",
      value: stats?.meal_sessions ?? 0,
      icon: Soup,
    },
    {
      label: "Tickets Generated",
      value: stats?.tickets_generated ?? 0,
      icon: Ticket,
    },
    {
      label: "Verified Tickets",
      value: stats?.verified_tickets ?? 0,
      icon: ScanLine,
    },
    {
      label: "Valid Tickets",
      value: stats?.valid_tickets ?? 0,
      icon: CheckCircle2,
    },
    {
      label: "Today Scans",
      value: stats?.today_scans ?? 0,
      icon: Activity,
    },
    {
      label: "Revoked Tickets",
      value: stats?.revoked_tickets ?? 0,
      icon: Ban,
    },
    {
      label: "Expired Tickets",
      value: stats?.expired_tickets ?? 0,
      icon: Clock,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Live overview of your events, meal sessions, tickets, and scans.
          </p>
        </section>

        {loading && !stats ? (
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        ) : (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <Card key={card.label}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">{card.label}</p>
                      <h2 className="mt-2 text-3xl font-black text-gray-950">
                        {Number(card.value).toLocaleString()}
                      </h2>
                    </div>

                    <div className="rounded-2xl bg-green-50 p-3 text-green-700">
                      <Icon size={24} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}