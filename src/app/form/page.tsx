import { EmployeeForm } from "@/components/form/employee-form";
import { FormShell } from "@/components/form/form-shell";

export default function FormPage() {
  return (
    <FormShell subtitle="Medewerker registratie">
      <div className="mb-6 text-center">
        <p className="text-sm text-muted-foreground sm:text-base">
          Vul onderstaand formulier volledig in om je te registreren als medewerker.
        </p>
      </div>
      <EmployeeForm />
    </FormShell>
  );
}
