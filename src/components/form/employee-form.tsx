"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { formSchema, type FormData } from "@/lib/validations";
import {
  calculateHourlyRate,
  calculateTotalHours,
  calculateTotalPay,
  getAgeCategory,
} from "@/lib/pay-calculation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SignaturePad } from "@/components/form/signature-pad";

interface PayInfo {
  category: "18/19" | "20+" | null;
  hourlyRate: number;
  totalHours: number;
  totalPay: number;
}

export function EmployeeForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [payInfo, setPayInfo] = useState<PayInfo>({
    category: null,
    hourlyRate: 0,
    totalHours: 0,
    totalPay: 0,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema) as Resolver<FormData>,
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      bsn: "",
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      phone: "",
      email: "",
      iban: "",
      eventDate: "",
      department: "",
      startTime: "",
      endTime: "",
      breakMinutes: 0,
      signatureData: "",
      honeypot: "",
    },
  });

  const dateOfBirth = watch("dateOfBirth");
  const eventDate = watch("eventDate");
  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const breakMinutes = watch("breakMinutes");

  useEffect(() => {
    if (!dateOfBirth || !eventDate) {
      setPayInfo({ category: null, hourlyRate: 0, totalHours: 0, totalPay: 0 });
      return;
    }

    try {
      const dob = new Date(dateOfBirth);
      const event = new Date(eventDate);
      const category = getAgeCategory(dob, event);
      const hourlyRate = calculateHourlyRate(dob, event);

      let totalHours = 0;
      if (startTime && endTime && /^\d{2}:\d{2}$/.test(startTime) && /^\d{2}:\d{2}$/.test(endTime)) {
        totalHours = calculateTotalHours(startTime, endTime, breakMinutes || 0);
      }

      const totalPay = calculateTotalPay(hourlyRate, totalHours);
      setPayInfo({ category, hourlyRate, totalHours, totalPay });
    } catch {
      setPayInfo({ category: null, hourlyRate: 0, totalHours: 0, totalPay: 0 });
    }
  }, [dateOfBirth, eventDate, startTime, endTime, breakMinutes]);

  const handleBsnBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement>) => {
      const bsn = e.target.value;
      if (!/^\d{9}$/.test(bsn)) return;

      setIsLookingUp(true);
      try {
        const [lookupRes, statusRes] = await Promise.all([
          fetch(`/api/form/lookup?bsn=${bsn}`),
          fetch(`/api/form/check-status?bsn=${bsn}`),
        ]);

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.blocked) {
            router.push("/form/blocked");
            return;
          }
        }

        if (lookupRes.ok) {
          const data = await lookupRes.json();
          if (data.employee) {
            const fields = [
              "firstName", "lastName", "dateOfBirth", "street",
              "houseNumber", "postalCode", "city", "phone", "email", "iban",
            ] as const;
            for (const field of fields) {
              if (data.employee[field]) {
                setValue(field, data.employee[field], { shouldValidate: true });
              }
            }
          }
        }
      } catch {
        // Lookup failed silently — user can still fill in manually
      } finally {
        setIsLookingUp(false);
      }
    },
    [router, setValue],
  );

  const onSubmit = async (data: FormData) => {
    if (data.honeypot) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/form/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        if (errorData?.blocked) {
          router.push("/form/blocked");
          return;
        }
        setError("root", {
          message: errorData?.message || "Er is iets misgegaan. Probeer het opnieuw.",
        });
        return;
      }

      router.push("/form/success");
    } catch {
      setError("root", {
        message: "Kan geen verbinding maken. Controleer je internetverbinding.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input type="text" tabIndex={-1} autoComplete="off" {...register("honeypot")} />
      </div>

      {/* Persoonlijke gegevens */}
      <Card>
        <CardHeader>
          <CardTitle>Persoonlijke gegevens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Voornaam" error={errors.firstName?.message}>
              <Input placeholder="Jan" {...register("firstName")} />
            </FormField>
            <FormField label="Achternaam" error={errors.lastName?.message}>
              <Input placeholder="De Vries" {...register("lastName")} />
            </FormField>
          </div>
          <FormField label="Geboortedatum" error={errors.dateOfBirth?.message}>
            <Input type="date" {...register("dateOfBirth")} />
          </FormField>
          <FormField label="BSN / Sofinummer" error={errors.bsn?.message}>
            <div className="relative">
              <Input
                placeholder="123456789"
                maxLength={9}
                inputMode="numeric"
                {...register("bsn")}
                onBlur={(e) => {
                  register("bsn").onBlur(e);
                  handleBsnBlur(e);
                }}
              />
              {isLookingUp && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  Zoeken…
                </span>
              )}
            </div>
          </FormField>
        </CardContent>
      </Card>

      {/* Adres */}
      <Card>
        <CardHeader>
          <CardTitle>Adres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
            <FormField label="Straat" error={errors.street?.message}>
              <Input placeholder="Keizersgracht" {...register("street")} />
            </FormField>
            <FormField label="Huisnummer" error={errors.houseNumber?.message}>
              <Input placeholder="42" className="sm:w-24" {...register("houseNumber")} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Postcode" error={errors.postalCode?.message}>
              <Input placeholder="1234 AB" maxLength={7} {...register("postalCode")} />
            </FormField>
            <FormField label="Woonplaats" error={errors.city?.message}>
              <Input placeholder="Amsterdam" {...register("city")} />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Contactgegevens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Telefoonnummer" error={errors.phone?.message}>
            <Input type="tel" placeholder="06 12345678" {...register("phone")} />
          </FormField>
          <FormField label="E-mailadres" error={errors.email?.message}>
            <Input type="email" placeholder="jan@voorbeeld.nl" {...register("email")} />
          </FormField>
        </CardContent>
      </Card>

      {/* Bank */}
      <Card>
        <CardHeader>
          <CardTitle>Bankgegevens</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField label="IBAN (Bankrekeningnummer)" error={errors.iban?.message}>
            <Input placeholder="NL91 ABNA 0417 1643 00" {...register("iban")} />
          </FormField>
        </CardContent>
      </Card>

      {/* Event / Dienst */}
      <Card>
        <CardHeader>
          <CardTitle>Dienst / Project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Datum project" error={errors.eventDate?.message}>
            <Input type="date" {...register("eventDate")} />
          </FormField>
          <FormField label="Afdeling (optioneel)" error={errors.department?.message}>
            <Input placeholder="Bar, garderobe, etc." {...register("department")} />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Starttijd" error={errors.startTime?.message}>
              <Input type="time" {...register("startTime")} />
            </FormField>
            <FormField label="Eindtijd" error={errors.endTime?.message}>
              <Input type="time" {...register("endTime")} />
            </FormField>
            <FormField label="Pauze (minuten)" error={errors.breakMinutes?.message}>
              <Input
                type="number"
                min={0}
                placeholder="30"
                {...register("breakMinutes", { valueAsNumber: true })}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Verloning */}
      <Card>
        <CardHeader>
          <CardTitle>Verloning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-lg bg-muted p-4">
            <div className="flex items-center gap-3">
              <span
                className={`flex size-5 items-center justify-center rounded border text-xs ${
                  payInfo.category === "18/19"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input"
                }`}
              >
                {payInfo.category === "18/19" && "✓"}
              </span>
              <span className="text-sm">18/19 jaar = €13,25 per uur</span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`flex size-5 items-center justify-center rounded border text-xs ${
                  payInfo.category === "20+"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input"
                }`}
              >
                {payInfo.category === "20+" && "✓"}
              </span>
              <span className="text-sm">≥ 20 jaar = €14,75 per uur</span>
            </div>
          </div>

          {payInfo.category && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Uurloon</p>
                <p className="text-lg font-semibold">{formatCurrency(payInfo.hourlyRate)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Uren</p>
                <p className="text-lg font-semibold">{payInfo.totalHours.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Totaal</p>
                <p className="text-lg font-semibold">{formatCurrency(payInfo.totalPay)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card>
        <CardHeader>
          <CardTitle>Voorwaarden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Aansprakelijkheid</p>
            <p>
              Thuishaven is niet aansprakelijk voor schade aan of verlies van persoonlijke
              eigendommen tijdens het werk. Medewerkers zijn zelf verantwoordelijk voor hun
              bezittingen.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Belastingdienst</p>
            <p>
              Je wordt uitbetaald als freelancer. Je bent zelf verantwoordelijk voor het
              opgeven van deze inkomsten bij de Belastingdienst.
            </p>
          </div>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="font-semibold text-destructive">LET OP!!</p>
            <p className="text-destructive/80">
              Je ontvangt geen loonstrook. Bewaar dit formulier als bewijs van je gewerkte
              uren en betaling.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Handtekening */}
      <Card>
        <CardHeader>
          <CardTitle>Handtekening</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Door hieronder te tekenen ga je akkoord met bovenstaande voorwaarden.
          </p>
          <SignaturePad
            onChange={(data) => setValue("signatureData", data, { shouldValidate: true })}
          />
          {errors.signatureData && (
            <p className="text-sm text-destructive">{errors.signatureData.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      {errors.root && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full text-base"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Verzenden…" : "Formulier verzenden"}
      </Button>
    </form>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
