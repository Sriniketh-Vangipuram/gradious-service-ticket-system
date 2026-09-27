import { ConfirmationDialog } from "../../../../components/ui/ConfirmationDialog";

import { useCategoryMutations } from "../hooks/useCategoryMutations";
import type { Category } from "../types/category.types";

interface CategoryStatusConfirmationDialogProps {
  open: boolean;
  category: Category | null;
  onClose: () => void;
}

export function CategoryStatusConfirmationDialog({
  open,
  category,
  onClose,
}: CategoryStatusConfirmationDialogProps) {
  const { updateCategoryStatusMutation } =
    useCategoryMutations();

  if (!category) {
    return null;
  }

  const isDeactivating = category.isActive;

  const handleConfirm = async () => {
    try {
      await updateCategoryStatusMutation.mutateAsync({
        categoryId: category.id,
        payload: {
          isActive: !category.isActive,
        },
      });

      onClose();
    } catch {
      // Keep the dialog open so the mutation error remains visible.
    }
  };

  return (
    <ConfirmationDialog
      open={open}
      onCancel={onClose}
      onConfirm={handleConfirm}
      title={
        isDeactivating
          ? "Deactivate Category"
          : "Reactivate Category"
      }
      description={
        isDeactivating
          ? `Are you sure you want to deactivate "${category.name}"? It will no longer be available for new ticket requests.`
          : `Are you sure you want to reactivate "${category.name}"? It will become available for new ticket requests again.`
      }
      confirmLabel={
        isDeactivating
          ? "Deactivate"
          : "Reactivate"
      }
      isLoading={updateCategoryStatusMutation.isPending}
      loadingLabel={
        isDeactivating
          ? "Deactivating..."
          : "Reactivating..."
      }
      variant={
        isDeactivating
          ? "danger"
          : "primary"
      }
    />
  );
}