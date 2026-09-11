import { FormShell } from "@/components/form/form-shell";
import { ContractSigningFlow } from "@/components/contract/signing-flow";
import { findContractByInviteToken } from "@/lib/contracts/session";

export default async function ContractPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const contract = await findContractByInviteToken(token);

  if (!contract) {
    return (
      <FormShell subtitle="Arbeidscontract" wide>
        <p className="text-center text-sm text-muted-foreground">
          Deze link is ongeldig of verlopen. Vraag HR om een nieuwe uitnodiging.
        </p>
      </FormShell>
    );
  }

  if (contract.status !== "INVITED") {
    return (
      <FormShell subtitle="Arbeidscontract" wide>
        <p className="text-center text-sm text-muted-foreground">
          Dit contract is al ondertekend. Thuishaven neemt contact met je op
          als er een nieuwe versie nodig is.
        </p>
      </FormShell>
    );
  }

  return (
    <FormShell subtitle="Arbeidscontract" wide>
      <ContractSigningFlow token={token} />
    </FormShell>
  );
}
