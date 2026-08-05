import { CheckCircle2 } from "lucide-react";
import { FormShell } from "@/components/form/form-shell";

export default function SuccessPage() {
  return (
    <FormShell subtitle="Registratie compleet" showFooter>
      <div className="th-panel mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 py-12 text-center">
        <CheckCircle2 className="size-14 text-th-green" strokeWidth={1.5} />
        <h1 className="th-heading text-3xl tracking-[0.12em]">Bedankt!</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Je registratie is compleet. Je gegevens zijn succesvol verzonden.
        </p>
      </div>
    </FormShell>
  );
}
