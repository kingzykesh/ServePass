import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { CalendarDays, MapPin, Pencil, Trash2 } from "lucide-react";

export default function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: any;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Card className="border border-gray-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-gray-950">
              {event.title}
            </h3>

            <div className="mt-3">
              <Badge>Upcoming</Badge>
            </div>
          </div>
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-gray-600">
          {event.description || "No description provided."}
        </p>

        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-green-600" />
            <span>
              {event.start_date} - {event.end_date}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-green-600" />
            <span>{event.location || "No location set"}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-4">
          <div>
            <p className="text-xs text-gray-500">Sessions</p>
            <p className="mt-1 text-lg font-black text-gray-950">0</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Tickets</p>
            <p className="mt-1 text-lg font-black text-gray-950">0</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Used</p>
            <p className="mt-1 text-lg font-black text-gray-950">0</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 py-3 text-sm font-bold text-green-700 transition hover:bg-green-100"
          >
            <Pencil size={16} />
            Edit
          </button>

          <button
            onClick={onDelete}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white transition hover:bg-red-600"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </Card>
  );
}