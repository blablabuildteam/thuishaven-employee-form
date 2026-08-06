"use client";

import { useRef, useCallback, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  onChange: (dataUrl: string) => void;
  value?: string;
  complete?: boolean;
}

export function SignaturePad({ onChange, value, complete }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null);

  // Load once per mount (parent remounts via key after prefill).
  useEffect(() => {
    if (!value) return;
    const id = requestAnimationFrame(() => {
      sigRef.current?.fromDataURL(value);
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only hydrate
  }, []);

  const handleEnd = useCallback(() => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      onChange(sigRef.current.toDataURL("image/png"));
    }
  }, [onChange]);

  const handleClear = useCallback(() => {
    sigRef.current?.clear();
    onChange("");
  }, [onChange]);

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "border bg-white",
          complete ? "border-th-green" : "border-th-ink",
        )}
      >
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{
            className: "w-full h-72 touch-none",
            style: { width: "100%", height: "288px" },
          }}
          onEnd={handleEnd}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-none border-th-ink uppercase tracking-wider"
        onClick={handleClear}
      >
        Handtekening wissen
      </Button>
    </div>
  );
}
