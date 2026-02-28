// components/chat/CanvasRenderer.tsx
import { Card } from "@/components/ui/card";

export default function CanvasRenderer({ data }: { data: any }) {
  if (!data.components) return null;

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border/50">
      <p className="text-sm font-medium">{data.text}</p>
      <div className="grid grid-cols-1 gap-3">
        {data.components.map((comp: any, i: number) => {
          if (comp.type === 'productCard') {
            return (
              <Card key={i} className="p-3 flex items-center gap-3">
                <img src={comp.props.image} className="w-16 h-16 rounded shadow-sm" />
                <div>
                  <h4 className="font-bold text-sm">{comp.props.name}</h4>
                  <p className="text-xs text-primary">₪{comp.props.price}</p>
                </div>
              </Card>
            );
          }
          // כאן תוסיף עוד רכיבים כמו specCard או calcCard
          return null;
        })}
      </div>
      <footer className="text-[10px] opacity-50">מקור: {data.source}</footer>
    </div>
  );
}
