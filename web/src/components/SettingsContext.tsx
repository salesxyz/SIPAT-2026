import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type { Settings } from "../lib/types";

const Ctx = createContext<{ settings: Settings; reload: () => void; error?: string }>({ settings: {}, reload: () => {} });
export const useSettings = () => useContext(Ctx);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({});
  const [error, setError] = useState<string>();
  const load = () =>
    api<{ settings: Settings }>("/settings")
      .then((r) => {
        setSettings(r.settings);
        setError(undefined);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Não foi possível carregar as configurações"));
  useEffect(() => { load(); }, []);
  return <Ctx.Provider value={{ settings, reload: load, error }}>{children}</Ctx.Provider>;
}
