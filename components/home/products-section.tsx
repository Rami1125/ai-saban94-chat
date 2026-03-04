"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Package } from "lucide-react";

interface Product {
  name: string;
  sku: string;
  image: string;
  features: string[];
  category: string;
}

const products: Product[] = [
  {
    name: "לוח גבס סטנדרטי 12.5 מ\"מ",
    sku: "GYP-STD-125",
    image: "/placeholder.svg",
    features: ["עובי 12.5 מ\"מ", "מידה 1.2x2.4 מ'", "לשימוש פנימי"],
    category: "גבס",
  },
  {
    name: "מלט פורטלנד CEM I 52.5",
    sku: "CEM-PRT-525",
    image: "/placeholder.svg",
    features: ["חוזק 52.5 MPa", "שק 25 ק\"ג", "תקן ישראלי"],
    category: "מלט",
  },
  {
    name: "ממברנת איטום ביטומנית",
    sku: "WTP-BIT-400",
    image: "/placeholder.svg",
    features: ["עובי 4 מ\"מ", "רוחב 1 מ'", "עמיד UV"],
    category: "איטום",
  },
  {
    name: "ברזל זיון 12 מ\"מ B500",
    sku: "STL-RBR-012",
    image: "/placeholder.svg",
    features: ["קוטר 12 מ\"מ", "ציפוי B500", "אורך 12 מ'"],
    category: "ברזל",
  },
  {
    name: "דבק קרמיקה גמיש C2TE",
    sku: "ADH-CER-C2T",
    image: "/placeholder.svg",
    features: ["גמיש C2TE", "שק 25 ק\"ג", "לפנים וחוץ"],
    category: "דבקים",
  },
  {
    name: "צבע אקרילי לחוץ",
    sku: "PNT-ACR-EXT",
    image: "/placeholder.svg",
    features: ["18 ליטר", "עמיד מזג אוויר", "כיסוי גבוה"],
    category: "צבעים",
  },
];

export function ProductsSection() {
  return (
    <section
      className="bg-secondary/50 py-16 md:py-24"
      aria-labelledby="products-title"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-12 text-center">
          <h2
            id="products-title"
            className="text-balance text-3xl font-bold text-foreground md:text-4xl"
          >
            מוצרים אחרונים
          </h2>
          <p className="mx-auto mt-3 max-w-md text-pretty text-muted-foreground">
            מבחר מוצרים נבחרים מהקטלוג שלנו עם מפרטים טכניים מעודכנים
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            direction: "rtl",
          }}
          className="mx-auto w-full max-w-6xl"
        >
          <CarouselContent className="-mr-4">
            {products.map((product) => (
              <CarouselItem
                key={product.sku}
                className="mr-4 basis-[280px] sm:basis-[300px] lg:basis-[320px]"
              >
                <Card className="flex h-full flex-col border-border/60">
                  {/* Image area */}
                  <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-t-xl bg-muted">
                    <Package
                      className="size-16 text-muted-foreground/30"
                      aria-hidden="true"
                    />
                    <Badge
                      variant="secondary"
                      className="absolute left-3 top-3 text-xs"
                    >
                      {product.category}
                    </Badge>
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-base leading-snug">
                      {product.name}
                    </CardTitle>
                    <p className="font-mono text-xs text-muted-foreground">
                      {product.sku}
                    </p>
                  </CardHeader>

                  <CardContent className="flex-1 pb-2">
                    <ul
                      className="flex flex-col gap-1.5 text-sm text-muted-foreground"
                      aria-label={`תכונות ${product.name}`}
                    >
                      {product.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <span
                            className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60"
                            aria-hidden="true"
                          />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <Link href="/chat">פרטים</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="mt-8 flex items-center justify-center gap-2">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
