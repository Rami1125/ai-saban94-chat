"use client";
import { Home, Package, MapPin, MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNav() {
  const pathname = usePathname();
  
  const navItems = [
    { icon: <Home size={20} />, label: "בית", href: "/" },
    { icon: <Package size={20} />, label: "חנות", href: "/shop" },
    { icon: <MapPin size={20} />, label: "סניפים", href: "/branches" },
    { icon: <MessageSquare size={20} />, label: "AI יועץ", href: "/chat" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-3 flex justify-between items-center md:hidden z-50 rounded-t-[2.5rem] shadow-2xl">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1">
          <div className={`p-2 rounded-xl transition-colors ${pathname === item.href ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
            {item.icon}
          </div>
          <span className={`text-[10px] font-black ${pathname === item.href ? 'text-blue-600' : 'text-slate-400'}`}>
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
