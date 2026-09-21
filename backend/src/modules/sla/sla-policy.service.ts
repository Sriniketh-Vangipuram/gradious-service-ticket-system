
import { TicketPriority } from "../../generated/prisma/client";
import { prisma } from "../../config/database";
import type { Prisma } from "../../generated/prisma/client";

type DatabaseClient = Prisma.TransactionClient | typeof prisma;


export async function getActiveSlaPolicy(
  priority: TicketPriority,
  db: DatabaseClient = prisma
) {  
    
 const policy = await db.slaPolicy.findFirst({
    where: {
      priority,
      isActive: true
    },
    select: {
      id: true,
      priority: true,
      firstResponseMinutes: true,
      resolutionMinutes: true,
      atRiskThresholdPercent: true
    }
  });

  if (!policy) {
    throw new Error(
      `No active SLA policy configured for priority: ${priority}`
    );
  }

  return policy;
}