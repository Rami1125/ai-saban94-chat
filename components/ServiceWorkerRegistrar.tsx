"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.hostname !== "localhost") {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => console.log("Saban SW Active:", registration.scope),
          (err) => console.log("SW Registration failed:", err)
        );
      });
    }
  }, []);

  return null;
}
