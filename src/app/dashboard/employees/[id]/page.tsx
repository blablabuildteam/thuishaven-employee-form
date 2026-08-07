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
  IdCard,
} from "lucide-react";
import { DeleteEmployeeButton } from "@/components/dashboard/delete-employee-button";
import { EmployeeSubmissionsTable } from "@/components/dashboard/employee-submissions-table";

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
          breakMinutes: true,
          hourlyRate: true,
          totalHours: true,
          totalPay: true,
          signatureData: true,
          createdAt: true,
        },
      },
      identityDocument: true,
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
          {employee._count.submissions >= 3 ? (
            <Badge className="border-amber-200 bg-amber-500/15 text-amber-800">
              Contract opvolging
            </Badge>
          ) : (
            <Badge className="border-emerald-200 bg-emerald-500/15 text-emerald-700">
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

            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <IdCard className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">ID-document</span>
              </div>
              {employee.identityDocument ? (
                <div className="pl-7">
                  <p className="truncate font-medium">
                    {employee.identityDocument.originalName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Geüpload{" "}
                    {format(employee.identityDocument.uploadedAt, "d MMM yyyy", {
                      locale: nl,
                    })}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    render={
                      <a
                        href={`/api/dashboard/employees/${employee.id}/id-document`}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    <Download className="size-3.5" />
                    Bekijken
                  </Button>
                </div>
              ) : (
                <p className="pl-7 text-xs text-muted-foreground">
                  Nog geen document geüpload
                </p>
              )}
            </div>

            <Separator />
            <DeleteEmployeeButton
              employeeId={employee.id}
              employeeName={`${employee.firstName} ${employee.lastName}`}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Shift geschiedenis</CardTitle>
            <CardDescription>
              {employee._count.submissions} inschrijving
              {employee._count.submissions !== 1 ? "en" : ""}
              {" · "}Klik op een rij voor details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {employee.submissions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nog geen shifts geregistreerd.
              </p>
            ) : (
              <EmployeeSubmissionsTable
                employee={{
                  firstName: employee.firstName,
                  lastName: employee.lastName,
                  dateOfBirth: employee.dateOfBirth.toISOString(),
                  bsn: employee.bsn,
                  street: employee.street,
                  houseNumber: employee.houseNumber,
                  postalCode: employee.postalCode,
                  city: employee.city,
                  email: employee.email,
                  phone: employee.phone,
                  iban: employee.iban,
                }}
                submissions={employee.submissions.map((sub) => ({
                  id: sub.id,
                  eventDate: sub.eventDate.toISOString(),
                  department: sub.department,
                  startTime: sub.startTime,
                  endTime: sub.endTime,
                  breakMinutes: sub.breakMinutes,
                  hourlyRate: Number(sub.hourlyRate),
                  totalHours: Number(sub.totalHours),
                  totalPay: Number(sub.totalPay),
                  signatureData: sub.signatureData,
                  createdAt: sub.createdAt.toISOString(),
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
