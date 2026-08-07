"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Download, Trash2 } from "lucide-react";
import { deleteEmployee } from "@/app/dashboard/actions";

interface EmployeeActionsProps {
  employeeId: string;
  employeeName: string;
  lastSubmissionId?: string;
}

export function EmployeeActions({
  employeeId,
  employeeName,
  lastSubmissionId,
}: EmployeeActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/employees/${employeeId}`)}
          >
            <Eye className="size-4" />
            Bekijk details
          </DropdownMenuItem>
          {lastSubmissionId && (
            <DropdownMenuItem
              render={
                <a
                  href={`/api/dashboard/submissions/${lastSubmissionId}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <Download className="size-4" />
              Download laatste PDF
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Verwijderen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Medewerker verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je {employeeName} wilt verwijderen? Alle
              inschrijvingen, meldingen en het ID-document worden permanent
              verwijderd. Dit kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                startTransition(() => deleteEmployee(employeeId))
              }
            >
              {isPending ? "Bezig..." : "Verwijderen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
