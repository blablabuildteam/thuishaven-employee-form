"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DeleteSubmissionButton } from "@/components/dashboard/delete-submission-button";
import {
  SubmissionDetailDialog,
  type SubmissionDetailData,
  type SubmissionDetailEmployee,
} from "@/components/dashboard/submission-detail-dialog";

function formatCurrency(amount: number): string {
  return `€${amount.toFixed(2).replace(".", ",")}`;
}

interface EmployeeSubmissionsTableProps {
  employee: SubmissionDetailEmployee;
  submissions: SubmissionDetailData[];
}

export function EmployeeSubmissionsTable({
  employee,
  submissions,
}: EmployeeSubmissionsTableProps) {
  const [selected, setSelected] = useState<SubmissionDetailData | null>(null);

  return (
    <>
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
            <TableHead className="w-10">
              <span className="sr-only">Acties</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((sub) => (
            <TableRow
              key={sub.id}
              role="button"
              tabIndex={0}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => setSelected(sub)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelected(sub);
                }
              }}
            >
              <TableCell>
                {format(new Date(sub.eventDate), "dd-MM-yyyy")}
              </TableCell>
              <TableCell>{sub.department ?? "—"}</TableCell>
              <TableCell>{sub.startTime}</TableCell>
              <TableCell>{sub.endTime}</TableCell>
              <TableCell className="text-right">
                {sub.totalHours.toFixed(1)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(sub.totalPay)}
              </TableCell>
              <TableCell
                className="text-center"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
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
              <TableCell
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <DeleteSubmissionButton
                  submissionId={sub.id}
                  eventLabel={format(new Date(sub.eventDate), "dd-MM-yyyy")}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <SubmissionDetailDialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        employee={employee}
        submission={selected}
      />
    </>
  );
}
