import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { listPayRates } from "@/lib/pay-rates";
import { formatCurrency } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PayRateSettingsForm } from "@/components/dashboard/pay-rate-settings-form";

export default async function SettingsPage() {
  const rates = await listPayRates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Instellingen</h1>
        <p className="text-sm text-muted-foreground">
          Uurlonen voor diensten en arbeidscontracten, met ingangsdatum.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uurlonen</CardTitle>
          <CardDescription>
            Het tarief dat geldt op de dienstdatum of contractstartdatum wordt
            gebruikt. Voeg een nieuwe periode toe voor bijvoorbeeld de
            loonsverhoging op 1 januari 2027.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <PayRateSettingsForm />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Ingangsdatum</th>
                  <th className="py-2 pr-4 font-medium">Onder 20</th>
                  <th className="py-2 pr-4 font-medium">20 jaar of ouder</th>
                  <th className="py-2 font-medium">Laatst bijgewerkt</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      {format(rate.effectiveFrom, "d MMMM yyyy", {
                        locale: nl,
                      })}
                    </td>
                    <td className="py-2 pr-4">
                      {formatCurrency(Number(rate.under20Rate))}
                    </td>
                    <td className="py-2 pr-4">
                      {formatCurrency(Number(rate.over20Rate))}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {rate.updatedBy ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
