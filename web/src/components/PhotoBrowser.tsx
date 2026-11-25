import { Check, Download, FolderOpen, ImageOff, LayoutGrid, List, Loader2, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { fmtBytes, fmtDateTime, plural } from "../lib/format";
import type { Album, Photo, PhotoPage } from "../lib/types";
import { Lightbox } from "./Lightbox";

export type Sort = "recent" | "oldest" | "name";
export interface Query { page: number; limit: number; q: string; sort: Sort; albumId: string | undefined }

interface Props {
  load: (q: Query) => Promise<PhotoPage>;
  albums: Album[];
  albumId: string | undefined;
  onAlbum: (id: string | undefined) => void;
  downloadHref: (p: Photo) => string;
  reloadKey?: number;
  /** Modo administrador: seleção e exclusão em lote */
  onDelete?: (ids: string[]) => Promise<void>;
  emptyHint?: string;
}

const PAGE = 48;

export function PhotoBrowser({ load, albums, albumId, onAlbum, downloadHref, reloadKey = 0, onDelete, emptyHint }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [open, setOpen] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const sentinel = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  useEffect(() => { const t = setTimeout(() => setSearch(q.trim()), 300); return () => clearTimeout(t); }, [q]);

  const fetchPage = useCallback(async (p: number, replace: boolean) => {
    const id = ++seq.current;
    setLoading(true); setError("");
    try {
      const r = await load({ page: p, limit: PAGE, q: search, sort, albumId });
      if (id !== seq.current) return;
      setTotal(r.total); setPage(p);
      setPhotos((prev) => (replace ? r.photos : [...prev, ...r.photos]));
    } catch (e: any) {
      if (id === seq.current) setError(e.message);
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [load, search, sort, albumId]);

  useEffect(() => { setSelected(new Set()); fetchPage(1, true); }, [fetchPage, reloadKey]);

  const hasMore = photos.length < total;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || loading) return;
    const io = new IntersectionObserver((en) => en[0].isIntersecting && fetchPage(page + 1, false), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, page, fetchPage]);

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selecting = selected.size > 0;
  const click = (i: number) => (selecting ? toggle(photos[i].id) : setOpen(i));

  return (
    <div>
      {albums.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Álbuns">
          <button role="tab" aria-selected={!albumId} onClick={() => onAlbum(undefined)} className={`chip !px-4 !py-2 text-sm whitespace-nowrap ${!albumId ? "bg-sipat text-white" : "bg-white text-sipat-dark shadow-card"}`}>
            <FolderOpen size={16} />Todos os álbuns
          </button>
          {albums.map((a) => (
            <button key={a.id} role="tab" aria-selected={albumId === a.id} onClick={() => onAlbum(a.id)} className={`chip !px-4 !py-2 text-sm whitespace-nowrap ${albumId === a.id ? "bg-sipat text-white" : "bg-white text-sipat-dark shadow-card"}`}>
              <FolderOpen size={16} />{a.name}<span className="opacity-70">{a.photoCount}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sipat" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="field !pl-11" placeholder="Pesquisar pelo nome da foto" aria-label="Pesquisar fotos" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field !w-auto" aria-label="Ordenar">
          <option value="recent">Mais recentes</option>
          <option value="oldest">Mais antigas</option>
          <option value="name">Nome (A–Z)</option>
        </select>
        <div className="flex rounded-2xl bg-white p-1 shadow-card" role="group" aria-label="Modo de exibição">
          <button onClick={() => setView("grid")} aria-pressed={view === "grid"} aria-label="Grade" className={`grid h-10 w-10 place-items-center rounded-xl ${view === "grid" ? "bg-sipat text-white" : "text-sipat-dark"}`}><LayoutGrid size={18} /></button>
          <button onClick={() => setView("list")} aria-pressed={view === "list"} aria-label="Lista" className={`grid h-10 w-10 place-items-center rounded-xl ${view === "list" ? "bg-sipat text-white" : "text-sipat-dark"}`}><List size={18} /></button>
        </div>
      </div>

      <div className="mb-3 flex min-h-[40px] items-center justify-between gap-3">
        <p className="text-sm font-semibold text-sipat-dark" aria-live="polite">{plural(total, "foto", "fotos")}{search && ` para “${search}”`}</p>
        {onDelete && selecting && (
          <div className="flex items-center gap-2">
            <span className="text-sm">{selected.size} selecionada{selected.size > 1 ? "s" : ""}</span>
            <button className="btn-ghost !min-h-[40px]" onClick={() => setSelected(new Set())}>Limpar</button>
            <button className="btn-danger !min-h-[40px]" onClick={async () => { await onDelete([...selected]); setSelected(new Set()); }}><Trash2 size={16} />Excluir</button>
          </div>
        )}
      </div>

      {error && <p className="mb-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error} <button className="font-bold underline" onClick={() => fetchPage(1, true)}>Tentar de novo</button></p>}

      {!loading && !error && photos.length === 0 && (
        <div className="card grid place-items-center gap-3 px-6 py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-3xl bg-sipat-light text-sipat"><ImageOff size={30} /></span>
          <p className="font-display text-lg font-bold text-sipat-dark">{search ? "Nenhuma foto encontrada" : "Ainda não há fotos aqui"}</p>
          <p className="max-w-sm text-sm text-gray-500">{search ? "Tente outro nome ou limpe a pesquisa." : emptyHint ?? "As fotos enviadas pelos participantes aparecem aqui."}</p>
        </div>
      )}

      {view === "grid" ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {photos.map((p, i) => (
            <li key={p.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-sipat-light shadow-card">
              <button onClick={() => click(i)} className="absolute inset-0" aria-label={`Abrir ${p.fileName}`}>
                <img src={p.thumbUrl} alt={p.fileName} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              </button>
              {onDelete && (
                <button onClick={() => toggle(p.id)} aria-label={selected.has(p.id) ? "Desmarcar foto" : "Selecionar foto"} aria-pressed={selected.has(p.id)}
                  className={`absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full border-2 border-white shadow transition ${selected.has(p.id) ? "bg-sipat text-white" : "bg-black/30 text-transparent group-hover:text-white"} ${selecting ? "!text-white" : ""}`}>
                  <Check size={16} strokeWidth={3} />
                </button>
              )}
              <a href={downloadHref(p)} aria-label={`Baixar ${p.fileName}`} className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-sipat-dark opacity-100 shadow transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"><Download size={16} /></a>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="card divide-y divide-gray-100 overflow-hidden">
          {photos.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 p-2.5 hover:bg-sipat-gray">
              {onDelete && <input type="checkbox" className="h-5 w-5 accent-[#168447]" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Selecionar ${p.fileName}`} />}
              <button onClick={() => click(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <img src={p.thumbUrl} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-sipat-dark">{p.fileName}</span>
                  <span className="block text-xs text-gray-500">{fmtDateTime(p.uploadedAt)} · {fmtBytes(p.fileSize)}</span></span>
              </button>
              <a href={downloadHref(p)} aria-label={`Baixar ${p.fileName}`} className="grid h-10 w-10 place-items-center rounded-full text-sipat-dark hover:bg-sipat-light"><Download size={18} /></a>
            </li>
          ))}
        </ul>
      )}

      <div ref={sentinel} className="grid h-16 place-items-center">
        {loading && <Loader2 className="animate-spin text-sipat" aria-label="Carregando" />}
        {!loading && hasMore && <button className="btn-secondary" onClick={() => fetchPage(page + 1, false)}>Carregar mais</button>}
      </div>

      {open !== null && <Lightbox photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} downloadHref={downloadHref} />}
    </div>
  );
}
