import { prisma } from "@/lib/db";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { nl } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClickableTableRow } from "@/components/dashboard/clickable-table-row";
import { Users, FileText, AlertTriangle, FileWarning } from "lucide-react";

function formatCurrency(amount: number): string {
  return `€${amount.toFixed(2).replace(".", ",")}`;
}

export default async function DashboardPage() {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [
    totalEmployees,
    employeesWithShiftCounts,
    submissionsThisWeek,
    pendingAlerts,
    recentSubmissions,
    alertsList,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.findMany({
      select: { _count: { select: { submissions: true } } },
    }),
    prisma.submission.count({
      where: { createdAt: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.alert.count({ where: { acknowledged: false } }),
    prisma.submission.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { employee: true },
    }),
    prisma.alert.findMany({
      where: { acknowledged: false },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { employee: true },
    }),
  ]);

  const contractAttentionCount = employeesWithShiftCounts.filter(
    (e) => e._count.submissions >= 3,
  ).length;

  const stats = [
    {
      label: "Totaal medewerkers",
      value: totalEmployees,
      icon: Users,
      href: "/dashboard/employees",
      highlight: false,
    },
    {
      label: "Inschrijvingen deze week",
      value: submissionsThisWeek,
      icon: FileText,
      href: "/dashboard/daily",
      highlight: false,
    },
    {
      label: "Openstaande meldingen",
      value: pendingAlerts,
      icon: AlertTriangle,
      href: "/dashboard/alerts",
      highlight: pendingAlerts > 0,
    },
    {
      label: "Contract opvolging (3+)",
      value: contractAttentionCount,
      icon: FileWarning,
      href: "/dashboard/alerts",
      highlight: contractAttentionCount > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Overzicht</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card
              className={cn(
                "transition-shadow hover:shadow-md",
                stat.highlight && "ring-2 ring-amber-400"
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <stat.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recente inschrijvingen</CardTitle>
            <CardDescription>Laatste 10 inzendingen</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Geen inschrijvingen gevonden.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-right">Uren</TableHead>
                    <TableHead className="text-right">Totaal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSubmissions.map((sub) => (
                    <ClickableTableRow
                      key={sub.id}
                      href={`/dashboard/employees/${sub.employeeId}`}
                    >
                      <TableCell className="font-medium">
                        {sub.employee.firstName} {sub.employee.lastName}
                      </TableCell>
                      <TableCell>
                        {format(sub.eventDate, "dd-MM-yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(sub.totalHours).toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(sub.totalPay))}
                      </TableCell>
                    </ClickableTableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Openstaande meldingen</CardTitle>
            <CardDescription>
              {pendingAlerts} melding{pendingAlerts !== 1 ? "en" : ""} wachten
              op bevestiging
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alertsList.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Geen openstaande meldingen.
              </p>
            ) : (
              <div className="space-y-3">
                {alertsList.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "rounded-lg border p-3",
                      alert.type === "FOUR_SHIFTS"
                        ? "border-red-200 bg-red-50"
                        : "border-amber-200 bg-amber-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          {alert.employee.firstName} {alert.employee.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {alert.message}
                        </p>
                      </div>
                      <Badge
                        variant={
                          alert.type === "FOUR_SHIFTS"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {alert.type === "FOUR_SHIFTS"
                          ? "Contractactie"
                          : "Waarschuwing"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(alert.createdAt, "d MMMM yyyy, HH:mm", {
                        locale: nl,
                      })}
                    </p>
                  </div>
                ))}
                <Link
                  href="/dashboard/alerts"
                  className="block text-center text-sm text-primary hover:underline"
                >
                  Alle meldingen bekijken →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
