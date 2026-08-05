import { ShieldAlert } from "lucide-react";
import { FormShell } from "@/components/form/form-shell";

export default function BlockedPage() {
  return (
    <FormShell subtitle="Registratie geblokkeerd" showFooter>
      <div className="th-panel mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 py-12 text-center">
        <ShieldAlert className="size-14 text-destructive" strokeWidth={1.5} />
        <h1 className="th-heading text-2xl tracking-[0.1em] sm:text-3xl">
          Geblokkeerd
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Je registratie is geblokkeerd. Neem contact op met HR.
        </p>
        <div className="mt-2 w-full border border-th-ink/20 bg-th-cream px-4 py-3 text-sm">
          <p className="th-label">Contact HR</p>
          <p className="mt-1 text-muted-foreground">hr@thuishaven.nl</p>
        </div>
      </div>
    </FormShell>
  );
}
