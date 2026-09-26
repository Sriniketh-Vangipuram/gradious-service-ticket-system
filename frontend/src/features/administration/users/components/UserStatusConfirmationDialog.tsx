import { Power } from "lucide-react";

import type { AdministrationUser } from "../types/user.types";

import { ConfirmationDialog } from "../../../../components/ui/ConfirmationDialog";

interface UserStatusConfirmationDialogProps {
  user: AdministrationUser | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function UserStatusConfirmationDialog({
  user,
  onClose,
  onConfirm,
  isLoading,
}: UserStatusConfirmationDialogProps) {
  if (!user) {
    return null;
  }

  const isActivating = !user.isActive;

  return (
    <ConfirmationDialog
      open={Boolean(user)}
      title={
        isActivating
          ? "Reactivate user"
          : "Deactivate user"
      }
      description={
        <div className="space-y-2">
          <p>
            Are you sure you want to{" "}
            {isActivating
              ? "reactivate"
              : "deactivate"}{" "}
            <span className="font-semibold text-white">
              {user.fullName}
            </span>
            ?
          </p>

          <p>
            {isActivating
              ? "The user will be able to access the system again."
              : "The user will no longer be able to use the system, but their historical records will be preserved."}
          </p>
        </div>
      }
      confirmLabel={
        isActivating
          ? "Reactivate user"
          : "Deactivate user"
      }
      cancelLabel="Cancel"
      isLoading={isLoading}
      loadingLabel={
        isActivating
          ? "Reactivating..."
          : "Deactivating..."
      }
      variant={
        isActivating
          ? "primary"
          : "danger"
      }
      icon={
        <Power className="h-5 w-5" />
      }
      onConfirm={onConfirm}
      onCancel={onClose}
    />
  );
}