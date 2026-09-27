import {
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { ConfirmationDialog } from "../../../../components/ui/ConfirmationDialog";
import { useSoftwareMutations } from "../hooks/useSoftwareMutations";
import type { Software } from "../types/software.types";

interface SoftwareStatusConfirmationDialogProps {
  open: boolean;
  software: Software | null;
  onClose: () => void;
}

export function SoftwareStatusConfirmationDialog({
  open,
  software,
  onClose,
}: SoftwareStatusConfirmationDialogProps) {
  const {
    updateSoftwareStatusMutation,
  } = useSoftwareMutations();

  if (!software) {
    return null;
  }

  const isDeactivating =
    software.isActive;

  const nextStatus = !software.isActive;

  const handleConfirm = async () => {
    try {
      await updateSoftwareStatusMutation.mutateAsync({
        softwareId: software.id,
        payload: {
          isActive: nextStatus,
        },
      });

      onClose();
    } catch {
      // Mutation error is exposed through the mutation state.
    }
  };

  return (
    <ConfirmationDialog
      open={open}
      title={
        isDeactivating
          ? "Deactivate Software?"
          : "Reactivate Software?"
      }
      description={
        <div className="space-y-3">
          <p>
            Are you sure you want to{" "}
            <span className="font-semibold text-white">
              {isDeactivating
                ? "deactivate"
                : "reactivate"}
            </span>{" "}
            <span className="font-semibold text-white">
              {software.name}
            </span>
            ?
          </p>

          {isDeactivating ? (
            <p className="text-xs leading-5 text-slate-400">
              Inactive software will no longer be available
              as an active software option for new service
              requests.
            </p>
          ) : (
            <p className="text-xs leading-5 text-slate-400">
              Reactivating this software will make it
              available again in the active software catalog.
            </p>
          )}
        </div>
      }
      confirmLabel={
        isDeactivating
          ? "Deactivate"
          : "Reactivate"
      }
      cancelLabel="Cancel"
      loadingLabel={
        isDeactivating
          ? "Deactivating..."
          : "Reactivating..."
      }
      isLoading={
        updateSoftwareStatusMutation.isPending
      }
      variant={
        isDeactivating
          ? "danger"
          : "primary"
      }
      icon={
        isDeactivating ? (
          <AlertTriangle className="h-5 w-5" />
        ) : (
          <CheckCircle2 className="h-5 w-5" />
        )
      }
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  );
}