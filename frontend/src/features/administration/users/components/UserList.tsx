import type { AdministrationUser } from "../types/user.types";

import { UserCard } from "./UserCard";

interface UserListProps {
  users: AdministrationUser[];

  onManageSpecializations?: (
    user: AdministrationUser,
  ) => void;

  onEdit?: (
    user: AdministrationUser,
  ) => void;

  onToggleStatus?: (
    user: AdministrationUser,
  ) => void;
}

export function UserList({
  users,
  onManageSpecializations,
  onEdit,
  onToggleStatus,
}: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-12 text-center">
        <p className="text-sm font-medium text-slate-300">
          No users found
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onManageSpecializations={
            onManageSpecializations
          }
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
}