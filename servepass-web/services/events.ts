import { api } from "@/lib/api";

export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
}

export async function getEvents() {
  const res = await api.get("/api/events");
  return res.data.data;
}

export async function createEvent(data: any) {
  const res = await api.post("/api/events", data);
  return res.data;
}

export async function updateEvent(id: number, data: any) {
  const res = await api.put(`/api/events/${id}`, data);
  return res.data;
}

export async function deleteEvent(id: number) {
  const res = await api.delete(`/api/events/${id}`);
  return res.data;
}