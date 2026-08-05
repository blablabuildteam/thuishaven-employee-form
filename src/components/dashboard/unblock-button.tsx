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
import { Unlock } from "lucide-react";
import { unblockEmployee } from "@/app/dashboard/actions";

interface UnblockButtonProps {
  employeeId: string;
}

export function UnblockButton({ employeeId }: UnblockButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="destructive" className="w-full" />}
      >
        <Unlock className="size-4" />
        Deblokkeer medewerker
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Medewerker deblokkeren?</AlertDialogTitle>
          <AlertDialogDescription>
            Deze medewerker wordt gedeblokkeerd en kan opnieuw shifts
            registreren. Bijbehorende meldingen worden als bevestigd
            gemarkeerd.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuleren</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() =>
              startTransition(() => unblockEmployee(employeeId))
            }
          >
            {isPending ? "Bezig..." : "Deblokkeren"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
