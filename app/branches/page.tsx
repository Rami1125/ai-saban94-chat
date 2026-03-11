"use client";
import { MapPin, Clock, Phone, Navigation, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const BRANCHES = [
  {
    id: 1,
    name: "סניף החרש",
    location: "הוד השרון",
    address: "החרש 8, הוד השרון",
    waze: "https://waze.com/ul/hsv8y8j5z9",
    phone: "09-7404444",
    hours: "07:00 - 17:00",
    image: "/branch-harash.jpg"
  },
  {
    id: 2,
    name: "סניף התלמיד",
    location: "טייבה",
    address: "אזור תעשייה טייבה",
    waze: "https://waze.com/ul/hsv8zdz9x1",
    phone: "09-7995555",
    hours: "07:30 - 18:00",
    image: "/branch-tayibe.jpg"
  }
];

export default function BranchesPage() {
  return (
    <div className="min-h-screen bg-[#FCF9F5] pb-20" dir="rtl">
      <header className="p-6 flex items-center gap-4">
        <Link href="/"><ArrowLeft className="text-slate-900" /></Link>
        <h1 className="text-2xl font-black text-slate-900">{`הסניפים שלנו`}</h1>
      </header>

      <main className="p-6 space-y-6 max-w-2xl mx-auto">
        {BRANCHES.map((branch) => (
          <div key={branch.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100">
            <div className="h-40 bg-slate-200 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-6 right-6 text-white">
                <h2 className="text-2xl font-black">{branch.name}</h2>
                <p className="text-xs font-bold opacity-80">{branch.location}</p>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin size={18} className="text-blue-600" />
                  <span className="text-sm font-bold">{branch.address}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Clock size={18} className="text-blue-600" />
                  <span className="text-sm font-bold">{`פתוח היום: ${branch.hours}`}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => window.open(branch.waze)}
                  className="bg-[#33f0ff] hover:bg-[#2edceb] text-slate-900 rounded-2xl font-black gap-2 h-14 shadow-lg shadow-cyan-100"
                >
                  <Navigation size={18} /> {`WAZE`}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open(`tel:${branch.phone}`)}
                  className="border-slate-200 rounded-2xl font-black gap-2 h-14"
                >
                  <Phone size={18} /> {`התקשר`}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
