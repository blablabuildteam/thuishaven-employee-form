"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AddressAutocomplete } from "@/components/form/address-autocomplete";
import { IbanField } from "@/components/form/iban-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ParsedAddress } from "@/lib/address";
import { contractContactSchema } from "@/lib/contracts/schema";
import {
  SignaturePad,
  type SignaturePadHandle,
} from "@/components/form/signature-pad";
import { isValidSignatureDataUrl } from "@/lib/signatures/export";
import {
  ContractDocumentPreview,
  ReglementPreview,
} from "@/components/contract/document-preview";
import { SuccessPanel } from "@/components/form/success-panel";
import type { ContractParty } from "@/lib/contracts/pdf-data";
import { parseIsoDate } from "@/lib/contracts/dates";

type EmployeePayload = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  iban: string;
  bsn: string;
  initials: string;
  namePrefix: string;
  placeOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  nationality: string;
  maritalStatus: "MARRIED" | "UNMARRIED" | null;
  applyPayrollTaxCredit: boolean | null;
  receivesBenefits: boolean | null;
};

type ContractPayload = {
  startDate: string;
  endDate: string;
  hourlyRate: number;
  jobTitle: string;
};

type ContactField =
  | "street"
  | "houseNumber"
  | "postalCode"
  | "city"
  | "phone"
  | "email"
  | "iban";

type ContractDetails = {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  iban: string;
  initials: string;
  namePrefix: string;
  placeOfBirth: string;
  gender: "" | "MALE" | "FEMALE" | "OTHER";
  nationality: string;
  maritalStatus: "" | "MARRIED" | "UNMARRIED";
  applyPayrollTaxCredit: "" | "yes" | "no";
  receivesBenefits: "" | "yes" | "no";
};

const EMPTY_DETAILS: ContractDetails = {
  street: "",
  houseNumber: "",
  postalCode: "",
  city: "",
  phone: "",
  email: "",
  iban: "",
  initials: "",
  namePrefix: "",
  placeOfBirth: "",
  gender: "",
  nationality: "",
  maritalStatus: "",
  applyPayrollTaxCredit: "",
  receivesBenefits: "",
};

function displayIsoDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function ContractSigningFlow({ token }: { token: string }) {
  const [step, setStep] = useState<
    "verify" | "details" | "sign-contract" | "sign-reglement" | "done"
  >("verify");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [bsn, setBsn] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [employee, setEmployee] = useState<EmployeePayload | null>(null);
  const [contract, setContract] = useState<ContractPayload | null>(null);
  const [details, setDetails] = useState<ContractDetails>(EMPTY_DETAILS);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ContactField, string>>
  >({});
  const [contractSignature, setContractSignature] = useState("");
  const [reglementSignature, setReglementSignature] = useState("");
  const contractPadRef = useRef<SignaturePadHandle>(null);
  const reglementPadRef = useRef<SignaturePadHandle>(null);

  const populate = useCallback(
    (data: { employee: EmployeePayload; contract: ContractPayload }) => {
      setEmployee(data.employee);
      setContract(data.contract);
      setDetails({
        street: data.employee.street || "",
        houseNumber: data.employee.houseNumber || "",
        postalCode: data.employee.postalCode || "",
        city: data.employee.city || "",
        phone: data.employee.phone || "",
        email: data.employee.email || "",
        iban: data.employee.iban || "",
        initials:
          data.employee.initials ||
          (data.employee.firstName?.[0]
            ? `${data.employee.firstName[0].toUpperCase()}.`
            : ""),
        namePrefix: data.employee.namePrefix || "",
        placeOfBirth: data.employee.placeOfBirth || "",
        gender: data.employee.gender || "",
        nationality: data.employee.nationality || "",
        maritalStatus: data.employee.maritalStatus || "",
        applyPayrollTaxCredit:
          data.employee.applyPayrollTaxCredit == null
            ? ""
            : data.employee.applyPayrollTaxCredit
              ? "yes"
              : "no",
        receivesBenefits:
          data.employee.receivesBenefits == null
            ? ""
            : data.employee.receivesBenefits
              ? "yes"
              : "no",
      });
      setFieldErrors({});
      setStep("details");
    },
    [],
  );

  const loadDetails = useCallback(async () => {
    const res = await fetch(`/api/contract/${token}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Kon gegevens niet laden");
    }
    populate(data);
  }, [token, populate]);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/contract/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bsn, dateOfBirth }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verificatie mislukt");
      await loadDetails();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  function updateDetail<K extends keyof ContractDetails>(
    key: K,
    value: ContractDetails[K],
  ) {
    setDetails((current) => ({ ...current, [key]: value }));
    if (key in fieldErrors) {
      setFieldErrors((current) => {
        if (!current[key as ContactField]) return current;
        const next = { ...current };
        delete next[key as ContactField];
        return next;
      });
    }
  }

  function applyAddress(address: ParsedAddress) {
    setDetails((current) => ({
      ...current,
      ...(address.street ? { street: address.street } : {}),
      ...(address.houseNumber ? { houseNumber: address.houseNumber } : {}),
      ...(address.postalCode ? { postalCode: address.postalCode } : {}),
      ...(address.city ? { city: address.city } : {}),
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      if (address.street) delete next.street;
      if (address.houseNumber) delete next.houseNumber;
      if (address.postalCode) delete next.postalCode;
      if (address.city) delete next.city;
      return next;
    });
  }

  function handleDetailsSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = contractContactSchema.safeParse(details);
    const nextErrors: Partial<Record<ContactField, string>> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !nextErrors[key as ContactField]) {
          nextErrors[key as ContactField] = issue.message;
        }
      }
    }
    setFieldErrors(nextErrors);

    const extrasMissing =
      !details.initials ||
      !details.placeOfBirth ||
      !details.gender ||
      !details.nationality ||
      !details.maritalStatus ||
      !details.applyPayrollTaxCredit ||
      !details.receivesBenefits;

    if (!parsed.success || extrasMissing) {
      setError(
        extrasMissing
          ? "Vul alle verplichte velden in."
          : "Controleer de gemarkeerde velden.",
      );
      return;
    }

    setError(null);
    setDetails((current) => ({ ...current, ...parsed.data }));
    setStep("sign-contract");
  }

  const previewData = useMemo(() => {
    if (!employee || !contract) return null;
    const party: ContractParty = {
      firstName: employee.firstName,
      lastName: employee.lastName,
      initials: details.initials,
      namePrefix: details.namePrefix || null,
      dateOfBirth: parseIsoDate(employee.dateOfBirth),
      street: details.street,
      houseNumber: details.houseNumber,
      postalCode: details.postalCode,
      city: details.city,
      phone: details.phone,
      email: details.email,
      iban: details.iban,
      bsn: employee.bsn,
      placeOfBirth: details.placeOfBirth,
      gender: details.gender || null,
      nationality: details.nationality,
      maritalStatus: details.maritalStatus || null,
      applyPayrollTaxCredit: details.applyPayrollTaxCredit === "yes",
      receivesBenefits: details.receivesBenefits === "yes",
    };
    return {
      employee: party,
      startDate: parseIsoDate(contract.startDate),
      endDate: parseIsoDate(contract.endDate),
      hourlyRate: contract.hourlyRate,
      jobTitle: contract.jobTitle,
    };
  }, [employee, contract, details]);

  async function handleSign(event: React.FormEvent) {
    event.preventDefault();
    const finalContractSignature =
      contractPadRef.current?.exportSignature() || contractSignature;
    const finalReglementSignature =
      reglementPadRef.current?.exportSignature() || reglementSignature;

    if (!isValidSignatureDataUrl(finalContractSignature)) {
      setError("Onderteken het contract om verder te gaan.");
      return;
    }
    if (!isValidSignatureDataUrl(finalReglementSignature)) {
      setError("Onderteken het huishoudelijk reglement.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/contract/${token}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: details.street,
          houseNumber: details.houseNumber,
          postalCode: details.postalCode,
          city: details.city,
          phone: details.phone,
          email: details.email,
          iban: details.iban,
          initials: details.initials,
          namePrefix: details.namePrefix,
          placeOfBirth: details.placeOfBirth,
          gender: details.gender,
          nationality: details.nationality,
          maritalStatus: details.maritalStatus,
          applyPayrollTaxCredit: details.applyPayrollTaxCredit === "yes",
          receivesBenefits: details.receivesBenefits === "yes",
          contractSignatureData: finalContractSignature,
          reglementSignatureData: finalReglementSignature,
        }),
      });
      const raw = await res.text();
      let data: { error?: string } = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as { error?: string };
        } catch {
          throw new Error(
            `Versturen mislukt (${res.status}). Probeer het opnieuw.`,
          );
        }
      } else if (!res.ok) {
        throw new Error(
          `Versturen mislukt (${res.status}). Probeer het opnieuw.`,
        );
      }
      if (!res.ok) throw new Error(data.error || "Opslaan mislukt");
      setStep("done");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    loadDetails().catch(() => {
      // Unverified visitors stay on the BSN step.
    });
  }, [loadDetails]);

  if (step === "done") {
    return (
      <SuccessPanel
        showAdminNote={false}
        title="Bedankt!"
        description="Je hebt beide documenten ondertekend. Thuishaven zet daarna de handtekening van de werkgever. Je ontvangt de volledig getekende versie per e-mail wanneer HR die verstuurt."
      />
    );
  }

  if (step === "verify") {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Bevestig je identiteit met je BSN en geboortedatum.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="bsn">BSN</Label>
            <Input
              id="bsn"
              value={bsn}
              onChange={(e) => setBsn(e.target.value.replace(/\D/g, "").slice(0, 9))}
              inputMode="numeric"
              maxLength={9}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dob">Geboortedatum</Label>
            <Input
              id="dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button type="submit" className="th-chevron-btn" disabled={pending}>
          {pending ? "Controleren…" : "Doorgaan"}
        </button>
      </form>
    );
  }

  if (step === "details" && employee && contract) {
    return (
      <form onSubmit={handleDetailsSubmit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Controleer je gegevens. Adres, telefoon, e-mail en IBAN kun je hier
          aanpassen. Naam en geboortedatum blijven zoals we ze hebben.
        </p>
        <div className="grid gap-3 rounded-md border bg-white p-4 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Naam</span>
            <br />
            {employee.firstName} {employee.lastName}
          </p>
          <p>
            <span className="text-muted-foreground">Geboortedatum</span>
            <br />
            {displayIsoDate(employee.dateOfBirth)}
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium">Adres</p>
          <AddressAutocomplete onAddressSelect={applyAddress} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <Field label="Straat" htmlFor="street" error={fieldErrors.street}>
              <Input
                id="street"
                autoComplete="street-address"
                value={details.street}
                onChange={(e) => updateDetail("street", e.target.value)}
                aria-invalid={!!fieldErrors.street}
                required
              />
            </Field>
            <Field label="Huisnummer" htmlFor="houseNumber" error={fieldErrors.houseNumber}>
              <Input
                id="houseNumber"
                value={details.houseNumber}
                onChange={(e) => updateDetail("houseNumber", e.target.value)}
                className="sm:w-28"
                aria-invalid={!!fieldErrors.houseNumber}
                required
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Postcode" htmlFor="postalCode" error={fieldErrors.postalCode}>
              <Input
                id="postalCode"
                autoComplete="postal-code"
                value={details.postalCode}
                onChange={(e) => updateDetail("postalCode", e.target.value)}
                maxLength={7}
                aria-invalid={!!fieldErrors.postalCode}
                required
              />
            </Field>
            <Field label="Woonplaats" htmlFor="city" error={fieldErrors.city}>
              <Input
                id="city"
                autoComplete="address-level2"
                value={details.city}
                onChange={(e) => updateDetail("city", e.target.value)}
                aria-invalid={!!fieldErrors.city}
                required
              />
            </Field>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Telefoonnummer" htmlFor="phone" error={fieldErrors.phone}>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={details.phone}
              onChange={(e) => updateDetail("phone", e.target.value)}
              aria-invalid={!!fieldErrors.phone}
              required
            />
          </Field>
          <Field label="E-mailadres" htmlFor="email" error={fieldErrors.email}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={details.email}
              onChange={(e) => updateDetail("email", e.target.value)}
              aria-invalid={!!fieldErrors.email}
              required
            />
          </Field>
          <Field label="IBAN" htmlFor="iban" error={fieldErrors.iban}>
            <IbanField
              id="iban"
              value={details.iban}
              onChange={(value) => updateDetail("iban", value)}
              aria-invalid={!!fieldErrors.iban}
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Voorletter">
            <Input
              value={details.initials}
              onChange={(e) => updateDetail("initials", e.target.value)}
              required
            />
          </Field>
          <Field label="Tussenvoegsel">
            <Input
              value={details.namePrefix}
              onChange={(e) => updateDetail("namePrefix", e.target.value)}
            />
          </Field>
          <Field label="Geboorteplaats">
            <Input
              value={details.placeOfBirth}
              onChange={(e) => updateDetail("placeOfBirth", e.target.value)}
              required
            />
          </Field>
          <Field label="Nationaliteit">
            <Input
              value={details.nationality}
              onChange={(e) => updateDetail("nationality", e.target.value)}
              required
            />
          </Field>
          <Field label="Geslacht">
            <select
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={details.gender}
              onChange={(e) =>
                updateDetail(
                  "gender",
                  e.target.value as ContractDetails["gender"],
                )
              }
              required
            >
              <option value="">Kies…</option>
              <option value="MALE">Man</option>
              <option value="FEMALE">Vrouw</option>
              <option value="OTHER">Anders</option>
            </select>
          </Field>
          <Field label="Burgerlijke staat">
            <select
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={details.maritalStatus}
              onChange={(e) =>
                updateDetail(
                  "maritalStatus",
                  e.target.value as ContractDetails["maritalStatus"],
                )
              }
              required
            >
              <option value="">Kies…</option>
              <option value="UNMARRIED">Ongehuwd</option>
              <option value="MARRIED">Gehuwd</option>
            </select>
          </Field>
          <Field label="Loonheffingskorting toepassen">
            <select
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={details.applyPayrollTaxCredit}
              onChange={(e) =>
                updateDetail(
                  "applyPayrollTaxCredit",
                  e.target.value as ContractDetails["applyPayrollTaxCredit"],
                )
              }
              required
            >
              <option value="">Kies…</option>
              <option value="yes">Ja</option>
              <option value="no">Nee</option>
            </select>
          </Field>
          <Field label="Ontvang je een uitkering?">
            <select
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={details.receivesBenefits}
              onChange={(e) =>
                updateDetail(
                  "receivesBenefits",
                  e.target.value as ContractDetails["receivesBenefits"],
                )
              }
              required
            >
              <option value="">Kies…</option>
              <option value="yes">Ja</option>
              <option value="no">Nee</option>
            </select>
          </Field>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button type="submit" className="th-chevron-btn">
          Naar het contract
        </button>
      </form>
    );
  }

  if (step === "sign-contract" && previewData) {
    return (
      <div className="space-y-8">
        <div className="th-panel overflow-hidden bg-white p-0">
          <ContractDocumentPreview data={previewData} />
        </div>
        <div className="space-y-2">
          <Label>Handtekening oproepovereenkomst</Label>
          <SignaturePad
            ref={contractPadRef}
            value={contractSignature}
            onChange={setContractSignature}
            complete={Boolean(contractSignature)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <button
            type="button"
            className="th-chevron-btn th-chevron-btn-back sm:flex-1"
            onClick={() => {
              setError(null);
              setStep("details");
            }}
          >
            Terug
          </button>
          <button
            type="button"
            className="th-chevron-btn sm:flex-1"
            onClick={() => {
              if (!contractSignature) {
                setError("Onderteken het contract om verder te gaan.");
                return;
              }
              setError(null);
              setStep("sign-reglement");
            }}
          >
            Volgende
          </button>
        </div>
      </div>
    );
  }

  if (step === "sign-reglement" && previewData) {
    return (
      <form onSubmit={handleSign} className="space-y-8">
        <div className="th-panel overflow-hidden bg-white p-0">
          <ReglementPreview />
        </div>
        <div className="space-y-2">
          <Label>Handtekening huishoudelijk reglement</Label>
          <SignaturePad
            ref={reglementPadRef}
            value={reglementSignature}
            onChange={setReglementSignature}
            complete={Boolean(reglementSignature)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <button
            type="button"
            className="th-chevron-btn th-chevron-btn-back sm:flex-1"
            onClick={() => {
              setError(null);
              setStep("sign-contract");
            }}
            disabled={pending}
          >
            Terug
          </button>
          <button type="submit" className="th-chevron-btn sm:flex-1" disabled={pending}>
            {pending ? "Versturen…" : "Verstuur"}
          </button>
        </div>
      </form>
    );
  }

  return null;
}

function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
