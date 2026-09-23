import { useTickets } from "../../tickets/hooks/useTickets";
import type { ListTicketsParams } from "../../tickets/types/ticket-api.types";

type TechnicianTicketParams = Omit<ListTicketsParams, "centerId" | "labId">;

export function useTechnicianTickets(
  params?: Omit<TechnicianTicketParams, "cursor">,
) {
  return useTickets(params);
}