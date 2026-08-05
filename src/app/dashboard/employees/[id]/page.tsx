import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  Calendar,
  Phone,
  Mail,
  Landmark,
} from "lucide-react";
import { UnblockButton } from "@/components/dashboard/unblock-button";

function formatCurrency(amount: number): string {
  return `€${amount.toFixed(2).replace(".", ",")}`;
}

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      submissions: {
        orderBy: { eventDate: "desc" },
        select: {
          id: true,
          eventDate: true,
          department: true,
          startTime: true,
          endTime: true,
          totalHours: true,
          totalPay: true,
        },
      },
      _count: { select: { submissions: true } },
    },
  });

  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/dashboard/employees" />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">Medewerker details</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="px-3 py-1 text-base">
            {employee._count.submissions} shift
            {employee._count.submissions !== 1 ? "s" : ""}
          </Badge>
          {employee.isBlocked ? (
            <Badge variant="destructive">Geblokkeerd</Badge>
          ) : (
            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200">
              Actief
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Gegevens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="size-4 shrink-0 text-muted-foreground" />
              <span>
                {format(employee.dateOfBirth, "d MMMM yyyy", { locale: nl })}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{employee.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="size-4 shrink-0 text-muted-foreground" />
              <span>{employee.phone}</span>
            </div>
            <Separator />
            <div className="text-sm">
              <p className="mb-1 text-muted-foreground">Adres</p>
              <p>
                {employee.street} {employee.houseNumber}
              </p>
              <p>
                {employee.postalCode} {employee.city}
              </p>
            </div>
            <Separator />
            <div className="flex items-center gap-3 text-sm">
              <Landmark className="size-4 shrink-0 text-muted-foreground" />
              <span className="font-mono text-xs">{employee.iban}</span>
            </div>

            {employee.isBlocked && (
              <>
                <Separator />
                <UnblockButton employeeId={employee.id} />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Shift geschiedenis</CardTitle>
            <CardDescription>
              {employee._count.submissions} inschrijving
              {employee._count.submissions !== 1 ? "en" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {employee.submissions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nog geen shifts geregistreerd.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Afdeling</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>Eind</TableHead>
                    <TableHead className="text-right">Uren</TableHead>
                    <TableHead className="text-right">Totaal</TableHead>
                    <TableHead className="text-center">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employee.submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        {format(sub.eventDate, "dd-MM-yyyy")}
                      </TableCell>
                      <TableCell>{sub.department ?? "—"}</TableCell>
                      <TableCell>{sub.startTime}</TableCell>
                      <TableCell>{sub.endTime}</TableCell>
                      <TableCell className="text-right">
                        {Number(sub.totalHours).toFixed(1)}
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
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
