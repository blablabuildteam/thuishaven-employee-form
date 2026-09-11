"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
};

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
  const [details, setDetails] = useState({
    initials: "",
    namePrefix: "",
    placeOfBirth: "",
    gender: "" as "" | "MALE" | "FEMALE" | "OTHER",
    nationality: "",
    maritalStatus: "" as "" | "MARRIED" | "UNMARRIED",
    applyPayrollTaxCredit: "" as "" | "yes" | "no",
    receivesBenefits: "" as "" | "yes" | "no",
  });
  const [contractSignature, setContractSignature] = useState("");
  const [reglementSignature, setReglementSignature] = useState("");
  const contractPadRef = useRef<SignaturePadHandle>(null);
  const reglementPadRef = useRef<SignaturePadHandle>(null);

  const populate = useCallback(
    (data: { employee: EmployeePayload; contract: ContractPayload }) => {
      setEmployee(data.employee);
      setContract(data.contract);
      setDetails({
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

  function handleDetailsSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (
      !details.initials ||
      !details.placeOfBirth ||
      !details.gender ||
      !details.nationality ||
      !details.maritalStatus ||
      !details.applyPayrollTaxCredit ||
      !details.receivesBenefits
    ) {
      setError("Vul alle verplichte velden in.");
      return;
    }
    setError(null);
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
      street: employee.street,
      houseNumber: employee.houseNumber,
      postalCode: employee.postalCode,
      city: employee.city,
      phone: employee.phone,
      email: employee.email,
      iban: employee.iban,
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
          Controleer je bekende gegevens en vul aan wat we nog niet hebben.
        </p>
        <div className="grid gap-3 rounded-md border bg-white p-4 text-sm">
          <p>
            <span className="text-muted-foreground">Naam</span>
            <br />
            {employee.firstName} {employee.lastName}
          </p>
          <p>
            <span className="text-muted-foreground">Adres</span>
            <br />
            {employee.street} {employee.houseNumber}, {employee.postalCode}{" "}
            {employee.city}
          </p>
          <p>
            <span className="text-muted-foreground">Contact</span>
            <br />
            {employee.email} · {employee.phone}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Voorletter">
            <Input
              value={details.initials}
              onChange={(e) =>
                setDetails((d) => ({ ...d, initials: e.target.value }))
              }
              required
            />
          </Field>
          <Field label="Tussenvoegsel">
            <Input
              value={details.namePrefix}
              onChange={(e) =>
                setDetails((d) => ({ ...d, namePrefix: e.target.value }))
              }
            />
          </Field>
          <Field label="Geboorteplaats">
            <Input
              value={details.placeOfBirth}
              onChange={(e) =>
                setDetails((d) => ({ ...d, placeOfBirth: e.target.value }))
              }
              required
            />
          </Field>
          <Field label="Nationaliteit">
            <Input
              value={details.nationality}
              onChange={(e) =>
                setDetails((d) => ({ ...d, nationality: e.target.value }))
              }
              required
            />
          </Field>
          <Field label="Geslacht">
            <select
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={details.gender}
              onChange={(e) =>
                setDetails((d) => ({
                  ...d,
                  gender: e.target.value as typeof details.gender,
                }))
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
                setDetails((d) => ({
                  ...d,
                  maritalStatus: e.target.value as typeof details.maritalStatus,
                }))
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
                setDetails((d) => ({
                  ...d,
                  applyPayrollTaxCredit: e.target.value as "yes" | "no" | "",
                }))
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
                setDetails((d) => ({
                  ...d,
                  receivesBenefits: e.target.value as "yes" | "no" | "",
                }))
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
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
