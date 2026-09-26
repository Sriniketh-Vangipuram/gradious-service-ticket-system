export type UserRole =
| "EMPLOYEE"
| "TECHNICIAN"
| "CENTER_MANAGER"
| "ADMIN";
export interface AuthorizedCenter {
  id: number;
  name: string;
  code: string;
}

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  centerId: number | null;
  labId: number | null;
}

export interface CurrentUser extends AuthUser {
  isActive: boolean;
  authorizedCenters: AuthorizedCenter[];
}