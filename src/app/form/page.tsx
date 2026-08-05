import { EmployeeForm } from "@/components/form/employee-form";

export default function FormPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="th-heading text-lg tracking-[0.15em]">THUISHAVEN</h1>
            <p className="text-xs text-muted-foreground">IB47-formulier</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Medewerker registratie</h2>
          <p className="text-sm text-muted-foreground">
            Vul onderstaand formulier volledig in om je te registreren als medewerker.
          </p>
        </div>
        <EmployeeForm />
      </div>
    </main>
  );
}
