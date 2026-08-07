import { prisma } from "@/lib/db";
import { format } from "date-fns";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { EmployeeFilters } from "@/components/dashboard/employee-filters";
import { EmployeeActions } from "@/components/dashboard/employee-actions";

function maskBsn(bsn: string): string {
  const digits = bsn.replace(/\D/g, "");
  return `***-***-${digits.slice(-3)}`;
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const statusFilter = params.status ?? "all";

  const where: Prisma.EmployeeWhereInput = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ];
  }

  const employees = await prisma.employee.findMany({
    where,
    include: {
      submissions: {
        orderBy: { eventDate: "desc" },
        take: 1,
        select: { eventDate: true, id: true },
      },
      _count: { select: { submissions: true } },
    },
    orderBy: { lastName: "asc" },
  });

  const filtered = employees.filter((emp) => {
    if (statusFilter === "contract") return emp._count.submissions >= 3;
    if (statusFilter === "under3") return emp._count.submissions < 3;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Medewerkers</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} medewerker{filtered.length !== 1 ? "s" : ""}{" "}
            gevonden
          </p>
        </div>
      </div>

      <EmployeeFilters currentSearch={search} currentStatus={statusFilter} />

      <Card>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-3 size-10 text-muted-foreground/50" />
              <p className="text-sm font-medium">Geen medewerkers gevonden</p>
              <p className="text-xs text-muted-foreground">
                Probeer een andere zoekopdracht of filter.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>BSN</TableHead>
                  <TableHead className="text-center">Shifts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Laatste shift</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp) => {
                  const needsContract = emp._count.submissions >= 3;
                  return (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/employees/${emp.id}`}
                          className="hover:underline"
                        >
                          {emp.firstName} {emp.lastName}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {maskBsn(emp.bsn)}
                      </TableCell>
                      <TableCell className="text-center">
                        {emp._count.submissions}
                      </TableCell>
                      <TableCell>
                        {needsContract ? (
                          <Badge className="border-amber-200 bg-amber-500/15 text-amber-800">
                            Contract opvolging
                          </Badge>
                        ) : (
                          <Badge className="border-emerald-200 bg-emerald-500/15 text-emerald-700">
                            Actief
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {emp.submissions[0]
                          ? format(emp.submissions[0].eventDate, "dd-MM-yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <EmployeeActions
                          employeeId={emp.id}
                          employeeName={`${emp.firstName} ${emp.lastName}`}
                          lastSubmissionId={emp.submissions[0]?.id}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
