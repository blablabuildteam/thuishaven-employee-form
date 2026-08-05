"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
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
import { SignaturePad } from "@/components/form/signature-pad";
import { AddressAutocomplete } from "@/components/form/address-autocomplete";
import { FormDatePicker } from "@/components/form/form-date-picker";
import { IbanField } from "@/components/form/iban-field";
import type { ParsedAddress } from "@/lib/address";

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
    control,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5" noValidate>
      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input type="text" tabIndex={-1} autoComplete="off" {...register("honeypot")} />
      </div>

      {/* Persoonlijke gegevens */}
      <FormSection title="Persoonlijke gegevens">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Voornaam" error={errors.firstName?.message}>
            <Input placeholder="Jan" {...register("firstName")} />
          </FormField>
          <FormField label="Achternaam" error={errors.lastName?.message}>
            <Input placeholder="De Vries" {...register("lastName")} />
          </FormField>
        </div>
        <FormField label="Geboortedatum" error={errors.dateOfBirth?.message}>
          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <FormDatePicker
                id="dateOfBirth"
                variant="birth"
                placeholder="Kies geboortedatum"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                aria-invalid={!!errors.dateOfBirth}
              />
            )}
          />
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
      </FormSection>

      {/* Adres */}
      <FormSection title="Adres">
        <AddressAutocomplete
          onAddressSelect={(address: ParsedAddress) => {
            if (address.street) {
              setValue("street", address.street, { shouldValidate: true, shouldDirty: true });
            }
            if (address.houseNumber) {
              setValue("houseNumber", address.houseNumber, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }
            if (address.postalCode) {
              setValue("postalCode", address.postalCode, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }
            if (address.city) {
              setValue("city", address.city, { shouldValidate: true, shouldDirty: true });
            }
          }}
        />
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
      </FormSection>

      {/* Contact */}
      <FormSection title="Contactgegevens">
        <FormField label="Telefoonnummer" error={errors.phone?.message}>
          <Input type="tel" placeholder="06 12345678" {...register("phone")} />
        </FormField>
        <FormField label="E-mailadres" error={errors.email?.message}>
          <Input type="email" placeholder="jan@voorbeeld.nl" {...register("email")} />
        </FormField>
      </FormSection>

      {/* Bank */}
      <FormSection title="Bankgegevens">
        <FormField label="IBAN (Bankrekeningnummer)" error={errors.iban?.message}>
          <Controller
            name="iban"
            control={control}
            render={({ field }) => (
              <IbanField
                id="iban"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                aria-invalid={!!errors.iban}
              />
            )}
          />
        </FormField>
      </FormSection>

      {/* Event / Dienst */}
      <FormSection title="Dienst / Project">
        <FormField label="Datum project" error={errors.eventDate?.message}>
          <Controller
            name="eventDate"
            control={control}
            render={({ field }) => (
              <FormDatePicker
                id="eventDate"
                variant="event"
                placeholder="Kies projectdatum"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                aria-invalid={!!errors.eventDate}
              />
            )}
          />
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
      </FormSection>

      {/* Verloning */}
      <FormSection title="Verloning">
        <div className="space-y-2 border border-th-ink/15 bg-th-cream p-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex size-5 items-center justify-center border text-xs ${
                payInfo.category === "18/19"
                  ? "border-th-ink bg-th-ink text-white"
                  : "border-th-ink/40 bg-white"
              }`}
            >
              {payInfo.category === "18/19" && "✓"}
            </span>
            <span className="text-sm">18/19 jaar = €13,25 per uur</span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`flex size-5 items-center justify-center border text-xs ${
                payInfo.category === "20+"
                  ? "border-th-ink bg-th-ink text-white"
                  : "border-th-ink/40 bg-white"
              }`}
            >
              {payInfo.category === "20+" && "✓"}
            </span>
            <span className="text-sm">≥ 20 jaar = €14,75 per uur</span>
          </div>
        </div>

        {payInfo.category && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="border border-th-ink bg-white p-3">
              <p className="th-label text-muted-foreground">Uurloon</p>
              <p className="th-heading mt-1 text-lg">{formatCurrency(payInfo.hourlyRate)}</p>
            </div>
            <div className="border border-th-ink bg-white p-3">
              <p className="th-label text-muted-foreground">Uren</p>
              <p className="th-heading mt-1 text-lg">{payInfo.totalHours.toFixed(2)}</p>
            </div>
            <div className="border border-th-ink bg-accent/30 p-3">
              <p className="th-label text-muted-foreground">Totaal</p>
              <p className="th-heading mt-1 text-lg">{formatCurrency(payInfo.totalPay)}</p>
            </div>
          </div>
        )}
      </FormSection>

      {/* Disclaimer */}
      <FormSection title="Voorwaarden">
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="th-label mb-1 text-foreground">Aansprakelijkheid</p>
            <p>
              Thuishaven is niet aansprakelijk voor schade aan of verlies van persoonlijke
              eigendommen tijdens het werk. Medewerkers zijn zelf verantwoordelijk voor hun
              bezittingen.
            </p>
          </div>
          <div>
            <p className="th-label mb-1 text-foreground">Belastingdienst</p>
            <p>
              Je wordt uitbetaald als freelancer. Je bent zelf verantwoordelijk voor het
              opgeven van deze inkomsten bij de Belastingdienst.
            </p>
          </div>
          <div className="border border-destructive bg-destructive/5 p-3">
            <p className="th-heading text-sm tracking-[0.12em] text-destructive">Let op!!</p>
            <p className="mt-1 text-destructive/90">
              Je ontvangt geen loonstrook. Bewaar dit formulier als bewijs van je gewerkte
              uren en betaling.
            </p>
          </div>
        </div>
      </FormSection>

      {/* Handtekening */}
      <FormSection title="Handtekening">
        <p className="text-sm text-muted-foreground">
          Door hieronder te tekenen ga je akkoord met bovenstaande voorwaarden.
        </p>
        <SignaturePad
          onChange={(data) => setValue("signatureData", data, { shouldValidate: true })}
        />
        {errors.signatureData && (
          <p className="text-sm text-destructive">{errors.signatureData.message}</p>
        )}
      </FormSection>

      {/* Submit */}
      {errors.root && (
        <div className="border border-destructive bg-destructive/5 p-4 text-center text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      <button type="submit" className="th-chevron-btn" disabled={isSubmitting}>
        {isSubmitting ? "Verzenden…" : "Formulier verzenden"}
      </button>
    </form>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="th-panel gap-0 rounded-none py-0 ring-0">
      <CardHeader className="border-b border-th-ink/10 px-4 py-3 sm:px-5">
        <CardTitle className="th-section-title">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">{children}</CardContent>
    </Card>
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
      <Label className="th-label">{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
