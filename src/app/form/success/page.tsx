import { FormShell } from "@/components/form/form-shell";
import { SuccessPanel } from "@/components/form/success-panel";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; token?: string }>;
}) {
  const { id, token } = await searchParams;

  const downloadHref =
    id && token
      ? `/api/form/submissions/${encodeURIComponent(id)}/pdf?token=${encodeURIComponent(token)}`
      : null;

  return (
    <FormShell subtitle="Registratie compleet" showFooter>
      <SuccessPanel downloadHref={downloadHref} />
    </FormShell>
  );
}
