import type { UserRole } from "../../../../features/auth/types/auth.types";

export type TechnicianSpecialization =
  | "SOFTWARE"
  | "HARDWARE"
  | "NETWORK";

export interface UserCenterSummary {
  id: number;
  name: string;
  code: string;
}

export interface UserLabSummary {
  id: number;
  name: string;
  code: string;
}

export interface UserSpecializationSummary {
  specialization: TechnicianSpecialization;
}

export interface AdministrationUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  center: UserCenterSummary | null;
  lab: UserLabSummary | null;
  specializations: UserSpecializationSummary[];
  _count: {
    assignedTickets: number;
  };
}

export interface UsersPagination {
  hasNextPage: boolean;
  nextCursor: number | null;
}

export interface UsersResponse {
  data: AdministrationUser[];
  pagination: UsersPagination;
}