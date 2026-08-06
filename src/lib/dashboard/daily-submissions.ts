import {
  eachDayOfInterval,
  endOfDay,
  format,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { prisma } from "@/lib/db";

export type DailySubmissionRow = {
  id: string;
  eventDate: string;
  department: string | null;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  hourlyRate: number;
  totalHours: number;
  totalPay: number;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

export type DailyDayGroup = {
  date: string;
  submissions: DailySubmissionRow[];
};

export async function getDailyDayGroups(options: {
  /** Inclusive newest day (yyyy-MM-dd) */
  endDate: string;
  /** Number of calendar days to include, ending at endDate */
  days?: number;
}): Promise<{
  days: DailyDayGroup[];
  nextBefore: string | null;
  hasMore: boolean;
}> {
  const dayCount = options.days ?? 7;
  const end = endOfDay(parseISO(options.endDate));
  const start = startOfDay(subDays(parseISO(options.endDate), dayCount - 1));

  const [submissions, olderCount] = await Promise.all([
    prisma.submission.findMany({
      where: {
        eventDate: { gte: start, lte: end },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ eventDate: "desc" }, { startTime: "asc" }],
    }),
    prisma.submission.count({
      where: { eventDate: { lt: start } },
    }),
  ]);

  const byDate = new Map<string, DailySubmissionRow[]>();
  for (const sub of submissions) {
    const key = format(sub.eventDate, "yyyy-MM-dd");
    const list = byDate.get(key) ?? [];
    list.push({
      id: sub.id,
      eventDate: key,
      department: sub.department,
      startTime: sub.startTime,
      endTime: sub.endTime,
      breakMinutes: sub.breakMinutes,
      hourlyRate: Number(sub.hourlyRate),
      totalHours: Number(sub.totalHours),
      totalPay: Number(sub.totalPay),
      employee: sub.employee,
    });
    byDate.set(key, list);
  }

  const calendarDays = eachDayOfInterval({ start, end }).reverse();
  const days: DailyDayGroup[] = calendarDays.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    return {
      date: key,
      submissions: byDate.get(key) ?? [],
    };
  });

  const nextBefore = format(subDays(start, 1), "yyyy-MM-dd");
  const hasMore = olderCount > 0;

  return {
    days,
    nextBefore: hasMore ? nextBefore : null,
    hasMore,
  };
}
