import { ChatWindow } from "../components/ChatWindow";

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-4">
        <header className="flex flex-col items-center mb-6">
          <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-2">
            Professional Grade AI
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">ח. סבן AI</h1>
          <p className="text-slate-500 font-bold text-sm italic">המומחה הטכני שלך בשטח</p>
        </header>
        
        <ChatWindow />
        
        <footer className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-tight">
          Powered by Saban Tech & Gemini 3 Flash © 2026
        </footer>
      </div>
    </main>
  );
}
