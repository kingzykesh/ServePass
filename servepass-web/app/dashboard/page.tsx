import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import { CalendarDays, Soup, Ticket, ScanLine } from "lucide-react";

const stats = [
  { label: "Total Events", value: "1", icon: CalendarDays },
  { label: "Meal Sessions", value: "1", icon: Soup },
  { label: "Tickets Generated", value: "3", icon: Ticket },
  { label: "Verified Tickets", value: "1", icon: ScanLine },
];

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor your events, meal sessions, tickets, and verification flow.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.label}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <h2 className="mt-2 text-3xl font-bold text-gray-950">
                      {stat.value}
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
      </div>
    </DashboardLayout>
  );
}