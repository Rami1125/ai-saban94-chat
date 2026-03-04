import {
  Layers,
  Hammer,
  Droplets,
  CircleDot,
  PaintBucket,
  Wrench,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const categories = [
  {
    title: "לוחות גבס",
    description: "לוחות גבס סטנדרטיים, עמידים בלחות ובאש, פרופילים ואביזרים.",
    icon: Layers,
  },
  {
    title: "מלט ובטון",
    description: "מלט פורטלנד, בטון יבש, דבקים צמנטיים ומוצרי טייח.",
    icon: Hammer,
  },
  {
    title: "איטום ובידוד",
    description: "חומרי איטום ביטומניים, ממברנות, בידוד תרמי ואקוסטי.",
    icon: Droplets,
  },
  {
    title: "ברזל ומתכות",
    description: "ברזל זיון, רשתות, פרופילי פלדה ואביזרי חיבור.",
    icon: CircleDot,
  },
  {
    title: "צבעים וגמר",
    description: "צבעים לקירות פנים וחוץ, שפכטל, קרמיקה ואריחים.",
    icon: PaintBucket,
  },
  {
    title: "כלי עבודה",
    description: "כלי עבודה ידניים וחשמליים, ציוד בטיחות ואביזרי עזר.",
    icon: Wrench,
  },
];

export function CategoriesSection() {
  return (
    <section
      id="categories"
      className="bg-background py-16 md:py-24"
      aria-labelledby="categories-title"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-12 text-center">
          <h2
            id="categories-title"
            className="text-balance text-3xl font-bold text-foreground md:text-4xl"
          >
            קטגוריות מובילות
          </h2>
          <p className="mx-auto mt-3 max-w-md text-pretty text-muted-foreground">
            מגוון רחב של חומרי בניין מקצועיים, מסודרים לפי קטגוריה לנוחיותך
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Card
                key={cat.title}
                className="group cursor-pointer border-border/60 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <CardHeader>
                  <div className="mb-2 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-6" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-lg">{cat.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {cat.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
