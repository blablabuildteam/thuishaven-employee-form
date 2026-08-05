"use client";

import { useRef, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  onChange: (dataUrl: string) => void;
  value?: string;
}

export function SignaturePad({ onChange }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null);

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
      <div className="border border-th-ink bg-white">
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{
            className: "w-full h-40 touch-none",
            style: { width: "100%", height: "160px" },
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
