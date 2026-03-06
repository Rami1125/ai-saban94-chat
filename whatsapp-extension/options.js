// פונקציית עזר לבחירת אלמנטים מה-DOM
const $ = (id) => document.getElementById(id);

// אלמנטים בדף
const streamInput = $("url");
const saveBtn = $("save");

/**
 * טעינת ההגדרות הקיימות מה-Storage של הכרום ברגע פתיחת הדף
 */
(async function init() {
  try {
    const { joniStreamUrl } = await chrome.storage.sync.get(["joniStreamUrl"]);
    if (joniStreamUrl) {
      streamInput.value = joniStreamUrl;
      console.log("JONI: הגדרות נטענו בהצלחה.");
    }
  } catch (err) {
    console.error("JONI: שגיאה בטעינת ההגדרות", err);
  }
})();

/**
 * שמירת הכתובת החדשה ב-Storage
 */
saveBtn.addEventListener("click", async () => {
  const urlValue = (streamInput.value || "").trim();

  // 1. בדיקה שהשדה לא ריק
  if (!urlValue) {
    alert("נא להזין כתובת Firebase Stream תקינה.");
    return;
  }

  // 2. בדיקה שהכתובת היא URL חוקי
  try {
    new URL(urlValue);
  } catch (e) {
    alert("הכתובת שהזנת אינה חוקית. וודא שהיא מתחילה ב-https://");
    return;
  }

  // 3. שמירה ב-Chrome Storage Sync (מסתנכרן בין מחשבים אם מחוברים לחשבון גוגל)
  try {
    await chrome.storage.sync.set({ joniStreamUrl: urlValue });
    
    // פידבק למשתמש
    saveBtn.textContent = "נשמר בהצלחה! ✔️";
    saveBtn.style.background = "#008a00";
    
    setTimeout(() => {
      saveBtn.textContent = "שמור הגדרות";
      saveBtn.style.background = "#0b57d0";
    }, 2000);

    console.log("JONI: כתובת ה-Stream עודכנה ל-" + urlValue);
  } catch (err) {
    alert("שגיאה בשמירת ההגדרות.");
    console.error(err);
  }
});
