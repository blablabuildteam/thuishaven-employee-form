import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <CheckCircle2 className="size-16 text-green-600" />
          <h1 className="text-2xl font-bold">Bedankt!</h1>
          <p className="text-muted-foreground">
            Je registratie is compleet. Je gegevens zijn succesvol verzonden.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
