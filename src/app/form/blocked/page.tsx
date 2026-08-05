import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function BlockedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <ShieldAlert className="size-16 text-destructive" />
          <h1 className="text-2xl font-bold">Registratie geblokkeerd</h1>
          <p className="text-muted-foreground">
            Je registratie is geblokkeerd. Neem contact op met HR.
          </p>
          <div className="mt-4 rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium">Contact HR</p>
            <p className="text-muted-foreground">hr@thuishaven.nl</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
