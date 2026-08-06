import { format } from "date-fns";
import { DailyOverview } from "@/components/dashboard/daily-overview";
import { getDailyDayGroups } from "@/lib/dashboard/daily-submissions";

export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const today = format(new Date(), "yyyy-MM-dd");
  const anchorDate =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : today;

  const { days, nextBefore, hasMore } = await getDailyDayGroups({
    endDate: anchorDate,
    days: 7,
  });

  return (
    <DailyOverview
      anchorDate={anchorDate}
      initialDays={days}
      initialNextBefore={nextBefore}
      initialHasMore={hasMore}
    />
  );
}
