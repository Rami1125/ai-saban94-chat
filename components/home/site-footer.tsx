import { Building2, Phone, Mail, MapPin, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function SiteFooter() {
  return (
    <footer
      id="contact"
      className="border-t border-border bg-foreground text-primary-foreground"
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
                <Building2 className="size-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">ח. סבן</span>
            </div>
            <p className="text-sm leading-relaxed opacity-70">
              יועץ חומרי בניין מקצועי. ליווי ותמיכה טכנית לקבלני ביצוע, אדריכלים
              ומהנדסי בניין.
            </p>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-50">
              יצירת קשר
            </h3>
            <ul className="flex flex-col gap-2.5 text-sm opacity-80">
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                <a href="tel:+97231234567" dir="ltr">
                  03-123-4567
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                <a href="mailto:info@saban.co.il">info@saban.co.il</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 opacity-60" aria-hidden="true" />
                <span>רח' התעשייה 15, אזור תעשייה, ישראל</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-50">
              שעות פעילות
            </h3>
            <ul className="flex flex-col gap-2 text-sm opacity-80">
              <li className="flex items-center gap-2">
                <Clock className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                {"א' – ה': 07:00 – 18:00"}
              </li>
              <li className="flex items-center gap-2">
                <Clock className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                {"ו': 07:00 – 13:00"}
              </li>
              <li className="flex items-center gap-2">
                <Clock className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                {"שבת: סגור"}
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-50">
              קישורים
            </h3>
            <ul className="flex flex-col gap-2 text-sm opacity-80">
              <li>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 transition-opacity hover:underline hover:opacity-100"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 transition-opacity hover:underline hover:opacity-100"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/97231234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 transition-opacity hover:underline hover:opacity-100"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 transition-opacity hover:underline hover:opacity-100"
                >
                  YouTube
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-primary-foreground/10" />

        <p className="text-center text-xs opacity-50">
          {"© 2026 ח. סבן – יועץ חומרים. כל הזכויות שמורות."}
        </p>
      </div>
    </footer>
  );
}
