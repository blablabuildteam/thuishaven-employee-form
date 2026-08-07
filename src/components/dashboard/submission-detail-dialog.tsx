"use client";

import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type SubmissionDetailEmployee = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  bsn: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  email: string;
  phone: string;
  iban: string;
};

export type SubmissionDetailData = {
  id: string;
  eventDate: string;
  department: string | null;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  hourlyRate: number;
  totalHours: number;
  totalPay: number;
  signatureData: string | null;
  createdAt: string;
};

function formatCurrency(amount: number): string {
  return `€${amount.toFixed(2).replace(".", ",")}`;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium">{value}</p>
    </div>
  );
}

interface SubmissionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: SubmissionDetailEmployee;
  submission: SubmissionDetailData | null;
}

export function SubmissionDetailDialog({
  open,
  onOpenChange,
  employee,
  submission,
}: SubmissionDetailDialogProps) {
  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Inschrijving bekijken</DialogTitle>
          <DialogDescription>
            {format(new Date(submission.eventDate), "d MMMM yyyy", {
              locale: nl,
            })}
            {submission.department ? ` · ${submission.department}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Persoonlijk
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Voornaam" value={employee.firstName} />
              <Field label="Achternaam" value={employee.lastName} />
              <Field
                label="Geboortedatum"
                value={format(new Date(employee.dateOfBirth), "d MMMM yyyy", {
                  locale: nl,
                })}
              />
              <Field label="BSN" value={employee.bsn} />
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Adres & contact
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Adres"
                value={`${employee.street} ${employee.houseNumber}`}
              />
              <Field
                label="Postcode / plaats"
                value={`${employee.postalCode} ${employee.city}`}
              />
              <Field label="E-mail" value={employee.email} />
              <Field label="Telefoon" value={employee.phone} />
              <Field label="IBAN" value={employee.iban} />
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Dienst
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Datum"
                value={format(new Date(submission.eventDate), "dd-MM-yyyy")}
              />
              <Field
                label="Afdeling"
                value={submission.department ?? "—"}
              />
              <Field label="Starttijd" value={submission.startTime} />
              <Field label="Eindtijd" value={submission.endTime} />
              <Field
                label="Pauze"
                value={`${submission.breakMinutes} min`}
              />
              <Field
                label="Uurloon"
                value={formatCurrency(submission.hourlyRate)}
              />
              <Field
                label="Uren"
                value={submission.totalHours.toFixed(1)}
              />
              <Field
                label="Totaal"
                value={formatCurrency(submission.totalPay)}
              />
            </div>
          </section>

          {submission.signatureData && (
            <>
              <Separator />
              <section className="space-y-2">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Handtekening
                </h3>
                <div className="rounded-lg border bg-white p-3">
                  <img
                    src={submission.signatureData}
                    alt="Handtekening"
                    className="mx-auto max-h-28 w-auto"
                  />
                </div>
              </section>
            </>
          )}

          <p className="text-xs text-muted-foreground">
            Ingediend{" "}
            {format(new Date(submission.createdAt), "d MMMM yyyy, HH:mm", {
              locale: nl,
            })}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            render={
              <a
                href={`/api/dashboard/submissions/${submission.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <Download className="size-4" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
