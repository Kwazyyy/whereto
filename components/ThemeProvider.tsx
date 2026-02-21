"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({ theme: "system", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

function getStoredTheme(): Theme {
  try {
    const raw = localStorage.getItem("whereto_prefs");
    const val = raw ? JSON.parse(raw).theme : null;
    if (val === "light" || val === "dark" || val === "system") return val;
    return "system";
  } catch {
    return "system";
  }
}

function applyTheme(theme: Theme) {
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    applyTheme(stored);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const current = getStoredTheme();
      if (current === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    try {
      const raw = localStorage.getItem("whereto_prefs");
      const prefs = raw ? JSON.parse(raw) : {};
      localStorage.setItem(
        "whereto_prefs",
        JSON.stringify({ ...prefs, theme: t })
      );
    } catch {}
    applyTheme(t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
