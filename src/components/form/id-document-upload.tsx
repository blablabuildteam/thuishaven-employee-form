"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Camera, FileText, Trash2, Upload } from "lucide-react";
import {
  ID_DOCUMENT_ACCEPT,
  ID_DOCUMENT_MAX_BYTES,
  idDocumentErrorMessage,
  validateIdDocumentFile,
} from "@/lib/id-document";
import { cn } from "@/lib/utils";

interface IdDocumentUploadProps {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  complete?: boolean;
}

export function IdDocumentUpload({
  file,
  onChange,
  error,
  complete,
}: IdDocumentUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const applyFile = (next: File | null) => {
    if (!next) {
      setLocalError(null);
      onChange(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const result = validateIdDocumentFile(next);
    if (!result.ok) {
      setLocalError(idDocumentErrorMessage(result.error));
      onChange(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setLocalError(null);
    onChange(next);
  };

  const displayError = error || localError;
  const isPdf = file?.type === "application/pdf";

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Upload een duidelijke foto of scan van je <strong>paspoort</strong> of{" "}
        <strong>ID-kaart</strong> (geen rijbewijs). Max.{" "}
        {ID_DOCUMENT_MAX_BYTES / (1024 * 1024)} MB — JPG, PNG, WEBP, HEIC of PDF.
      </p>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ID_DOCUMENT_ACCEPT}
        className="sr-only"
        onChange={(e) => applyFile(e.target.files?.[0] ?? null)}
      />

      {!file ? (
        <label
          htmlFor={inputId}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed px-4 py-8 text-center transition-colors",
            displayError
              ? "border-destructive bg-destructive/5"
              : "border-th-ink/30 bg-th-cream hover:border-th-ink hover:bg-white",
          )}
        >
          <span className="flex items-center gap-3 text-th-muted">
            <Camera className="size-6" strokeWidth={1.75} aria-hidden />
            <Upload className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <span className="th-label text-th-ink">Kies bestand of maak foto</span>
          <span className="text-xs text-muted-foreground">
            Op mobiel kun je de camera openen
          </span>
        </label>
      ) : (
        <div
          className={cn(
            "flex items-start gap-3 border bg-white p-3",
            complete ? "border-th-green" : "border-th-ink",
          )}
        >
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden border border-th-ink/15 bg-th-cream">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
              <img
                src={previewUrl}
                alt="Voorbeeld ID-document"
                className="size-full object-cover"
              />
            ) : (
              <FileText className="size-7 text-th-muted" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {isPdf ? "PDF" : "Afbeelding"} · {(file.size / 1024).toFixed(0)} KB
            </p>
            <button
              type="button"
              className="th-label mt-2 text-xs tracking-[0.12em] text-th-muted underline-offset-4 hover:underline"
              onClick={() => inputRef.current?.click()}
            >
              Ander bestand kiezen
            </button>
          </div>
          <button
            type="button"
            onClick={() => applyFile(null)}
            className="inline-flex size-8 items-center justify-center text-th-muted transition-colors hover:text-destructive"
            aria-label="Bestand verwijderen"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      )}

      {displayError && (
        <p className="text-sm text-destructive">{displayError}</p>
      )}
    </div>
  );
}
