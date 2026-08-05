"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { acknowledgeAlert } from "@/app/dashboard/actions";

interface AcknowledgeButtonProps {
  alertId: string;
}

export function AcknowledgeButton({ alertId }: AcknowledgeButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => acknowledgeAlert(alertId))}
    >
      <Check className="size-4" />
      {isPending ? "Bezig..." : "Bevestigen"}
    </Button>
  );
}
