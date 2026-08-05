"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Download, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateLong } from "@/lib/format";

export type DailySubmission = {
  id: string;
  department: string | null;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  hourlyRate: string | number;
  totalHours: string | number;
  totalPay: string | number;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

export function DailyView({
  date,
  submissions,
}: {
  date: string;
  submissions: DailySubmission[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalHours = submissions.reduce(
    (sum, s) => sum + Number(s.totalHours),
    0,
  );
  const totalPay = submissions.reduce((sum, s) => sum + Number(s.totalPay), 0);

  function onDateChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", value);
    router.push(`/dashboard/daily?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="th-heading text-2xl">Dagelijks overzicht</h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            {formatDateLong(date)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          <Input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="th-section-title">Medewerkers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{submissions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="th-section-title">Totaal uren</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalHours.toFixed(2).replace(".", ",")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="th-section-title">Totaal uitbetaling</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalPay)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Formulieren</CardTitle>
          {submissions.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Download individuele PDF&apos;s via de knoppen
            </p>
          )}
        </CardHeader>
        <CardContent className="px-0">
          {submissions.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              Geen formulieren voor {format(new Date(date), "dd-MM-yyyy")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Afdeling</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>Eind</TableHead>
                    <TableHead>Pauze</TableHead>
                    <TableHead>Uren</TableHead>
                    <TableHead>Uurloon</TableHead>
                    <TableHead>Totaal</TableHead>
                    <TableHead className="text-right">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {sub.employee.firstName} {sub.employee.lastName}
                      </TableCell>
                      <TableCell>{sub.department || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {sub.startTime}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {sub.endTime}
                      </TableCell>
                      <TableCell>{sub.breakMinutes} min</TableCell>
                      <TableCell>
                        {Number(sub.totalHours).toFixed(2).replace(".", ",")}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(Number(sub.hourlyRate))}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(Number(sub.totalPay))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          render={
                            <a
                              href={`/api/dashboard/submissions/${sub.id}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                              download
                            />
                          }
                        >
                          <Download className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5} className="font-semibold">
                      Totaal
                    </TableCell>
                    <TableCell className="font-semibold">
                      {totalHours.toFixed(2).replace(".", ",")}
                    </TableCell>
                    <TableCell />
                    <TableCell className="font-semibold">
                      {formatCurrency(totalPay)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
