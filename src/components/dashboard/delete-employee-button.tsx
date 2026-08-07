"use client";

import { useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteEmployee } from "@/app/dashboard/actions";

interface DeleteEmployeeButtonProps {
  employeeId: string;
  employeeName: string;
}

export function DeleteEmployeeButton({
  employeeId,
  employeeName,
}: DeleteEmployeeButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
          />
        }
      >
        <Trash2 className="size-4" />
        Verwijder medewerker
      </AlertDialogTrigger>
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
  );
}
