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
import { deleteSubmission } from "@/app/dashboard/actions";

interface DeleteSubmissionButtonProps {
  submissionId: string;
  eventLabel: string;
}

export function DeleteSubmissionButton({
  submissionId,
  eventLabel,
}: DeleteSubmissionButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
          />
        }
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Verwijder inschrijving</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Inschrijving verwijderen?</AlertDialogTitle>
          <AlertDialogDescription>
            Weet je zeker dat je de inschrijving van {eventLabel} wilt
            verwijderen? Dit kan niet ongedaan worden gemaakt. Het
            shift-aantal en eventuele blokkering worden bijgewerkt.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuleren</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              startTransition(() => deleteSubmission(submissionId))
            }
          >
            {isPending ? "Bezig..." : "Verwijderen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
