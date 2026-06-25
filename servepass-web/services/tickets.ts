import { api } from "@/lib/api";

/*
|--------------------------------------------------------------------------
| Generate Tickets
|--------------------------------------------------------------------------
*/

export async function generateTickets(data: any) {
  const res = await api.post("/api/tickets/generate", data);
  return res.data.data;
}

/*
|--------------------------------------------------------------------------
| Get All Tickets
|--------------------------------------------------------------------------
*/

export async function getTickets() {
  const res = await api.get("/api/tickets");
  return res.data.data;
}

/*
|--------------------------------------------------------------------------
| Get Single Ticket
|--------------------------------------------------------------------------
*/

export async function getTicket(id: number | string) {
  const res = await api.get(`/api/tickets/${id}`);
  return res.data.data;
}

/*
|--------------------------------------------------------------------------
| Verify Ticket
|--------------------------------------------------------------------------
*/

export async function verifyTicket(ticketCode: string) {
  const res = await api.post("/api/tickets/verify", {
    ticket_code: ticketCode,
  });

  return res.data.data;
}

/*
|--------------------------------------------------------------------------
| Void Ticket (Coming Soon)
|--------------------------------------------------------------------------
*/

export async function voidTicket(id: number | string) {
  const res = await api.put(`/api/tickets/${id}/void`);
  return res.data.data;
}