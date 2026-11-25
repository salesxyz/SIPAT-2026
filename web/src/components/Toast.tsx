import { CheckCircle2, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type T = { id: number; kind: "ok" | "erro"; text: string };
const Ctx = createContext<(text: string, kind?: "ok" | "erro") => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const push = useCallback((text: string, kind: "ok" | "erro" = "ok") => {
    const id = Date.now() + Math.random();
    setItems((i) => [...i, { id, kind, text }]);
    setTimeout(() => setItems((i) => i.filter((x) => x.id !== id)), 4500);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lift ${t.kind === "ok" ? "bg-sipat-dark" : "bg-red-600"}`}>
            {t.kind === "ok" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}{t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
