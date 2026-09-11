"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/form/signature-pad";
import { formatCurrency, formatDate } from "@/lib/format";
import { isContractExpiringSoon } from "@/lib/contracts/expiry-window";
import {
  countersignContract,
  sendContractInvite,
  sendSignedContractCopy,
} from "@/app/dashboard/contract-actions";

type ContractRow = {
  id: string;
  version: number;
  status: "INVITED" | "EMPLOYEE_SIGNED" | "COUNTERSIGNED";
  startDate: string;
  endDate: string;
  hourlyRate: number;
  invitedAt: string;
  employeeSignedAt: string | null;
  employerSignedAt: string | null;
  signedCopyEmailedAt: string | null;
  hasContractPdf: boolean;
  hasReglementPdf: boolean;
  hasFullySignedPdf: boolean;
};

const STATUS_LABEL: Record<ContractRow["status"], string> = {
  INVITED: "Uitnodiging verstuurd",
  EMPLOYEE_SIGNED: "Getekend door medewerker",
  COUNTERSIGNED: "Getekend door beide partijen",
};

export function EmployeeContractsPanel({
  employeeId,
  employeeName,
  canSend,
  defaultStart,
  defaultEnd,
  defaultRate,
  contracts,
}: {
  employeeId: string;
  employeeName: string;
  canSend: boolean;
  defaultStart: string;
  defaultEnd: string;
  defaultRate: number;
  contracts: ContractRow[];
}) {
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [pending, setPending] = useState(false);
  const [signature, setSignature] = useState("");

  const latest = contracts[0] ?? null;
  const awaitingCountersign = latest?.status === "EMPLOYEE_SIGNED";

  const expiryNote = useMemo(() => {
    if (!latest || latest.status !== "COUNTERSIGNED") return null;
    const end = new Date(latest.endDate);
    if (end < new Date()) return "Verlopen";
    if (isContractExpiringSoon(end)) return "Loopt binnenkort af";
    return null;
  }, [latest]);

  async function handleSend() {
    setPending(true);
    try {
      const result = await sendContractInvite({
        employeeId,
        startDate,
        endDate,
      });
      toast.success(
        result.skippedEmail
          ? "Uitnodiging aangemaakt (e-mail overgeslagen in deze omgeving)."
          : result.resent
            ? "Uitnodiging opnieuw verstuurd."
            : "Contractuitnodiging verstuurd.",
      );
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function handleCountersign() {
    if (!latest) return;
    if (!signature) {
      toast.error("Zet eerst een handtekening.");
      return;
    }
    setPending(true);
    try {
      await countersignContract({
        employeeId,
        contractId: latest.id,
        signatureData: signature,
      });
      toast.success("Contract mede-ondertekend.");
      setSignature("");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function handleSendCopy(contractId: string) {
    setPending(true);
    try {
      await sendSignedContractCopy({ employeeId, contractId });
      toast.success("Getekend exemplaar verstuurd.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>Arbeidscontract</CardTitle>
            <CardDescription>
              0-uren oproepovereenkomst + huishoudelijk reglement
            </CardDescription>
          </div>
          {expiryNote && (
            <Badge className="border-amber-200 bg-amber-500/15 text-amber-800">
              {expiryNote}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="contract-start">Ingangsdatum</Label>
            <Input
              id="contract-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contract-end">Einddatum</Label>
            <Input
              id="contract-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Uurloon</Label>
            <p className="flex h-8 items-center text-sm">
              {formatCurrency(defaultRate)}
            </p>
            <p className="text-xs text-muted-foreground">
              Wordt herberekend bij verzenden op basis van leeftijd op de
              ingangsdatum.
            </p>
          </div>
        </div>
        <Button onClick={handleSend} disabled={!canSend || pending}>
          {latest?.status === "INVITED"
            ? "Uitnodiging opnieuw sturen"
            : "Stuur contract"}
        </Button>
        {!canSend && (
          <p className="text-xs text-muted-foreground">
            Beschikbaar na de eerste geregistreerde dienst.
          </p>
        )}

        {contracts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nog geen contractversies voor {employeeName}.
          </p>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="space-y-2 border p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">Versie {contract.version}</p>
                  <Badge variant="secondary">
                    {STATUS_LABEL[contract.status]}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {formatDate(contract.startDate)} – {formatDate(contract.endDate)}{" "}
                  · {formatCurrency(contract.hourlyRate)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Verstuurd{" "}
                  {format(new Date(contract.invitedAt), "d MMM yyyy", {
                    locale: nl,
                  })}
                  {contract.employeeSignedAt
                    ? ` · Medewerker ${format(new Date(contract.employeeSignedAt), "d MMM yyyy", { locale: nl })}`
                    : ""}
                  {contract.employerSignedAt
                    ? ` · Thuishaven ${format(new Date(contract.employerSignedAt), "d MMM yyyy", { locale: nl })}`
                    : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {contract.hasContractPdf && (
                    <Button
                      size="sm"
                      variant="outline"
                      render={
                        <a
                          href={`/api/dashboard/employees/${employeeId}/contracts/${contract.id}/pdf?kind=contract`}
                          target="_blank"
                          rel="noreferrer"
                        />
                      }
                    >
                      <Download className="size-3.5" />
                      Contract
                    </Button>
                  )}
                  {contract.hasReglementPdf && (
                    <Button
                      size="sm"
                      variant="outline"
                      render={
                        <a
                          href={`/api/dashboard/employees/${employeeId}/contracts/${contract.id}/pdf?kind=reglement`}
                          target="_blank"
                          rel="noreferrer"
                        />
                      }
                    >
                      <Download className="size-3.5" />
                      Reglement
                    </Button>
                  )}
                  {contract.hasFullySignedPdf && (
                    <Button
                      size="sm"
                      variant="outline"
                      render={
                        <a
                          href={`/api/dashboard/employees/${employeeId}/contracts/${contract.id}/pdf?kind=signed`}
                          target="_blank"
                          rel="noreferrer"
                        />
                      }
                    >
                      <Download className="size-3.5" />
                      Volledig getekend
                    </Button>
                  )}
                  {contract.status === "COUNTERSIGNED" && (
                    <Button
                      size="sm"
                      onClick={() => handleSendCopy(contract.id)}
                      disabled={pending}
                    >
                      {contract.signedCopyEmailedAt
                        ? "Stuur getekende contract opnieuw naar medewerker"
                        : "Stuur getekend exemplaar"}
                    </Button>
                  )}
                </div>
                {awaitingCountersign && contract.id === latest?.id && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    <p className="text-sm font-medium">
                      Ondertekenen namens Thuishaven (I. Klinkhamer)
                    </p>
                    <SignaturePad
                      value={signature}
                      onChange={setSignature}
                      complete={Boolean(signature)}
                    />
                    <Button onClick={handleCountersign} disabled={pending}>
                      Contract mede-ondertekenen
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
