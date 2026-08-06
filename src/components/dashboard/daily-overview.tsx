"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { Download, FileText, Loader2 } from "lucide-react";
import { DailyDatePicker } from "@/components/dashboard/daily-date-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import type {
  DailyDayGroup,
  DailySubmissionRow,
} from "@/lib/dashboard/daily-submissions";
import { cn } from "@/lib/utils";

type DailyOverviewProps = {
  anchorDate: string;
  initialDays: DailyDayGroup[];
  initialNextBefore: string | null;
  initialHasMore: boolean;
};

function DaySection({
  day,
  highlighted,
}: {
  day: DailyDayGroup;
  highlighted: boolean;
}) {
  const totalHours = day.submissions.reduce(
    (sum, s) => sum + s.totalHours,
    0,
  );
  const totalPay = day.submissions.reduce((sum, s) => sum + s.totalPay, 0);
  const label = format(parseISO(day.date), "EEEE d MMMM yyyy", { locale: nl });

  return (
    <Card
      id={`day-${day.date}`}
      className={cn(
        "scroll-mt-24",
        highlighted && "ring-2 ring-th-ink/30",
      )}
    >
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base capitalize">{label}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {day.submissions.length === 0
              ? "Geen inschrijvingen"
              : `${day.submissions.length} inschrijving${day.submissions.length === 1 ? "" : "en"}`}
          </p>
        </div>
        {day.submissions.length > 0 && (
          <p className="text-xs text-muted-foreground sm:text-right">
            {totalHours.toFixed(1).replace(".", ",")} uur ·{" "}
            {formatCurrency(totalPay)}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {day.submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="mb-2 size-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              Er zijn geen inschrijvingen voor deze datum.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DayTable submissions={day.submissions} totalHours={totalHours} totalPay={totalPay} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DayTable({
  submissions,
  totalHours,
  totalPay,
}: {
  submissions: DailySubmissionRow[];
  totalHours: number;
  totalPay: number;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Naam</TableHead>
          <TableHead>Afdeling</TableHead>
          <TableHead>Starttijd</TableHead>
          <TableHead>Eindtijd</TableHead>
          <TableHead>Pauze</TableHead>
          <TableHead className="text-right">Uren</TableHead>
          <TableHead className="text-right">Uurloon</TableHead>
          <TableHead className="text-right">Totaal</TableHead>
          <TableHead className="text-center">PDF</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.map((sub) => (
          <TableRow key={sub.id}>
            <TableCell className="font-medium">
              {sub.employee.firstName} {sub.employee.lastName}
            </TableCell>
            <TableCell>{sub.department ?? "—"}</TableCell>
            <TableCell>{sub.startTime}</TableCell>
            <TableCell>{sub.endTime}</TableCell>
            <TableCell>{sub.breakMinutes} min</TableCell>
            <TableCell className="text-right">
              {sub.totalHours.toFixed(1)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(sub.hourlyRate)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(sub.totalPay)}
            </TableCell>
            <TableCell className="text-center">
              <Button
                variant="ghost"
                size="icon-sm"
                render={
                  <a
                    href={`/api/dashboard/submissions/${sub.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <Download className="size-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={5} className="font-medium">
            Totaal
          </TableCell>
          <TableCell className="text-right font-medium">
            {totalHours.toFixed(1)}
          </TableCell>
          <TableCell />
          <TableCell className="text-right font-medium">
            {formatCurrency(totalPay)}
          </TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
}

export function DailyOverview({
  anchorDate,
  initialDays,
  initialNextBefore,
  initialHasMore,
}: DailyOverviewProps) {
  const router = useRouter();
  const [days, setDays] = useState(initialDays);
  const [nextBefore, setNextBefore] = useState(initialNextBefore);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  // Sync when server props change (date picker navigation).
  useEffect(() => {
    setDays(initialDays);
    setNextBefore(initialNextBefore);
    setHasMore(initialHasMore);
    setError(null);
  }, [anchorDate, initialDays, initialNextBefore, initialHasMore]);

  useEffect(() => {
    const el = document.getElementById(`day-${anchorDate}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [anchorDate, initialDays]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextBefore || loadingRef.current) return;
    loadingRef.current = true;
    setLoadingMore(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/dashboard/daily?endDate=${encodeURIComponent(nextBefore)}&days=7`,
      );
      if (!res.ok) throw new Error("Laden mislukt");
      const data = (await res.json()) as {
        days: DailyDayGroup[];
        nextBefore: string | null;
        hasMore: boolean;
      };

      setDays((prev) => {
        const seen = new Set(prev.map((d) => d.date));
        const appended = data.days.filter((d) => !seen.has(d.date));
        return [...prev, ...appended];
      });
      setNextBefore(data.nextBefore);
      setHasMore(data.hasMore);
    } catch {
      setError("Kon oudere dagen niet laden. Probeer het opnieuw.");
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, nextBefore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore, days.length]);

  const today = format(new Date(), "yyyy-MM-dd");
  const isJumping = anchorDate !== today;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dagelijks overzicht</h1>
          <p className="text-sm text-muted-foreground">
            {isJumping
              ? `Gericht op ${format(parseISO(anchorDate), "d MMMM yyyy", { locale: nl })}`
              : "Laatste dagen, gegroepeerd per dienstdatum"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {isJumping && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                startTransition(() => {
                  router.push("/dashboard/daily");
                });
              }}
            >
              Naar vandaag
            </Button>
          )}
          <DailyDatePicker currentDate={anchorDate} />
        </div>
      </div>

      <div className="space-y-4">
        {days.map((day) => (
          <DaySection
            key={day.date}
            day={day}
            highlighted={day.date === anchorDate && isJumping}
          />
        ))}
      </div>

      <div ref={sentinelRef} className="flex flex-col items-center gap-2 py-4">
        {loadingMore && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Oudere dagen laden…
          </p>
        )}
        {error && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-destructive">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void loadMore()}>
              Opnieuw proberen
            </Button>
          </div>
        )}
        {!hasMore && !loadingMore && (
          <p className="text-xs text-muted-foreground">
            Geen oudere inschrijvingen meer.
          </p>
        )}
      </div>
    </div>
  );
}
