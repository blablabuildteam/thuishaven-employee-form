"use client";

import { CheckCircle2, Download, AlertTriangle } from "lucide-react";

interface SuccessPanelProps {
  downloadHref?: string | null;
}

export function SuccessPanel({ downloadHref }: SuccessPanelProps) {
  return (
    <div className="th-panel mx-auto flex w-full max-w-lg flex-col items-center gap-5 px-6 py-10 text-center sm:py-12">
      <CheckCircle2 className="size-14 text-th-green" strokeWidth={1.5} />
      <div className="space-y-2">
        <h1 className="th-heading text-3xl tracking-[0.12em]">Bedankt!</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Je registratie is compleet. Je gegevens zijn succesvol verzonden.
        </p>
      </div>

      <div className="w-full border border-th-ink/15 bg-th-cream px-4 py-4 text-left">
        <div className="mb-2 flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="th-heading text-xs tracking-[0.14em] text-destructive">
            Belangrijk voor je administratie
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Je ontvangt <span className="font-medium text-foreground">geen loonstrook</span>{" "}
          van Thuishaven. Download en bewaar dit IB47-formulier als bewijs van je
          gewerkte uren en betaling — bijvoorbeeld voor je eigen administratie of
          de Belastingdienst.
        </p>
      </div>

      {downloadHref ? (
        <div className="flex w-full flex-col items-stretch gap-2">
          <a href={downloadHref} className="th-chevron-btn" download>
            <Download className="mr-2 size-4" aria-hidden />
            Download IB47-formulier (PDF)
          </a>
          <p className="text-xs text-muted-foreground">
            We raden sterk aan dit bestand nu te downloaden en veilig te bewaren.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          De downloadlink is niet beschikbaar. Neem contact op met HR als je alsnog
          een kopie nodig hebt:{" "}
          <span className="font-medium text-foreground">hr@thuishaven.nl</span>
        </p>
      )}
    </div>
  );
}
