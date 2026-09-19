import { AppError } from "../errors/app-error";

export type TicketCursor = {
    v:1;
    createdAt:string;
    id:number;
};

type CursorPayload = {
    v?:unknown;
    createdAt?:unknown;
    id?:unknown;
};

export function encodeCursor(cursor:TicketCursor):string{
    const payload = JSON.stringify(cursor);

    return Buffer.from(payload,"utf8").toString("base64url");
}

export function decodeCursor(cursor:string):TicketCursor{

    try{
        const decoded = Buffer.from(cursor,"base64url").toString("utf8");

        const payload:unknown = JSON.parse(decoded);

        if(
            typeof payload !=="object" ||
            payload === null ||
            Array.isArray(payload)
        ){
            throw new Error("Invalid cursor payload");
        }

        const value = payload as CursorPayload;

        if(value.v !==1 || typeof value.createdAt!=="string" || !Number.isSafeInteger(value.id) || (value.id as number)<=0){
            throw new Error("Invalid cursor fields");
        }

        const timestamp = new Date(value.createdAt);

        if(
            Number.isNaN(timestamp.getTime()) ||
            timestamp.toISOString()!==value.createdAt
        ){

            throw new Error("Invalid cursor timestamp");
        }

        return {
            v:1,
            createdAt:value.createdAt,
            id:value.id as number,
        };
    }

    catch{
        throw new AppError(
            "VALIDATION_ERROR",
            "Invalid pagination cursor.",
            [{field:"query.cursor",message:"Cursor is malformed or invalid."}],
        );
    }
}