"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  formSchema,
  isDienstDateValid,
  type FormData as EmployeeFormValues,
} from "@/lib/validations";
import {
  idDocumentErrorMessage,
  validateIdDocumentFile,
} from "@/lib/id-document";
import {
  calculateHourlyRate,
  calculateTotalHours,
  calculateTotalPay,
  getAgeCategory,
  RATE_18_19,
  RATE_20_PLUS,
} from "@/lib/pay-calculation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/form/signature-pad";
import { AddressAutocomplete } from "@/components/form/address-autocomplete";
import { FormDatePicker } from "@/components/form/form-date-picker";
import { IbanField } from "@/components/form/iban-field";
import { IdDocumentUpload } from "@/components/form/id-document-upload";
import type { ParsedAddress } from "@/lib/address";
import { DISCLAIMER } from "@/lib/disclaimer";
import { validateIban } from "@/lib/iban";
import { cn } from "@/lib/utils";
import { CheckCircle2, Pencil } from "lucide-react";

type UnlockableField = "phone" | "email" | "iban";

const INITIAL_UNLOCKED: Record<UnlockableField, boolean> = {
  phone: false,
  email: false,
  iban: false,
};

interface PayInfo {
  category: "18/19" | "20+" | null;
  hourlyRate: number;
  totalHours: number;
  totalPay: number;
}

/** Personal fields that are locked once a returning employee is recognised by BSN. */
const KNOWN_EMPLOYEE_FIELDS = [
  "firstName",
  "lastName",
  "dateOfBirth",
  "street",
  "houseNumber",
  "postalCode",
  "city",
  "phone",
  "email",
  "iban",
] as const;

const RATE_18_19_LABEL = RATE_18_19.toFixed(2).replace(".", ",");
const RATE_20_PLUS_LABEL = RATE_20_PLUS.toFixed(2).replace(".", ",");

export function EmployeeForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isReturningEmployee, setIsReturningEmployee] = useState(false);
  const [hasIdentityDocument, setHasIdentityDocument] = useState(false);
  const [matchedBsn, setMatchedBsn] = useState<string | null>(null);
  const [unlockedFields, setUnlockedFields] =
    useState<Record<UnlockableField, boolean>>(INITIAL_UNLOCKED);
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
  const [idDocumentError, setIdDocumentError] = useState<string | undefined>();
  const [signaturePadKey, setSignaturePadKey] = useState(0);
  const [payInfo, setPayInfo] = useState<PayInfo>({
    category: null,
    hourlyRate: 0,
    totalHours: 0,
    totalPay: 0,
  });
  const lookupInFlightRef = useRef<string | null>(null);
  const currentBsnRef = useRef("");

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(formSchema) as Resolver<EmployeeFormValues>,
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

  const values = watch();
  const dateOfBirth = values.dateOfBirth;
  const eventDate = values.eventDate;
  const startTime = values.startTime;
  const endTime = values.endTime;
  const breakMinutes = values.breakMinutes;

  const filled = {
    firstName: hasText(values.firstName),
    lastName: hasText(values.lastName),
    dateOfBirth: hasText(values.dateOfBirth),
    bsn: /^\d{9}$/.test(values.bsn ?? ""),
    street: hasText(values.street),
    houseNumber: hasText(values.houseNumber),
    postalCode: /^\d{4}\s?[A-Za-z]{2}$/.test(values.postalCode ?? ""),
    city: hasText(values.city),
    phone: hasText(values.phone),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email ?? ""),
    iban: validateIban(values.iban ?? ""),
    eventDate: isDienstDateValid(values.eventDate),
    department: hasText(values.department),
    startTime: /^\d{2}:\d{2}$/.test(values.startTime ?? ""),
    endTime: /^\d{2}:\d{2}$/.test(values.endTime ?? ""),
    breakMinutes:
      Boolean(dirtyFields.breakMinutes) ||
      (/^\d{2}:\d{2}$/.test(values.startTime ?? "") &&
        /^\d{2}:\d{2}$/.test(values.endTime ?? "")),
    signatureData: hasText(values.signatureData),
  };

  const sectionComplete = {
    personal:
      filled.firstName &&
      filled.lastName &&
      filled.dateOfBirth &&
      filled.bsn,
    address:
      filled.street && filled.houseNumber && filled.postalCode && filled.city,
    contact: filled.phone && filled.email,
    bank: filled.iban,
    service:
      filled.eventDate &&
      filled.department &&
      filled.startTime &&
      filled.endTime &&
      filled.breakMinutes,
    pay: Boolean(payInfo.category && payInfo.totalHours > 0),
    idDocument: Boolean(idDocumentFile) || hasIdentityDocument,
    signature: filled.signatureData,
  };

  const needsIdDocument = !hasIdentityDocument;

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

  const clearKnownEmployeeFields = useCallback(() => {
    for (const field of KNOWN_EMPLOYEE_FIELDS) {
      setValue(field, "", { shouldValidate: false, shouldDirty: false });
    }
  }, [setValue]);

  const clearReturningState = useCallback(() => {
    setMatchedBsn(null);
    setIsReturningEmployee(false);
    setHasIdentityDocument(false);
    setUnlockedFields(INITIAL_UNLOCKED);
  }, []);

  // When an ID is already on file, clear any staged upload.
  useEffect(() => {
    if (hasIdentityDocument) {
      setIdDocumentFile(null);
      setIdDocumentError(undefined);
    }
  }, [hasIdentityDocument]);

  const unlockField = useCallback((field: UnlockableField) => {
    setUnlockedFields((prev) => ({ ...prev, [field]: true }));
    requestAnimationFrame(() => {
      document.getElementById(field)?.focus();
    });
  }, []);

  const lookupBsn = useCallback(
    async (bsn: string) => {
      if (!/^\d{9}$/.test(bsn)) return;
      if (bsn === matchedBsn) return;
      if (lookupInFlightRef.current === bsn) return;

      lookupInFlightRef.current = bsn;
      setIsLookingUp(true);
      try {
        const [lookupRes, statusRes] = await Promise.all([
          fetch(`/api/form/lookup?bsn=${bsn}`),
          fetch(`/api/form/check-status?bsn=${bsn}`),
        ]);

        // Ignore stale responses if the user kept typing
        if (currentBsnRef.current !== bsn) return;

        if (lookupRes.ok) {
          const data = await lookupRes.json();
          if (data.employee) {
            for (const field of KNOWN_EMPLOYEE_FIELDS) {
              if (data.employee[field]) {
                setValue(field, data.employee[field], { shouldValidate: true });
              }
            }
            setMatchedBsn(bsn);
            setIsReturningEmployee(true);
            setHasIdentityDocument(Boolean(data.hasIdentityDocument));
            setUnlockedFields(INITIAL_UNLOCKED);
          } else {
            if (matchedBsn) {
              clearKnownEmployeeFields();
            }
            clearReturningState();
          }
        }
      } catch {
        // Lookup failed silently — user can still fill in manually
      } finally {
        if (lookupInFlightRef.current === bsn) {
          lookupInFlightRef.current = null;
        }
        if (currentBsnRef.current === bsn) {
          setIsLookingUp(false);
        }
      }
    },
    [setValue, matchedBsn, clearKnownEmployeeFields, clearReturningState],
  );

  const handleBsnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const bsn = e.target.value;
      currentBsnRef.current = bsn;
      if (matchedBsn && bsn !== matchedBsn) {
        clearReturningState();
      }
      if (/^\d{9}$/.test(bsn)) {
        void lookupBsn(bsn);
      } else {
        lookupInFlightRef.current = null;
        setIsLookingUp(false);
      }
    },
    [matchedBsn, clearReturningState, lookupBsn],
  );

  const handleBsnBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const bsn = e.target.value;
      if (!/^\d{9}$/.test(bsn)) {
        if (matchedBsn) {
          clearKnownEmployeeFields();
          clearReturningState();
        }
        return;
      }
      void lookupBsn(bsn);
    },
    [matchedBsn, clearKnownEmployeeFields, clearReturningState, lookupBsn],
  );

  const phoneLocked = isReturningEmployee && !unlockedFields.phone;
  const emailLocked = isReturningEmployee && !unlockedFields.email;
  const ibanLocked = isReturningEmployee && !unlockedFields.iban;

  const onSubmit = async (data: EmployeeFormValues) => {
    if (data.honeypot) return;

    if (needsIdDocument) {
      const validation = validateIdDocumentFile(idDocumentFile);
      if (!validation.ok) {
        setIdDocumentError(idDocumentErrorMessage(validation.error));
        setError("root", {
          message: idDocumentErrorMessage(validation.error),
        });
        return;
      }
      setIdDocumentError(undefined);
    }

    setIsSubmitting(true);
    try {
      const body = new window.FormData();
      body.append("payload", JSON.stringify(data));
      if (needsIdDocument && idDocumentFile) {
        body.append("idDocument", idDocumentFile);
      }

      const res = await fetch("/api/form/submit", {
        method: "POST",
        body,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const message =
          errorData?.error ||
          errorData?.message ||
          "Er is iets misgegaan. Probeer het opnieuw.";
        if (
          typeof message === "string" &&
          message.toLowerCase().includes("paspoort")
        ) {
          setIdDocumentError(message);
        }
        setError("root", { message });
        return;
      }

      const result = (await res.json()) as {
        submissionId?: string;
        downloadToken?: string;
      };

      if (result.submissionId && result.downloadToken) {
        const params = new URLSearchParams({
          id: result.submissionId,
          token: result.downloadToken,
        });
        router.push(`/form/success?${params.toString()}`);
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

  const prefillTestData =
    process.env.NODE_ENV === "development"
      ? async () => {
          const { DEV_TEST_FORM_DATA } = await import("@/lib/dev-test-form-data");
          reset(DEV_TEST_FORM_DATA, { keepDefaultValues: true });
          setSignaturePadKey((key) => key + 1);
        }
      : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5" noValidate>
      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input type="text" tabIndex={-1} autoComplete="off" {...register("honeypot")} />
      </div>

      {prefillTestData && (
        <div className="border border-dashed border-th-ink/30 bg-th-cream/80 px-3 py-2 text-center">
          <button
            type="button"
            onClick={() => {
              void prefillTestData();
              clearReturningState();
            }}
            className="th-label text-xs tracking-[0.14em] text-th-muted underline-offset-4 hover:underline"
          >
            Prefill testdata (alleen lokaal)
          </button>
        </div>
      )}

      {isReturningEmployee && (
        <div className="border border-th-green bg-th-green-light/50 px-4 py-3 text-sm text-foreground">
          Gegevens gevonden. Persoonlijke gegevens zijn ingevuld en vastgezet — vul alleen de
          dienstdetails en handtekening in.
        </div>
      )}

      {/* Persoonlijke gegevens — BSN first for returning-employee lookup */}
      <FormSection title="Persoonlijke gegevens" complete={sectionComplete.personal}>
        <FormField label="BSN / Sofinummer" error={errors.bsn?.message} filled={filled.bsn}>
          <div className="relative">
            <Input
              placeholder="123456789"
              maxLength={9}
              inputMode="numeric"
              {...register("bsn", {
                onChange: handleBsnChange,
                onBlur: (e) => {
                  void handleBsnBlur(e);
                },
              })}
            />
            {isLookingUp && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                Zoeken…
              </span>
            )}
          </div>
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Voornaam" error={errors.firstName?.message} filled={filled.firstName}>
            <Input
              placeholder="Jan"
              disabled={isReturningEmployee}
              {...register("firstName")}
            />
          </FormField>
          <FormField label="Achternaam" error={errors.lastName?.message} filled={filled.lastName}>
            <Input
              placeholder="De Vries"
              disabled={isReturningEmployee}
              {...register("lastName")}
            />
          </FormField>
        </div>
        <FormField
          label="Geboortedatum"
          error={errors.dateOfBirth?.message}
          filled={filled.dateOfBirth}
        >
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
                complete={filled.dateOfBirth}
                disabled={isReturningEmployee}
              />
            )}
          />
        </FormField>
      </FormSection>

      {/* Adres */}
      <FormSection title="Adres" complete={sectionComplete.address}>
        {!isReturningEmployee && (
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
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
          <FormField label="Straat" error={errors.street?.message} filled={filled.street}>
            <Input
              placeholder="Keizersgracht"
              disabled={isReturningEmployee}
              {...register("street")}
            />
          </FormField>
          <FormField
            label="Huisnummer"
            error={errors.houseNumber?.message}
            filled={filled.houseNumber}
          >
            <Input
              placeholder="42"
              className="sm:w-24"
              disabled={isReturningEmployee}
              {...register("houseNumber")}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Postcode" error={errors.postalCode?.message} filled={filled.postalCode}>
            <Input
              placeholder="1234 AB"
              maxLength={7}
              disabled={isReturningEmployee}
              {...register("postalCode")}
            />
          </FormField>
          <FormField label="Woonplaats" error={errors.city?.message} filled={filled.city}>
            <Input
              placeholder="Amsterdam"
              disabled={isReturningEmployee}
              {...register("city")}
            />
          </FormField>
        </div>
      </FormSection>

      {/* Contact */}
      <FormSection title="Contactgegevens" complete={sectionComplete.contact}>
        <FormField
          label="Telefoonnummer"
          error={errors.phone?.message}
          filled={filled.phone}
          action={
            phoneLocked ? (
              <EditFieldButton
                label="Telefoonnummer bewerken"
                onClick={() => unlockField("phone")}
              />
            ) : undefined
          }
        >
          <Input
            id="phone"
            type="tel"
            placeholder="06 12345678"
            disabled={phoneLocked}
            {...register("phone")}
          />
        </FormField>
        <FormField
          label="E-mailadres"
          error={errors.email?.message}
          filled={filled.email}
          action={
            emailLocked ? (
              <EditFieldButton
                label="E-mailadres bewerken"
                onClick={() => unlockField("email")}
              />
            ) : undefined
          }
        >
          <Input
            id="email"
            type="email"
            placeholder="jan@voorbeeld.nl"
            disabled={emailLocked}
            {...register("email")}
          />
        </FormField>
      </FormSection>

      {/* Bank */}
      <FormSection title="Bankgegevens" complete={sectionComplete.bank}>
        <FormField
          label="IBAN (Bankrekeningnummer)"
          error={errors.iban?.message}
          filled={filled.iban}
          action={
            ibanLocked ? (
              <EditFieldButton
                label="IBAN bewerken"
                onClick={() => unlockField("iban")}
              />
            ) : undefined
          }
        >
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
                disabled={ibanLocked}
              />
            )}
          />
        </FormField>
      </FormSection>

      {/* Event / Dienst */}
      <FormSection title="Dienst / Project" complete={sectionComplete.service}>
        <FormField
          label="Datum dienst"
          error={errors.eventDate?.message}
          filled={filled.eventDate}
        >
          <Controller
            name="eventDate"
            control={control}
            render={({ field }) => (
              <FormDatePicker
                id="eventDate"
                variant="event"
                placeholder="Kies dienstdatum"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                aria-invalid={!!errors.eventDate}
                complete={filled.eventDate}
              />
            )}
          />
        </FormField>
        <FormField label="Afdeling" error={errors.department?.message} filled={filled.department}>
          <Input placeholder="Bar, garderobe, etc." {...register("department")} />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Starttijd" error={errors.startTime?.message} filled={filled.startTime}>
            <Input type="time" {...register("startTime")} />
          </FormField>
          <FormField label="Eindtijd" error={errors.endTime?.message} filled={filled.endTime}>
            <Input type="time" {...register("endTime")} />
          </FormField>
          <FormField
            label="Pauze (minuten)"
            error={errors.breakMinutes?.message}
            filled={filled.breakMinutes}
          >
            <Input
              type="number"
              min={0}
              placeholder="30"
              {...register("breakMinutes", { valueAsNumber: true })}
            />
          </FormField>
        </div>
      </FormSection>

      {/* Verloning — rate is auto-calculated from DOB + event date */}
      <FormSection title="Verloning" complete={sectionComplete.pay}>
        <fieldset
          className={cn(
            "space-y-3 border p-4",
            sectionComplete.pay
              ? "border-th-green/40 bg-th-green-light/40"
              : "border-th-ink/15 bg-th-cream",
          )}
        >
          <legend className="sr-only">Uurloon categorie</legend>
          <p className="text-xs text-muted-foreground">
            Wordt automatisch bepaald op basis van geboortedatum en dienstdatum.
            {!payInfo.category &&
              " Vul eerst geboortedatum en dienstdatum in."}
          </p>
          <label className="flex cursor-default items-center gap-3 text-sm opacity-90">
            <input
              type="radio"
              name="payCategory"
              checked={payInfo.category === "18/19"}
              onChange={() => {}}
              disabled
              className="size-4 accent-th-ink disabled:opacity-100"
              aria-label={`18/19 jaar = €${RATE_18_19_LABEL} per uur`}
            />
            <span>18/19 jaar = €{RATE_18_19_LABEL} per uur</span>
          </label>
          <label className="flex cursor-default items-center gap-3 text-sm opacity-90">
            <input
              type="radio"
              name="payCategory"
              checked={payInfo.category === "20+"}
              onChange={() => {}}
              disabled
              className="size-4 accent-th-ink disabled:opacity-100"
              aria-label={`20 jaar of ouder = €${RATE_20_PLUS_LABEL} per uur`}
            />
            <span>≥ 20 jaar = €{RATE_20_PLUS_LABEL} per uur</span>
          </label>
        </fieldset>

        {payInfo.category && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div
              className={cn(
                "border bg-white p-3",
                sectionComplete.pay ? "border-th-green" : "border-th-ink",
              )}
            >
              <p className="th-label text-muted-foreground">Uurloon</p>
              <p className="th-heading mt-1 text-lg">{formatCurrency(payInfo.hourlyRate)}</p>
            </div>
            <div
              className={cn(
                "border bg-white p-3",
                sectionComplete.pay ? "border-th-green" : "border-th-ink",
              )}
            >
              <p className="th-label text-muted-foreground">Uren</p>
              <p className="th-heading mt-1 text-lg">{payInfo.totalHours.toFixed(2)}</p>
            </div>
            <div
              className={cn(
                "border p-3",
                sectionComplete.pay
                  ? "border-th-green bg-th-green-light/50"
                  : "border-th-ink bg-accent/30",
              )}
            >
              <p className="th-label text-muted-foreground">Totaal</p>
              <p className="th-heading mt-1 text-lg">{formatCurrency(payInfo.totalPay)}</p>
            </div>
          </div>
        )}
      </FormSection>

      {/* Disclaimer — copy matches the paper IB47 form */}
      <FormSection title="Voorwaarden">
        <div className="space-y-4 text-sm leading-relaxed text-foreground/85">
          <div>
            <p className="mb-1 font-bold text-foreground">{DISCLAIMER.liabilityTitle}</p>
            <p>{DISCLAIMER.liability}</p>
          </div>
          <div>
            <p className="mb-1 font-bold text-foreground">{DISCLAIMER.taxTitle}</p>
            <p>{DISCLAIMER.tax}</p>
          </div>
          <div className="space-y-2">
            <p className="font-bold uppercase tracking-wide text-foreground">
              {DISCLAIMER.noPayslip}
            </p>
            <p>
              {DISCLAIMER.taxNote}{" "}
              <span className="font-bold text-destructive">{DISCLAIMER.idNote}</span>
            </p>
          </div>
        </div>
      </FormSection>

      {/* ID document — required until one is stored on the employee profile */}
      {needsIdDocument && (
        <FormSection
          title="Paspoort / ID-kaart"
          complete={sectionComplete.idDocument}
        >
          <IdDocumentUpload
            file={idDocumentFile}
            onChange={(file) => {
              setIdDocumentFile(file);
              if (file) setIdDocumentError(undefined);
            }}
            error={idDocumentError}
            complete={Boolean(idDocumentFile)}
          />
        </FormSection>
      )}

      {/* Handtekening */}
      <FormSection title="Handtekening" complete={sectionComplete.signature}>
        <p className="text-sm text-muted-foreground">
          Door hieronder te tekenen ga je akkoord met bovenstaande voorwaarden.
        </p>
        <SignaturePad
          key={signaturePadKey}
          complete={filled.signatureData}
          value={values.signatureData}
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

function hasText(value?: string | null) {
  return Boolean(value?.trim());
}

function FormSection({
  title,
  children,
  complete = false,
}: {
  title: string;
  children: React.ReactNode;
  complete?: boolean;
}) {
  return (
    <Card
      className={cn(
        "relative gap-0 rounded-none border py-0 ring-0 transition-colors",
        complete
          ? "border-th-green bg-th-green-light/35"
          : "border-th-ink bg-white",
      )}
    >
      {complete && (
        <CheckCircle2
          className="absolute top-3 right-3 size-5 text-th-green sm:top-3.5 sm:right-4"
          strokeWidth={2}
          aria-hidden
        />
      )}
      <CardHeader
        className={cn(
          "border-b px-4 py-3 sm:px-5",
          complete ? "border-th-green/25 pr-10 sm:pr-11" : "border-th-ink/10",
        )}
      >
        <CardTitle className="th-section-title">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">{children}</CardContent>
    </Card>
  );
}

function EditFieldButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex size-7 items-center justify-center text-th-muted transition-colors hover:text-th-ink"
      aria-label={label}
      title={label}
    >
      <Pencil className="size-3.5" strokeWidth={2} />
    </button>
  );
}

function FormField({
  label,
  error,
  filled = false,
  action,
  children,
}: {
  label: string;
  error?: string;
  filled?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "space-y-1.5",
        filled &&
          !error &&
          "[&_[data-slot=input]]:border-th-green [&_[data-slot=input]]:focus-visible:ring-th-green/25",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Label className="th-label">{label}</Label>
        {action}
      </div>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
