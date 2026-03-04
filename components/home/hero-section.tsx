import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-bl from-primary/[0.08] via-background to-accent/40 py-20 md:py-28 lg:py-36"
      aria-labelledby="hero-title"
    >
      {/* Subtle decorative pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1
            id="hero-title"
            className="text-balance text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl"
          >
            הפתרון המקצועי
            <br />
            <span className="text-primary">לחומרי בניין</span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
            מאגר מוצרים מקיף, מפרטים טכניים והמלצות מקצועיות. כל מה שצריך
            לפרויקט הבנייה שלך – במקום אחד.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="gap-2 rounded-lg px-8 text-base font-semibold"
              asChild
            >
              <Link href="/chat">
                <Search className="size-4" />
                חיפוש חכם
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="gap-2 rounded-lg px-8 text-base font-semibold"
              asChild
            >
              <Link href="#categories">
                קטגוריות מובילות
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
