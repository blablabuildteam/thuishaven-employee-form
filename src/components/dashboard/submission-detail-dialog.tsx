"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Download, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DepartmentSelect } from "@/components/form/department-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  calculateHourlyRate,
  calculateTotalHours,
  calculateTotalPay,
} from "@/lib/pay-calculation";
import { submissionEditSchema } from "@/lib/validations";
import type {
  SubmissionDetailData,
  SubmissionDetailEmployee,
  SubmissionDetailResponse,
} from "@/lib/dashboard/submission-detail";

export type {
  SubmissionDetailData,
  SubmissionDetailEmployee,
  SubmissionDetailResponse,
};

function toDateInput(value: string): string {
  return value.slice(0, 10);
}

function toEditValues(
  employee: SubmissionDetailEmployee,
  submission: SubmissionDetailData,
) {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    dateOfBirth: toDateInput(employee.dateOfBirth),
    bsn: employee.bsn,
    street: employee.street,
    houseNumber: employee.houseNumber,
    postalCode: employee.postalCode,
    city: employee.city,
    email: employee.email,
    phone: employee.phone,
    iban: employee.iban,
    eventDate: toDateInput(submission.eventDate),
    department: submission.department ?? "",
    startTime: submission.startTime,
    endTime: submission.endTime,
    breakMinutes: String(submission.breakMinutes),
  };
}

type EditValues = ReturnType<typeof toEditValues>;

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value}</p>
    </div>
  );
}

function EditField({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0 space-y-0.5", className)}>
      <Label className="text-xs font-normal text-muted-foreground">
        {label}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

interface SubmissionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: SubmissionDetailEmployee | null;
  submission: SubmissionDetailData | null;
  loading?: boolean;
  onSaved?: (data: SubmissionDetailResponse) => void;
}

export function SubmissionDetailDialog({
  open,
  onOpenChange,
  employee,
  submission,
  loading = false,
  onSaved,
}: SubmissionDetailDialogProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<EditValues | null>(null);

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setSaving(false);
      setFormError(null);
      setFieldErrors({});
      setValues(null);
      return;
    }
    if (employee && submission) {
      setValues(toEditValues(employee, submission));
    }
  }, [open, employee, submission]);

  const payPreview = useMemo(() => {
    if (!values) return null;
    try {
      const hourlyRate = calculateHourlyRate(
        new Date(values.dateOfBirth),
        new Date(values.eventDate),
      );
      const totalHours = calculateTotalHours(
        values.startTime,
        values.endTime,
        Number(values.breakMinutes) || 0,
      );
      return {
        hourlyRate,
        totalHours,
        totalPay: calculateTotalPay(hourlyRate, totalHours),
        error: null as string | null,
      };
    } catch (error) {
      return {
        hourlyRate: 0,
        totalHours: 0,
        totalPay: 0,
        error: (error as Error).message,
      };
    }
  }, [values]);

  if (!loading && !submission) return null;

  function updateField<K extends keyof EditValues>(key: K, value: string) {
    setValues((current) => (current ? { ...current, [key]: value } : current));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSave() {
    if (!values || !submission) return;

    const parsed = submissionEditSchema.safeParse({
      ...values,
      breakMinutes: values.breakMinutes,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      setFormError("Controleer de gemarkeerde velden.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/dashboard/submissions/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as SubmissionDetailResponse & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "Opslaan mislukt");
      }
      onSaved?.(data);
      setEditing(false);
      toast.success("Inschrijving opgeslagen");
    } catch (error) {
      setFormError((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (saving) return;
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[92vh] overflow-y-auto sm:max-w-6xl",
          editing && "sm:max-w-7xl",
        )}
      >
        <DialogHeader>
          <DialogTitle>
            {editing ? "Inschrijving bewerken" : "Inschrijving bekijken"}
          </DialogTitle>
          <DialogDescription>
            {loading || !submission
              ? "Gegevens worden geladen…"
              : `${format(new Date(submission.eventDate), "d MMMM yyyy", {
                  locale: nl,
                })}${submission.department ? ` · ${submission.department}` : ""}`}
          </DialogDescription>
        </DialogHeader>

        {loading || !submission || !employee || !values ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {submission.editedAt && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-950">
                Bewerkt op{" "}
                {format(new Date(submission.editedAt), "d MMMM yyyy 'om' HH:mm", {
                  locale: nl,
                })}
                {submission.editedBy ? ` door ${submission.editedBy}` : ""}
              </div>
            )}

            <div className={cn(editing ? "space-y-3" : "space-y-5")}>
              {editing ? (
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                  <div className="space-y-3">
                    <section className="space-y-2">
                      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Persoonlijk
                      </h3>
                      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                        <EditField label="Voornaam" error={fieldErrors.firstName}>
                          <Input
                            className="h-8"
                            value={values.firstName}
                            onChange={(event) =>
                              updateField("firstName", event.target.value)
                            }
                            aria-invalid={!!fieldErrors.firstName}
                          />
                        </EditField>
                        <EditField label="Achternaam" error={fieldErrors.lastName}>
                          <Input
                            className="h-8"
                            value={values.lastName}
                            onChange={(event) =>
                              updateField("lastName", event.target.value)
                            }
                            aria-invalid={!!fieldErrors.lastName}
                          />
                        </EditField>
                        <EditField
                          label="Geboortedatum"
                          error={fieldErrors.dateOfBirth}
                        >
                          <Input
                            type="date"
                            className="h-8"
                            value={values.dateOfBirth}
                            onChange={(event) =>
                              updateField("dateOfBirth", event.target.value)
                            }
                            aria-invalid={!!fieldErrors.dateOfBirth}
                          />
                        </EditField>
                        <EditField label="BSN" error={fieldErrors.bsn}>
                          <Input
                            className="h-8"
                            inputMode="numeric"
                            maxLength={9}
                            value={values.bsn}
                            onChange={(event) =>
                              updateField("bsn", event.target.value)
                            }
                            aria-invalid={!!fieldErrors.bsn}
                          />
                        </EditField>
                      </div>
                    </section>

                    <section className="space-y-2">
                      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Adres & contact
                      </h3>
                      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                        <EditField label="Straat" error={fieldErrors.street}>
                          <Input
                            className="h-8"
                            value={values.street}
                            onChange={(event) =>
                              updateField("street", event.target.value)
                            }
                            aria-invalid={!!fieldErrors.street}
                          />
                        </EditField>
                        <EditField
                          label="Huisnummer"
                          error={fieldErrors.houseNumber}
                        >
                          <Input
                            className="h-8"
                            value={values.houseNumber}
                            onChange={(event) =>
                              updateField("houseNumber", event.target.value)
                            }
                            aria-invalid={!!fieldErrors.houseNumber}
                          />
                        </EditField>
                        <EditField label="Postcode" error={fieldErrors.postalCode}>
                          <Input
                            className="h-8"
                            value={values.postalCode}
                            onChange={(event) =>
                              updateField("postalCode", event.target.value)
                            }
                            aria-invalid={!!fieldErrors.postalCode}
                          />
                        </EditField>
                        <EditField label="Woonplaats" error={fieldErrors.city}>
                          <Input
                            className="h-8"
                            value={values.city}
                            onChange={(event) =>
                              updateField("city", event.target.value)
                            }
                            aria-invalid={!!fieldErrors.city}
                          />
                        </EditField>
                        <EditField label="E-mail" error={fieldErrors.email}>
                          <Input
                            type="email"
                            className="h-8"
                            value={values.email}
                            onChange={(event) =>
                              updateField("email", event.target.value)
                            }
                            aria-invalid={!!fieldErrors.email}
                          />
                        </EditField>
                        <EditField label="Telefoon" error={fieldErrors.phone}>
                          <Input
                            type="tel"
                            className="h-8"
                            value={values.phone}
                            onChange={(event) =>
                              updateField("phone", event.target.value)
                            }
                            aria-invalid={!!fieldErrors.phone}
                          />
                        </EditField>
                        <EditField
                          label="IBAN"
                          error={fieldErrors.iban}
                          className="col-span-2"
                        >
                          <Input
                            className="h-8"
                            value={values.iban}
                            onChange={(event) =>
                              updateField("iban", event.target.value)
                            }
                            aria-invalid={!!fieldErrors.iban}
                          />
                        </EditField>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Persoonsgegevens gelden voor alle inschrijvingen van
                        deze medewerker.
                      </p>
                    </section>
                  </div>

                  <div className="space-y-3">
                    <section className="space-y-2">
                      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Dienst
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <EditField label="Datum" error={fieldErrors.eventDate}>
                          <Input
                            type="date"
                            className="h-8"
                            value={values.eventDate}
                            onChange={(event) =>
                              updateField("eventDate", event.target.value)
                            }
                            aria-invalid={!!fieldErrors.eventDate}
                          />
                        </EditField>
                        <EditField
                          label="Afdeling"
                          error={fieldErrors.department}
                        >
                          <DepartmentSelect
                            value={values.department}
                            onChange={(value) =>
                              updateField("department", value)
                            }
                            aria-invalid={!!fieldErrors.department}
                            className="h-8 data-[size=default]:h-8"
                          />
                        </EditField>
                        <EditField
                          label="Starttijd"
                          error={fieldErrors.startTime}
                        >
                          <Input
                            type="time"
                            className="h-8"
                            value={values.startTime}
                            onChange={(event) =>
                              updateField("startTime", event.target.value)
                            }
                            aria-invalid={!!fieldErrors.startTime}
                          />
                        </EditField>
                        <EditField label="Eindtijd" error={fieldErrors.endTime}>
                          <Input
                            type="time"
                            className="h-8"
                            value={values.endTime}
                            onChange={(event) =>
                              updateField("endTime", event.target.value)
                            }
                            aria-invalid={!!fieldErrors.endTime}
                          />
                        </EditField>
                        <EditField
                          label="Pauze (min)"
                          error={fieldErrors.breakMinutes}
                          className="col-span-2"
                        >
                          <Input
                            type="number"
                            min={0}
                            className="h-8"
                            value={values.breakMinutes}
                            onChange={(event) =>
                              updateField("breakMinutes", event.target.value)
                            }
                            aria-invalid={!!fieldErrors.breakMinutes}
                          />
                        </EditField>
                      </div>
                      <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                        <Field
                          label="Uurloon"
                          value={formatCurrency(payPreview?.hourlyRate ?? 0)}
                        />
                        <Field
                          label="Uren"
                          value={(payPreview?.totalHours ?? 0).toFixed(1)}
                        />
                        <Field
                          label="Totaal"
                          value={formatCurrency(payPreview?.totalPay ?? 0)}
                        />
                      </div>
                      {payPreview?.error && (
                        <p className="text-xs text-destructive">
                          {payPreview.error}
                        </p>
                      )}
                    </section>

                    {submission.signatureData && (
                      <section className="space-y-1">
                        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          Handtekening
                        </h3>
                        <div className="rounded-lg border bg-white px-2 py-1">
                          <img
                            src={submission.signatureData}
                            alt="Handtekening"
                            className="mx-auto max-h-14 w-auto"
                          />
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Persoonlijk
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="Voornaam" value={employee.firstName} />
                      <Field label="Achternaam" value={employee.lastName} />
                      <Field
                        label="Geboortedatum"
                        value={format(
                          new Date(employee.dateOfBirth),
                          "d MMMM yyyy",
                          { locale: nl },
                        )}
                      />
                      <Field label="BSN" value={employee.bsn} />
                    </div>
                  </section>

                  <Separator />

                  <section className="space-y-3">
                    <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Adres & contact
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                      <Field
                        label="Datum"
                        value={format(
                          new Date(submission.eventDate),
                          "dd-MM-yyyy",
                        )}
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
                    </div>
                    <div className="grid grid-cols-3 gap-3 rounded-lg border bg-muted/40 p-3">
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
                            className="mx-auto max-h-24 w-auto"
                          />
                        </div>
                      </section>
                    </>
                  )}
                </>
              )}

              <p className="text-xs text-muted-foreground">
                Ingediend{" "}
                {format(new Date(submission.createdAt), "d MMMM yyyy, HH:mm", {
                  locale: nl,
                })}
              </p>

              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
            </div>

            <DialogFooter>
              {editing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => {
                      setEditing(false);
                      setFormError(null);
                      setFieldErrors({});
                      setValues(toEditValues(employee, submission));
                    }}
                  >
                    <X className="size-4" />
                    Annuleren
                  </Button>
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSave()}
                  >
                    {saving ? "Opslaan…" : "Opslaan"}
                  </Button>
                </>
              ) : (
                <>
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
                  <Button type="button" onClick={() => setEditing(true)}>
                    <Pencil className="size-4" />
                    Bewerken
                  </Button>
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
