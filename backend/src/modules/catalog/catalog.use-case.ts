import { prisma } from "../../config/database";

export async function getCategories() {
  return prisma.category.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getSoftware() {
  return prisma.software.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      vendor: true,
      version: true,
      licenseRequired: true,
    },
    orderBy: [
      {
        name: "asc",
      },
      {
        id: "asc",
      },
    ],
  });
}