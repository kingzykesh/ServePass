import { api } from "@/lib/api";

export async function getMealSessions() {
  const res = await api.get("/api/meal-sessions");
  return res.data.data;
}

export async function createMealSession(data: any) {
  const res = await api.post("/api/meal-sessions", data);
  return res.data;
}