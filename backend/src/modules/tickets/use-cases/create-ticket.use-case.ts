import { TicketHistoryEvent, UserRole } from "../../../generated/prisma/client";

import { prisma } from "../../../config/database";
import { AppError } from "../../../common/errors/app-error";

import type { CreateTicketInput } from "../ticket.schemas";
import { reserveTicketNumber } from "../ticket-number.service";
import { addBusinessMinutes } from "../../sla/business-calendar.service";
import { getActiveSlaPolicy } from "../../sla/sla-policy.service";
import {
  NotificationType,
} from "../../../generated/prisma/client";

import { createNotifications } from "../../notifications/notification.service";



type AuthenticatedActor = {
    userId: number;
    role: string;
};

export async function createTicketUseCase(
    input:CreateTicketInput,
    actor: AuthenticatedActor,
){

    // 1.Verify the actor's role.
    const allowedRoles:string[] =[
        UserRole.EMPLOYEE,
        UserRole.TECHNICIAN,
        UserRole.CENTER_MANAGER,
        UserRole.ADMIN,
    ];

    if(!allowedRoles.includes(actor.role)){
        throw new AppError("FORBIDDEN","You are not allowed to create tickets.");
    }

    // 2.Enforce priority policy C.
    // Employees may choose LOW, MEDIUM, or HIGH
    // CRITICAL is reserved for staff.

    if(actor.role === UserRole.EMPLOYEE && input.priority ==="CRITICAL"){
        throw new AppError(
            "FORBIDDEN",
            "Employees cannot submit tickets with CRITICAL priority.",
        );
    }

    return prisma.$transaction(async(tx)=>{
        // 3.Confirm the requester exists and is active.
        const requester = await tx.user.findUnique({
            where:{id: actor.userId},
            select:{
                id:true,
                isActive:true,
                role:true,
            },
        });

        if(!requester || !requester.isActive){
            throw new AppError(
                "UNAUTHENTICATED",
                "Your account is not available.",
            );
        }

        // Use the database role, not only the JWT role.
        if(requester.role !==actor.role){
            throw new AppError(
                "FORBIDDEN",
                "Your account permissions have changed. Please sign in again.",
            );
        }

        // 4.Verify the selected center exists and isactive
        const center = await tx.center.findUnique({
            where : { id: input.centerId},
            select:{
                id:true,
                isActive:true,
            },
        });

        if(!center || !center.isActive){
            throw new AppError(
                "NOT_FOUND",
                "The selected center was not found or is inactive.",
            );
        }

        // 5.Non-admin users must have explicit center access
        if(requester.role!==UserRole.ADMIN){
            const centerAccess = await tx.userCenter.findUnique({
                where:{
                    userId_centerId:{
                        userId:requester.id,
                        centerId:input.centerId,
                    },
                },

                select:{userId:true},
            });


            if(!centerAccess){
                throw new AppError(
                    "FORBIDDEN",
                    "You are not authorized to create tickets for this center.",
                );
            }
        }

            // 6. Verify the lab belongs to this center and is active.
            const lab = await tx.lab.findUnique({
                where:{
                    id:input.labId,
                    centerId:input.centerId,
                    isActive:true,
                },
                select:{id:true},
            });


            if(!lab){
                throw new AppError(
                    "VALIDATION_ERROR",
                    "The selected lab is invalid or does not belong to the selected center.",
                    [
                        {
                            field:"body.labId",
                            message:"Choose an active lab belonging to the selected center.",
                        },
                    ],
                );
            }

            // 7. Verify category exists and active.
            const category = await tx.category.findUnique({
                where:{id: input.categoryId},
                select:{
                    id:true,
                    code:true,
                    isActive:true,
                },
            });

            if(!category || !category.isActive){
                throw new AppError(
                    "VALIDATION_ERROR",
                    "The selected category is invalid or inactive.",
                    [
                        {
                            field:"body.categoryId",
                            message:"Choose an active category.",
                        },
                    ],
                );
            }

            // 8.Enforce software-specific fields using category.code.
            const isSoftwareCategory = category.code === "SOFTWARE";
            const hasSoftwareFields =
                input.softwareId!==undefined &&
                input.requestType!==undefined;

            if(isSoftwareCategory && !hasSoftwareFields){
                throw new AppError(
                    "VALIDATION_ERROR",
                    "Software requests require a software selection and request type.",
                    [
                        {
                            field:"body.softwareId",
                            message:"Required for software-category tickets.",
                        },

                        {
                            field:"body.requestType",
                            message:"Required for software-category tickets.",
                        },
                    ],
                );
            }


            if(!isSoftwareCategory && hasSoftwareFields){
                throw new AppError(
                    "VALIDATION_ERROR",
                    "Software fields are only allowed for software-category ticekts.",
                    [
                        {
                            field:"body.categoryId",
                            message:"Software fields require the SOFTWARE category.",
                        },
                    ],
                );
            }


            // 9. Verify selected software exists and isactive.
            if(input.softwareId !==undefined){
                const software = await tx.software.findUnique({
                    where:{id: input.softwareId},
                    select:{
                        id:true,
                        isActive:true,
                    },
                });


                if(!software || !software.isActive){
                    throw new AppError(
                        "VALIDATION_ERROR",
                        "The selected software is invalid or inactive.",
                        [
                            {
                                field:"body.softwareId",
                                message:"Choose active software from the catalog.",
                            },
                        ],
                    );
                }
            }

            // 10. Load the active SLA policy for the ticket priority.
            const slaPolicy = await getActiveSlaPolicy(input.priority, tx);

            // Use one consistent start timestamp for the SLA deadlines and cycle.
            const slaStartedAt = new Date();

            // Calculate deadlines using business minutes and the center's calendar.
            const firstResponseDueAt = await addBusinessMinutes({
            startAt: slaStartedAt,
            businessMinutes: slaPolicy.firstResponseMinutes,
            centerId: input.centerId,
            db: tx
            });

            const resolutionDueAt = await addBusinessMinutes({
            startAt: slaStartedAt,
            businessMinutes: slaPolicy.resolutionMinutes,
            centerId: input.centerId,
            db: tx
            });


            // 11. Reserver a yearly sequential ticket number.
            const year = new Date().getFullYear();
            const ticketNumber = await reserveTicketNumber(tx, year);


            // 12. Create the ticket and its intial history atomically.
            const ticket = await tx.ticket.create({
                data:{
                    ticketNumber,
                    title:input.title,
                    description:input.description,
                    priority:input.priority,
                    requestType:input.requestType,
                    softwareId:input.softwareId,
                    requesterId:requester.id,
                    centerId:input.centerId,
                    labId:input.labId,
                    categoryId: input.categoryId,
                    status:"OPEN",
                    firstResponseDueAt,
                    resolutionDueAt,
                    firstResponseTargetMinutes: slaPolicy.firstResponseMinutes,
                    resolutionTargetMinutes: slaPolicy.resolutionMinutes,
                    atRiskThresholdPercent:slaPolicy.atRiskThresholdPercent,
                    slaCycles: {
                        create: {
                            cycleNumber: 1,
                            startedAt: slaStartedAt,
                            dueAt: resolutionDueAt,
                            targetMinutes: slaPolicy.resolutionMinutes,
                            atRiskThresholdPercent:slaPolicy.atRiskThresholdPercent,
                        }
                    },

                    history:{
                        create:{
                            event:TicketHistoryEvent.CREATED,
                            actorId:requester.id,
                            toValue:"OPEN",
                            description:"Ticket created.",
                        },
                    },
                },


                select:{
                    id:true,
                    ticketNumber:true,
                    title:true,
                    description:true,
                    status:true,
                    priority:true,
                    requestType:true,
                    requesterId:true,
                    assigneeId:true,
                    centerId:true,
                    labId:true,
                    categoryId:true,
                    softwareId:true,
                    createdAt:true,
                    updatedAt:true,
                },
            });

            //13. Find active staff members who have access to this center.
            const staffMemberships = await tx.userCenter.findMany({
                where:{
                    centerId: input.centerId,
                    user:{
                        isActive:true,
                        role:{
                            in:[
                                UserRole.TECHNICIAN,
                                UserRole.CENTER_MANAGER,
                                UserRole.ADMIN,
                            ],
                        },
                    },
                },

                select:{
                    userId:true,
                },
            });

            const staffRecipientIds = staffMemberships.map((membership)=>membership.userId);

            // 14. Persist ticket-created notifications atomically.
            await createNotifications(tx,{
                recipientIds:[
                    requester.id,
                    ...staffRecipientIds,
                ],
                type:NotificationType.TICKET_CREATED,
                title:"New service ticket created",
                message:`Ticket ${ticket.ticketNumber}-${ticket.title} has been created.`,
                ticketId:ticket.id,
            });


            return ticket;
    })
}