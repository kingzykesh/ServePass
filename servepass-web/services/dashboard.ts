import { api } from "@/lib/api";

export async function getDashboardStats() {
  const res = await api.get("/api/dashboard");
  return res.data.data;
}