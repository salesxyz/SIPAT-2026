import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { useEffect } from "react";
import { fmtDateTime, fmtBytes } from "../lib/format";
import type { Photo } from "../lib/types";

export function Lightbox({ photos, index, onIndex, onClose, downloadHref }: { photos: Photo[]; index: number; onIndex: (i: number) => void; onClose: () => void; downloadHref: (p: Photo) => string }) {
  const p = photos[index];
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index < photos.length - 1) onIndex(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
    };
    document.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = ""; };
  }, [index, photos.length, onClose, onIndex]);
  if (!p) return null;
  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Foto ampliada">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="truncate font-semibold">{p.fileName}</p>
          <p className="text-xs text-white/60">{fmtDateTime(p.uploadedAt)} · {fmtBytes(p.fileSize)} · {index + 1} de {photos.length}</p>
        </div>
        <div className="flex gap-2">
          <a href={downloadHref(p)} className="btn !bg-white/15 text-white hover:!bg-white/25"><Download size={18} /><span className="hidden sm:inline">Baixar</span></a>
          <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 hover:bg-white/25" aria-label="Fechar"><X size={20} /></button>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <img key={p.id} src={p.url} alt={p.fileName} className="max-h-full max-w-full rounded-xl object-contain" />
        {index > 0 && <button onClick={() => onIndex(index - 1)} className="absolute left-2 grid h-12 w-12 place-items-center rounded-full bg-white/20 text-white hover:bg-white/35" aria-label="Foto anterior"><ChevronLeft /></button>}
        {index < photos.length - 1 && <button onClick={() => onIndex(index + 1)} className="absolute right-2 grid h-12 w-12 place-items-center rounded-full bg-white/20 text-white hover:bg-white/35" aria-label="Próxima foto"><ChevronRight /></button>}
      </div>
    </div>
  );
}
