
import { DateTime } from "luxon";
import { prisma } from "../../config/database";
import type { Prisma } from "../../generated/prisma/client";


type DatabaseClient = Prisma.TransactionClient | typeof prisma;


const BUSINESS_TIMEZONE = "Asia/Kolkata";

const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 18;

const MINUTES_PER_BUSINESS_DAY =
  (BUSINESS_END_HOUR - BUSINESS_START_HOUR) * 60;

type AddBusinessMinutesInput = {
  startAt: Date;
  businessMinutes: number;
  centerId: number;
  db?: DatabaseClient;
};

function toDateKey(date: DateTime): string {
  return date.toISODate()!;
}

function isWeekend(date: DateTime): boolean {
  return date.weekday === 6 || date.weekday === 7;
}

function isOutsideBusinessHours(date: DateTime): boolean {
  return (
    date.hour < BUSINESS_START_HOUR ||
    date.hour >= BUSINESS_END_HOUR
  );
}

function startOfBusinessDay(date: DateTime): DateTime {
  return date.set({
    hour: BUSINESS_START_HOUR,
    minute: 0,
    second: 0,
    millisecond: 0
  });
}

function nextBusinessDay(date: DateTime): DateTime {
  return startOfBusinessDay(date.plus({ days: 1 }));
}

async function getHolidayDateKeys(
  centerId: number,
  db: DatabaseClient
): Promise<Set<string>> {
  const holidays = await db.holiday.findMany({
    where: {
      OR: [
        { centerId: null },
        { centerId }
      ]
    },
    select: {
      date: true
    }
  });

  return new Set(
    holidays.map((holiday) =>
      DateTime.fromJSDate(holiday.date, {
        zone: "utc"
      }).toISODate()!
    )
  );
}

function isBusinessDay(
  date: DateTime,
  holidayDateKeys: Set<string>
): boolean {
  return (
    !isWeekend(date) &&
    !holidayDateKeys.has(toDateKey(date))
  );
}

function normalizeToBusinessTime(
  date: DateTime,
  holidayDateKeys: Set<string>
): DateTime {
  let current: DateTime<boolean>=date;

  while (!isBusinessDay(current, holidayDateKeys)) {
    current = nextBusinessDay(current);
  }

  if (current.hour >= BUSINESS_END_HOUR) {
    current = nextBusinessDay(current);
  } else if (current.hour < BUSINESS_START_HOUR) {
    current = startOfBusinessDay(current);
  }

  while (!isBusinessDay(current, holidayDateKeys)) {
    current = nextBusinessDay(current);
  }

  return current;
}

export async function addBusinessMinutes({
  startAt,
  businessMinutes,
  centerId,
  db = prisma
}: AddBusinessMinutesInput): Promise<Date> {
  if (!Number.isFinite(businessMinutes) || businessMinutes < 0) {
    throw new Error("businessMinutes must be a non-negative number");
  }

  const holidays = await getHolidayDateKeys(centerId,db);

  let current:DateTime<boolean> = DateTime.fromJSDate(startAt, {
    zone: BUSINESS_TIMEZONE
  });

  if (!current.isValid) {
    throw new Error("Invalid startAt date");
  }

  current = normalizeToBusinessTime(current, holidays);

  let remainingMinutes = businessMinutes;

  while (remainingMinutes > 0) {
    const endOfBusinessDay = current.set({
      hour: BUSINESS_END_HOUR,
      minute: 0,
      second: 0,
      millisecond: 0
    });

    const availableMinutes = endOfBusinessDay.diff(
      current,
      "minutes"
    ).minutes;

    if (remainingMinutes <= availableMinutes) {
      current = current.plus({
        minutes: remainingMinutes
      });

      remainingMinutes = 0;
    } else {
      remainingMinutes -= availableMinutes;
      current = nextBusinessDay(current);

      current = normalizeToBusinessTime(
        current,
        holidays
      );
    }
  }

  return current.toUTC().toJSDate();
}

export async function getBusinessMinutesBetween({
  startAt,
  endAt,
  centerId,
  db = prisma,
}: {
  startAt: Date;
  endAt: Date;
  centerId: number;
  db?: DatabaseClient;
}): Promise<number> {
  if (
    !Number.isFinite(startAt.getTime()) ||
    !Number.isFinite(endAt.getTime())
  ) {
    throw new Error("startAt and endAt must be valid dates");
  }

  if (endAt <= startAt) {
    return 0;
  }

  const holidays = await getHolidayDateKeys(centerId, db);

  const start = DateTime.fromJSDate(startAt, {
    zone: BUSINESS_TIMEZONE,
  });

  const end = DateTime.fromJSDate(endAt, {
    zone: BUSINESS_TIMEZONE,
  });

  let totalMinutes = 0;

  // Walk calendar days, counting only overlap with each business window.
  let day = start.startOf("day");

  while (day < end) {
    if (isBusinessDay(day, holidays)) {
      const businessStart = day.set({
        hour: BUSINESS_START_HOUR,
        minute: 0,
        second: 0,
        millisecond: 0,
      });

      const businessEnd = day.set({
        hour: BUSINESS_END_HOUR,
        minute: 0,
        second: 0,
        millisecond: 0,
      });

      const overlapStart =
        start > businessStart ? start : businessStart;

      const overlapEnd =
        end < businessEnd ? end : businessEnd;

      if (overlapEnd > overlapStart) {
        totalMinutes += overlapEnd.diff(
          overlapStart,
          "minutes",
        ).minutes;
      }
    }

    day = day.plus({ days: 1 });
  }

  return totalMinutes;
}