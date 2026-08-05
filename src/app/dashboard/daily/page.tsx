import { prisma } from "@/lib/db";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
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
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { DailyDatePicker } from "@/components/dashboard/daily-date-picker";

function formatCurrency(amount: number): string {
  return `€${amount.toFixed(2).replace(".", ",")}`;
}

export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const dateStr = params.date ?? format(new Date(), "yyyy-MM-dd");
  const selectedDate = parseISO(dateStr);

  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const submissions = await prisma.submission.findMany({
    where: {
      eventDate: { gte: startOfDay, lte: endOfDay },
    },
    include: { employee: true },
    orderBy: { startTime: "asc" },
  });

  const totalHours = submissions.reduce(
    (sum, s) => sum + Number(s.totalHours),
    0
  );
  const totalPay = submissions.reduce(
    (sum, s) => sum + Number(s.totalPay),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dagelijks overzicht</h1>
          <p className="text-sm text-muted-foreground">
            {format(selectedDate, "EEEE d MMMM yyyy", { locale: nl })}
          </p>
        </div>
        <DailyDatePicker currentDate={dateStr} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inschrijvingen ({submissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-3 size-10 text-muted-foreground/50" />
              <p className="text-sm font-medium">Geen inschrijvingen</p>
              <p className="text-xs text-muted-foreground">
                Er zijn geen inschrijvingen voor deze datum.
              </p>
            </div>
          ) : (
            <>
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
                        {Number(sub.totalHours).toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(sub.hourlyRate))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(sub.totalPay))}
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

              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm">
                  <Download className="size-4" />
                  Download alle PDFs
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
