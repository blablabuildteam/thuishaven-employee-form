"use client";

import { useState, useTransition } from "react";
import { updateEmployeeDateOfBirth } from "@/app/dashboard/actions";
import { FormDatePicker } from "@/components/form/form-date-picker";
import { Button } from "@/components/ui/button";

export function EmployeeBirthDateForm({
  employeeId,
  dateOfBirth,
}: {
  employeeId: string;
  dateOfBirth: string;
}) {
  const [value, setValue] = useState(dateOfBirth);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateEmployeeDateOfBirth(employeeId, value);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 pl-7">
      <FormDatePicker
        id={`dob-${employeeId}`}
        variant="birth"
        value={value}
        onChange={(next) => {
          setValue(next);
          setSaved(false);
          setError(null);
        }}
        aria-invalid={!!error}
        disabled={pending}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && (
        <p className="text-sm text-emerald-700">Geboortedatum opgeslagen.</p>
      )}
      <Button
        type="submit"
        size="sm"
        disabled={pending || value === dateOfBirth}
      >
        {pending ? "Opslaan…" : "Geboortedatum opslaan"}
      </Button>
    </form>
  );
}
