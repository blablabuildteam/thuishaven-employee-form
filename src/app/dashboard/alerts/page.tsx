import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, ShieldAlert } from "lucide-react";
import { AcknowledgeButton } from "@/components/dashboard/acknowledge-button";

function getAlertTypeLabel(type: string): string {
  switch (type) {
    case "THREE_SHIFTS":
      return "3-shift waarschuwing";
    case "FOUR_SHIFTS":
      return "4-shift contractactie";
    case "CONTRACT_NEEDED":
      return "Contract vereist";
    default:
      return type;
  }
}

export default async function AlertsPage() {
  const [unacknowledged, acknowledged] = await Promise.all([
    prisma.alert.findMany({
      where: { acknowledged: false },
      orderBy: { createdAt: "desc" },
      include: { employee: true },
    }),
    prisma.alert.findMany({
      where: { acknowledged: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { employee: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meldingen</h1>
        <p className="text-sm text-muted-foreground">
          {unacknowledged.length} openstaande melding
          {unacknowledged.length !== 1 ? "en" : ""}
        </p>
      </div>

      {unacknowledged.length > 0 ? (
        <div className="space-y-3">
          {unacknowledged.map((alert) => {
            const isSevere = alert.type === "FOUR_SHIFTS";
            const Icon = isSevere ? ShieldAlert : AlertTriangle;
            return (
              <Card
                key={alert.id}
                className={cn(
                  isSevere
                    ? "border-red-200 bg-red-50"
                    : "border-amber-200 bg-amber-50"
                )}
              >
                <CardContent className="flex items-start gap-4">
                  <div
                    className={cn(
                      "mt-0.5 shrink-0 rounded-lg p-2",
                      isSevere
                        ? "bg-red-100 text-red-600"
                        : "bg-amber-100 text-amber-600"
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {alert.employee.firstName} {alert.employee.lastName}
                        </p>
                        <Badge
                          variant={isSevere ? "destructive" : "secondary"}
                          className="mt-1"
                        >
                          {getAlertTypeLabel(alert.type)}
                        </Badge>
                      </div>
                      <AcknowledgeButton alertId={alert.id} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(alert.createdAt, "d MMMM yyyy, HH:mm", {
                        locale: nl,
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm font-medium">Geen openstaande meldingen</p>
            <p className="text-xs text-muted-foreground">
              Alle meldingen zijn bevestigd.
            </p>
          </CardContent>
        </Card>
      )}

      {acknowledged.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-muted-foreground">
            Bevestigde meldingen
          </h2>
          <div className="space-y-2">
            {acknowledged.map((alert) => (
              <Card key={alert.id} className="opacity-60">
                <CardContent className="flex items-center gap-4 py-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {alert.employee.firstName} {alert.employee.lastName}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {getAlertTypeLabel(alert.type)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {alert.message}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{format(alert.createdAt, "dd-MM-yyyy")}</p>
                    {alert.acknowledgedBy && (
                      <p>Door: {alert.acknowledgedBy}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
