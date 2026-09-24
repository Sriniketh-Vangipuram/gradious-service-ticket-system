import { TicketPriority } from "../../../generated/prisma/client";

import { prisma } from "../../../config/database";

import type {
  UpsertSlaPolicyInput,
  UpdateSlaPolicyStatusInput,
} from "./sla-policy.schemas";

/**
 * List all SLA policies.
 *
 * Returns all priorities, including inactive policies.
 * This is useful for administration because an admin needs
 * to see the complete configuration state.
 */
export async function listSlaPolicies() {
  return prisma.slaPolicy.findMany({
    orderBy: {
      priority: "asc",
    },
    select: {
      id: true,
      priority: true,
      firstResponseMinutes: true,
      resolutionMinutes: true,
      isActive: true,
      atRiskThresholdPercent: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Get one SLA policy by priority.
 */
export async function getSlaPolicy(
  priority: TicketPriority,
) {
  return prisma.slaPolicy.findUnique({
    where: {
      priority,
    },
    select: {
      id: true,
      priority: true,
      firstResponseMinutes: true,
      resolutionMinutes: true,
      isActive: true,
      atRiskThresholdPercent: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Create or completely replace the configuration for a priority.
 *
 * Because priority is unique, PUT semantics are represented by
 * Prisma upsert:
 *
 * - existing policy -> update it
 * - missing policy   -> create it
 *
 * Existing isActive state is preserved when updating.
 */
export async function upsertSlaPolicy(
  priority: TicketPriority,
  input: UpsertSlaPolicyInput,
) {
  return prisma.slaPolicy.upsert({
    where: {
      priority,
    },

    update: {
      firstResponseMinutes:
        input.firstResponseMinutes,

      resolutionMinutes:
        input.resolutionMinutes,

      atRiskThresholdPercent:
        input.atRiskThresholdPercent,
    },

    create: {
      priority,

      firstResponseMinutes:
        input.firstResponseMinutes,

      resolutionMinutes:
        input.resolutionMinutes,

      atRiskThresholdPercent:
        input.atRiskThresholdPercent,

      isActive: true,
    },

    select: {
      id: true,
      priority: true,
      firstResponseMinutes: true,
      resolutionMinutes: true,
      isActive: true,
      atRiskThresholdPercent: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Activate or deactivate an SLA policy.
 *
 * Deactivation is allowed at the configuration level.
 * Ticket creation will later be responsible for ensuring
 * that an active policy exists before creating a ticket.
 */
export async function updateSlaPolicyStatus(
  priority: TicketPriority,
  input: UpdateSlaPolicyStatusInput,
) {
  return prisma.slaPolicy.update({
    where: {
      priority,
    },

    data: {
      isActive: input.isActive,
    },

    select: {
      id: true,
      priority: true,
      firstResponseMinutes: true,
      resolutionMinutes: true,
      isActive: true,
      atRiskThresholdPercent: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}