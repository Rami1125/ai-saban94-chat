// בתוך הקומפוננטה SabanAdminDashboard ב-app/admin/page.tsx

const [isEnriching, setIsEnriching] = useState(false);

const runEnrichment = async () => {
  setIsEnriching(true);
  try {
    const res = await fetch('/api/enrich-all', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert(`הסוכן סיים! עודכנו: ${data.updated.join(', ')}`);
      fetchDashboardData(); // רענון הסטטיסטיקות בלוח
    } else {
      alert(data.message || "לא נמצאו מוצרים לעדכון");
    }
  } catch (e) {
    alert("שגיאה בהפעלת הסוכן");
  } finally {
    setIsEnriching(false);
  }
};

// ... בתוך ה-Return, נחליף את הכפתור הקיים:

<button 
  onClick={runEnrichment}
  disabled={isEnriching}
  className={`w-full py-5 rounded-[22px] font-black text-sm mt-8 shadow-xl transition-all ${
    isEnriching ? 'bg-slate-400 cursor-not-allowed' : 'bg-white text-blue-900 hover:scale-[1.02]'
  }`}
>
  {isEnriching ? (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className="animate-spin" size={16} />
      הסוכן סורק ומעדכן...
    </div>
  ) : "הפעל סוכן העשרה"}
</button>
