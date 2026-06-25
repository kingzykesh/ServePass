import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { CalendarDays, MapPin, Pencil, Trash2 } from "lucide-react";

function getStatus(event: any) {
  const today = new Date();
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);

  if (today < start) return "Upcoming";
  if (today >= start && today <= end) return "Ongoing";
  return "Completed";
}

export default function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: any;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const attendance = Number(event.attendance_rate ?? 0);

  return (
    <Card className="border border-gray-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md">
      <div className="space-y-5">
        <div>
          <h3 className="text-xl font-black text-gray-950">{event.title}</h3>
          <div className="mt-3">
            <Badge>{getStatus(event)}</Badge>
          </div>
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-gray-600">
          {event.description || "No description provided."}
        </p>

        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-green-600" />
            <span>{event.start_date} - {event.end_date}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-green-600" />
            <span>{event.location || "No location set"}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-4">
          <Stat label="Sessions" value={event.sessions_count ?? 0} />
          <Stat label="Tickets" value={event.tickets_count ?? 0} />
          <Stat label="Used" value={event.used_count ?? 0} />
        </div>

        <div>
          <div className="mb-2 flex justify-between text-xs font-bold text-gray-500">
            <span>Attendance</span>
            <span>{attendance}%</span>
          </div>
          <div className="h-3 rounded-full bg-gray-100">
            <div
              className="h-3 rounded-full bg-green-600"
              style={{ width: `${attendance}%` }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 py-3 text-sm font-bold text-green-700"
          >
            <Pencil size={16} />
            Edit
          </button>

          <button
            onClick={onDelete}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-black text-gray-950">{value}</p>
    </div>
  );
}