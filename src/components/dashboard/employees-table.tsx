"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Download, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, maskBSN } from "@/lib/format";

export type EmployeeRow = {
  id: string;
  firstName: string;
  lastName: string;
  bsn: string;
  isBlocked: boolean;
  shiftCount: number;
  lastSubmissionDate: string | null;
  lastSubmissionId: string | null;
};

export function EmployeesTable({ employees }: { employees: EmployeeRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/dashboard/employees?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoek op naam…"
            defaultValue={search}
            className="pl-8"
            onChange={(e) => {
              const value = e.target.value;
              // Debounce-ish via short timeout
              window.clearTimeout((window as unknown as { __empSearch?: number }).__empSearch);
              (window as unknown as { __empSearch?: number }).__empSearch =
                window.setTimeout(() => updateParam("search", value), 300);
            }}
          />
        </div>
        <select
          value={status}
          onChange={(e) => updateParam("status", e.target.value)}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm sm:w-44"
        >
          <option value="all">Alle</option>
          <option value="active">Actief</option>
          <option value="blocked">Geblokkeerd</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>BSN</TableHead>
              <TableHead>Shifts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Laatste shift</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  Geen medewerkers gevonden
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/employees/${emp.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {emp.firstName} {emp.lastName}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {maskBSN(emp.bsn)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        emp.shiftCount >= 4
                          ? "destructive"
                          : emp.shiftCount >= 3
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {emp.shiftCount}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {emp.isBlocked ? (
                      <Badge variant="destructive">Geblokkeerd</Badge>
                    ) : (
                      <Badge className="bg-th-green text-white">Actief</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {emp.lastSubmissionDate
                      ? formatDate(emp.lastSubmissionDate)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<Link href={`/dashboard/employees/${emp.id}`} />}
                        aria-label="Bekijk details"
                      >
                        <Eye className="size-4" />
                      </Button>
                      {emp.lastSubmissionId && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          render={
                            <a
                              href={`/api/dashboard/submissions/${emp.lastSubmissionId}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                            />
                          }
                          aria-label="Download PDF"
                        >
                          <Download className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
