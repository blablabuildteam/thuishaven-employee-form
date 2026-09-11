"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { exportSignatureDataUrl } from "@/lib/signatures/export";

interface SignaturePadProps {
  onChange: (dataUrl: string) => void;
  value?: string;
  complete?: boolean;
}

export type SignaturePadHandle = {
  exportSignature: () => string;
};

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ onChange, value, complete }, ref) {
    const sigRef = useRef<SignatureCanvas>(null);

    const syncSignature = useCallback(() => {
      if (!sigRef.current || sigRef.current.isEmpty()) {
        onChange("");
        return;
      }
      onChange(exportSignatureDataUrl(sigRef.current));
    }, [onChange]);

    useImperativeHandle(
      ref,
      () => ({
        exportSignature: () =>
          sigRef.current ? exportSignatureDataUrl(sigRef.current) : "",
      }),
      [],
    );

    // Load once per mount (parent remounts via key after prefill).
    useEffect(() => {
      if (!value) return;
      const id = requestAnimationFrame(() => {
        sigRef.current?.fromDataURL(value);
      });
      return () => cancelAnimationFrame(id);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only hydrate
    }, []);

    const handleClear = useCallback(() => {
      sigRef.current?.clear();
      onChange("");
    }, [onChange]);

    return (
      <div className="space-y-2">
        <div
          className={cn(
            "h-72 overflow-hidden border bg-white",
            complete ? "border-th-green" : "border-th-ink",
          )}
        >
          <SignatureCanvas
            ref={sigRef}
            penColor="black"
            canvasProps={{
              className: "block h-full w-full touch-none",
            }}
            onEnd={syncSignature}
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
  },
);
