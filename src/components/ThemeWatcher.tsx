"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ThemeWatcher() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isAdmin = pathname.startsWith("/admin");
    const html = document.documentElement;

    if (!isAdmin) {
      // Force light theme on all storefront pages
      html.classList.remove("dark");
      html.style.colorScheme = "light";
    } else {
      // For admin workspace pages, re-apply the user's active theme selection
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") {
        html.classList.add("dark");
        html.style.colorScheme = "dark";
      } else {
        html.classList.remove("dark");
        html.style.colorScheme = "light";
      }
    }
  }, [pathname]);

  return null;
}
