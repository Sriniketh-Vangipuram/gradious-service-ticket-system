export type UserRole =
| "EMPLOYEE"
| "TECHNICIAN"
| "CENTER_MANAGER"
| "ADMIN";

export interface AuthUser {
    id:number;
    fullName:string;
    email:string;
    role:UserRole;
    centerId:number | null;
}

export interface CurrentUser extends AuthUser{
    isActive: boolean;
}
