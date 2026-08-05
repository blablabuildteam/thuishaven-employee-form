import Image from "next/image";
import { cn } from "@/lib/utils";

export function FormShell({
  children,
  className,
  subtitle = "Medewerker registratie",
  showFooter = true,
}: {
  children: React.ReactNode;
  className?: string;
  subtitle?: string;
  showFooter?: boolean;
}) {
  return (
    <main className={cn("th-sunburst relative min-h-screen overflow-x-hidden", className)}>
      <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
        <header className="th-brand-mark mb-8 flex flex-col items-center text-center">
          <Image
            src="/brand/totem.png"
            alt="Thuishaven"
            width={140}
            height={138}
            priority
            className="mb-4 h-auto w-[7.5rem] mix-blend-multiply sm:w-[9rem]"
          />
          <Image
            src="/thuishaven-logo.png"
            alt="THUISHAVEN"
            width={320}
            height={47}
            priority
            className="h-auto w-[min(100%,18rem)]"
          />
          <p className="th-heading mt-4 text-lg tracking-[0.2em] text-th-muted sm:text-xl">
            {subtitle}
          </p>
          <div className="mt-5 h-px w-16 bg-th-ink" />
        </header>

        <div className="th-fade-up relative z-10">{children}</div>
      </div>

      {showFooter && (
        <footer className="th-fade-in mt-auto w-full">
          <Image
            src="/brand/fence-stripes.png"
            alt=""
            width={2362}
            height={794}
            className="mx-auto h-auto w-full max-w-3xl object-contain object-bottom opacity-90"
            aria-hidden
          />
        </footer>
      )}
    </main>
  );
}
