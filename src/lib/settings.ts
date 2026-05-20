import { useEffect, useState } from "react";

const KEY = "hom.settings.v1";

export interface Settings {
  owner: string;
  client: string;
}

const DEFAULT: Settings = { owner: "", client: "" };

function read(): Settings {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT);

  useEffect(() => {
    setSettings(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setSettings(read());
    };
    window.addEventListener("storage", onStorage);
    const onCustom = () => setSettings(read());
    window.addEventListener("hom-settings-changed", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("hom-settings-changed", onCustom);
    };
  }, []);

  const save = (next: Partial<Settings>) => {
    const merged = { ...read(), ...next };
    window.localStorage.setItem(KEY, JSON.stringify(merged));
    setSettings(merged);
    window.dispatchEvent(new Event("hom-settings-changed"));
  };

  return { settings, save };
}
