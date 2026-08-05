"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Ongeldige e-mail of wachtwoord");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="th-sunburst flex min-h-screen items-center justify-center px-4 py-10">
      <div className="th-brand-mark w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/brand/totem.png"
            alt="Thuishaven"
            width={110}
            height={108}
            priority
            className="mb-3 h-auto w-24 mix-blend-multiply"
          />
          <Image
            src="/thuishaven-logo.png"
            alt="THUISHAVEN"
            width={280}
            height={41}
            priority
            className="h-auto w-[14rem]"
          />
          <p className="th-heading mt-3 text-base tracking-[0.2em] text-th-muted">
            HR Dashboard
          </p>
        </div>

        <div className="th-panel th-fade-up">
          <div className="border-b border-th-ink/10 px-5 py-4">
            <h2 className="th-section-title">Inloggen</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Log in met je HR-account om formulieren te beheren
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="th-label">
                E-mailadres
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="hr@thuishaven.nl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="th-label">
                Wachtwoord
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="th-heading h-11 w-full rounded-none tracking-[0.16em]"
              disabled={loading}
            >
              {loading ? "Bezig met inloggen…" : "Inloggen"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
