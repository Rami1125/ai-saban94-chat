import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Brain, Save, RefreshCw } from "lucide-react"
import { SafeIcon } from "@/components/SafeIcon"

export default function AiBrainPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#0B2C63]">ניהול מוח AI - ח. סבן</h1>
        <Button className="bg-[#0B2C63] hover:bg-blue-800">
          <SafeIcon icon={Save} size={18} className="ml-2" />
          שמור הגדרות מוח
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* הגדרות קונטקסט ראשיות */}
        <Card className="shadow-md">
          <CardHeader className="bg-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <SafeIcon icon={Brain} className="text-blue-600" />
              הנחיות מערכת (System Prompt)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-2">הגדר ל-AI איך להתנהג ומה התפקיד שלו מול הלקוח.</p>
            <Textarea 
              placeholder="אתה עוזר חכם של חברת ח. סבן..." 
              className="min-h-[200px] bg-white border-slate-200"
            />
          </CardContent>
        </Card>

        {/* סטטוס סנכרון עם Supabase */}
        <Card className="shadow-md">
          <CardHeader className="bg-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <SafeIcon icon={RefreshCw} className="text-green-600" />
              סטטוס ידע מאוחד
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 border border-green-100 rounded-lg text-green-800 text-sm">
              <span>סנכרון אחרון עם טבלת מלאי:</span>
              <span className="font-mono font-bold">לפני 15 דקות</span>
            </div>
            <Button variant="outline" className="w-full">
              רענן זיכרון עבודה (Cache)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
