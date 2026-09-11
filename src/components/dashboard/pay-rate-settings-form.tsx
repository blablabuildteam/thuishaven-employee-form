"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addPayRatePeriod } from "@/app/dashboard/actions";

export function PayRateSettingsForm() {
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await addPayRatePeriod(formData);
      toast.success("Tariefperiode opgeslagen");
      const form = document.getElementById(
        "pay-rate-form",
      ) as HTMLFormElement | null;
      form?.reset();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      id="pay-rate-form"
      action={handleSubmit}
      className="grid gap-4 sm:grid-cols-4 sm:items-end"
    >
      <div className="space-y-1.5">
        <Label htmlFor="effectiveFrom">Ingangsdatum</Label>
        <Input id="effectiveFrom" name="effectiveFrom" type="date" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="under20Rate">Uurloon onder 20</Label>
        <Input
          id="under20Rate"
          name="under20Rate"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="13.50"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="over20Rate">Uurloon 20+</Label>
        <Input
          id="over20Rate"
          name="over20Rate"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="15.00"
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Opslaan…" : "Periode opslaan"}
      </Button>
    </form>
  );
}
