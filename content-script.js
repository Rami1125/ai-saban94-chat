// פונקציה ליצירת הפופאבר של ח. סבן
function createJoniPopup(url, productName = "מוצר כללי") {
  const old = document.getElementById("joni-saban-popup");
  if (old) old.remove();

  const wrapper = document.createElement("div");
  wrapper.id = "joni-saban-popup";
  Object.assign(wrapper.style, {
    position: "fixed", top: "25px", right: "25px", zIndex: "1000000",
    maxWidth: "340px", background: "#ffffff", borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)", padding: "20px",
    fontFamily: "Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    direction: "rtl", border: "2px solid #0b57d0"
  });

  const header = document.createElement("div");
  header.innerHTML = `<span style="font-size: 18px;">🏗️</span> <b>ח. סבן - לינק מוכן</b>`;
  header.style.cssText = "margin-bottom: 12px; color: #1f3a66; border-bottom: 1px solid #eee; padding-bottom: 8px;";

  const productInfo = document.createElement("div");
  productInfo.textContent = `עבור: ${productName}`;
  productInfo.style.cssText = "font-weight: bold; margin-bottom: 10px; font-size: 14px; color: #333;";

  const link = document.createElement("a");
  link.href = url;
  link.textContent = "פתח כרטיס מוצר בלשונית חדשה";
  link.target = "_blank";
  link.style.cssText = "display: block; color: #1a73e8; margin-bottom: 15px; font-size: 13px; text-decoration: none;";

  const btns = document.createElement("div");
  btns.style.display = "flex";
  btns.style.gap = "10px";

  const copyBtn = createBtn("העתק לינק", true);
  copyBtn.onclick = async () => {
    await navigator.clipboard.writeText(url);
    showToast("הלינק הועתק בהצלחה! ✅");
  };

  const closeBtn = createBtn("סגור", false);
  closeBtn.onclick = () => wrapper.remove();

  btns.append(copyBtn, closeBtn);
  wrapper.append(header, productInfo, link, btns);
  document.body.appendChild(wrapper);
}

function createBtn(text, isPrimary) {
  const btn = document.createElement("button");
  btn.textContent = text;
  Object.assign(btn.style, {
    padding: "8px 15px", borderRadius: "8px", border: "none", cursor: "pointer",
    fontSize: "13px", fontWeight: "600", flex: "1",
    background: isPrimary ? "#0b57d0" : "#f1f3f4",
    color: isPrimary ? "#fff" : "#3c4043"
  });
  return btn;
}

function showToast(msg) {
  const toast = document.createElement("div");
  toast.textContent = msg;
  Object.assign(toast.style, {
    position: "fixed", bottom: "30px", left: "50%", transform: "translateX(-50%)",
    background: "#323232", color: "#fff", padding: "12px 24px", borderRadius: "25px",
    zIndex: "2000000", fontSize: "14px"
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// חיבור ל-Firebase Streaming
async function initStream() {
  const { joniStreamUrl } = await chrome.storage.sync.get(["joniStreamUrl"]);
  if (!joniStreamUrl) return;

  const es = new EventSource(joniStreamUrl);
  es.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    const data = payload.data || payload;
    if (data && data.url) {
      createJoniPopup(data.url, data.productName || data.text);
    }
  };
}

initStream();
