import { prisma } from "../../../config/database";
import { AppError } from "../../../common/errors/app-error";

type TicketLocationFilters = {
  centerId?: number;
  labId?: number;
};

export async function validateTicketListLocation(
  filters: TicketLocationFilters,
): Promise<void> {
  if (filters.centerId === undefined || filters.labId === undefined) {
    return;
  }

  const lab = await prisma.lab.findFirst({
    where: {
      id: filters.labId,
      centerId: filters.centerId,
    },
    select: {
      id: true,
    },
  });

  if (!lab) {
    throw new AppError(
      "VALIDATION_ERROR",
      "The selected lab does not belong to the selected center.",
      [
        {
          field: "query.labId",
          message: "Lab must belong to the specified center.",
        },
      ],
    );
  }
}