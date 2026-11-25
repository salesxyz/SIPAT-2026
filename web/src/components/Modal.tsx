import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-black/50 p-0 sm:place-items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-lift sm:rounded-3xl ${wide ? "sm:max-w-2xl" : "sm:max-w-md"}`}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sipat-light" aria-label="Fechar"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Confirm({ title, text, action, danger = true, onConfirm, onClose }: { title: string; text: string; action: string; danger?: boolean; onConfirm: () => Promise<void> | void; onClose: () => void }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm leading-relaxed text-gray-600">{text}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>Cancelar</button>
        <button className={danger ? "btn-danger" : "btn-primary"} onClick={async () => { await onConfirm(); onClose(); }}>{action}</button>
      </div>
    </Modal>
  );
}
