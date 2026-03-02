import { ChatShell } from "@/components/chat/chat-shell"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Saban AI - Smart Assistant",
  description: "מערכת הבינה המלאכותית של ח. סבן חומרי בניין - ייעוץ מקצועי, חישוב כמויות ומלאי בזמן אמת",
}

export default function ChatPage() {
  return (
    <main className="relative min-h-dvh w-full bg-[#fbfbfb] dark:bg-[#020617] overflow-hidden">
      {/* שכבת רקע דקורטיבית גלובלית לדף */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px]" />
      </div>

      {/* השלד המרכזי של הצ'אט */}
      <ChatShell />
    </main>
  )
}
