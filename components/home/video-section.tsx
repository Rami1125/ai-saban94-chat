import { Play } from "lucide-react";

const videos = [
  {
    title: "מדריך התקנת לוחות גבס",
    description: "שלב אחר שלב – התקנה נכונה של מערכת גבס",
    embedId: "dQw4w9WgXcQ",
  },
  {
    title: "בחירת חומרי איטום",
    description: "איך לבחור את חומר האיטום המתאים לפרויקט שלך",
    embedId: "dQw4w9WgXcQ",
  },
  {
    title: "טיפים לעבודה עם מלט",
    description: "שיטות עבודה מקצועיות לערבוב ויציקת מלט",
    embedId: "dQw4w9WgXcQ",
  },
];

export function VideoSection() {
  return (
    <section
      className="bg-background py-16 md:py-24"
      aria-labelledby="videos-title"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-12 text-center">
          <h2
            id="videos-title"
            className="text-balance text-3xl font-bold text-foreground md:text-4xl"
          >
            וידאו והדרכות
          </h2>
          <p className="mx-auto mt-3 max-w-md text-pretty text-muted-foreground">
            סרטוני הדרכה מקצועיים שיעזרו לך לעבוד נכון עם חומרי הבניין
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <article key={video.title} className="flex flex-col gap-3">
              <div className="group relative aspect-video overflow-hidden rounded-xl border border-border bg-muted">
                <iframe
                  src={`https://www.youtube.com/embed/${video.embedId}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 size-full"
                  loading="lazy"
                />
                {/* Overlay for no-JS / placeholder */}
                <noscript>
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <Play className="size-12 text-muted-foreground" />
                  </div>
                </noscript>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {video.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {video.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
