"use client";

import { CircleAlert, LoaderCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { checkIban, formatIban, type IbanCheckResult } from "@/lib/iban";
import { cn } from "@/lib/utils";

interface IbanFieldProps {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  "aria-invalid"?: boolean;
  disabled?: boolean;
}

function StatusIcon({ status }: { status: IbanCheckResult["status"] }) {
  // Valid state is shown via FormField checkmark next to the label
  if (status === "invalid") {
    return <CircleAlert className="size-4 text-destructive" aria-hidden />;
  }
  if (status === "incomplete") {
    return <LoaderCircle className="size-4 text-th-muted" aria-hidden />;
  }
  return null;
}

export function IbanField({
  value = "",
  onChange,
  onBlur,
  id,
  "aria-invalid": ariaInvalid,
  disabled,
}: IbanFieldProps) {
  const result = checkIban(value);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="NL91 ABNA 0417 1643 00"
          maxLength={27}
          disabled={disabled}
          aria-invalid={ariaInvalid || result.status === "invalid" || undefined}
          value={value}
          onChange={(e) => {
            const next = formatIban(e.target.value).slice(0, 27);
            onChange(next);
          }}
          onBlur={onBlur}
          className={cn(
            "pr-10 tracking-wide",
            result.status === "valid" &&
              "border-th-green focus-visible:ring-th-green/25",
            result.status === "invalid" &&
              "border-destructive focus-visible:ring-destructive/20",
          )}
        />
        {result.status !== "empty" && result.status !== "valid" && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <StatusIcon status={result.status} />
          </span>
        )}
      </div>

      {result.status !== "empty" && result.message && (
        <p
          className={cn(
            "text-xs text-muted-foreground",
            result.status === "invalid" && "text-destructive",
          )}
          role="status"
        >
          {result.message}
        </p>
      )}

      {result.status === "empty" && (
        <p className="text-xs text-muted-foreground">
          Nederlands IBAN: 18 tekens — landcode, controlecijfers, bankcode en
          rekeningnummer (bijv. NL91 ABNA 0417 1643 00).
        </p>
      )}
    </div>
  );
}
