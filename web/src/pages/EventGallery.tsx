import { Camera, CalendarDays, Link2, Loader2, MapPin, Share2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { PhotoBrowser, type Query } from "../components/PhotoBrowser";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";
import { fmtDate } from "../lib/format";
import type { Photo, PhotoPage, PublicEvent } from "../lib/types";

export default function EventGallery() {
  const { token = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [missing, setMissing] = useState(false);
  const albumId = params.get("album") ?? undefined;

  useEffect(() => {
    api<{ event: PublicEvent }>(`/public/events/${token}`).then((r) => setEvent(r.event)).catch(() => setMissing(true));
  }, [token]);

  const load = useCallback(
    (q: Query) => {
      const qs = new URLSearchParams({ page: String(q.page), limit: String(q.limit), sort: q.sort });
      if (q.q) qs.set("q", q.q);
      if (q.albumId) qs.set("albumId", q.albumId);
      return api<PhotoPage>(`/public/events/${token}/photos?${qs}`);
    },
    [token],
  );
  const downloadHref = useCallback((p: Photo) => `/api/public/events/${token}/photos/${p.id}/download`, [token]);

  const share = async () => {
    const url = `${location.origin}/galeria/${token}${albumId ? `?album=${albumId}` : ""}`;
    const album = event?.albums.find((a) => a.id === albumId);
    try {
      if (navigator.share) await navigator.share({ title: `${event?.name}${album ? ` – ${album.name}` : ""}`, url });
      else { await navigator.clipboard.writeText(url); toast("Link copiado!"); }
    } catch (e) {
      if ((e as DOMException).name !== "AbortError") { try { await navigator.clipboard.writeText(url); toast("Link copiado!"); } catch { toast("Não foi possível copiar o link", "erro"); } }
    }
  };

  if (missing) return <div className="mx-auto max-w-md px-6 py-20 text-center"><h1 className="text-2xl font-bold">Galeria não encontrada</h1><p className="mt-2 text-gray-600">Confira o link ou escaneie o QR Code do evento novamente.</p><Link className="btn-primary mt-6" to="/galeria">Ver outros eventos</Link></div>;
  if (!event) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="animate-spin text-sipat" size={32} /></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-5">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">{event.name}</h1>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            {event.date && <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />{fmtDate(event.date)}</span>}
            {event.location && <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{event.location}</span>}
          </p>
          {event.description && <p className="mt-2 max-w-2xl text-sm text-gray-600">{event.description}</p>}
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={share}>{typeof navigator.share === "function" ? <Share2 size={18} /> : <Link2 size={18} />}Compartilhar {albumId ? "álbum" : "galeria"}</button>
          {event.accepting && <Link className="btn-primary" to={`/e/${token}`}><Camera size={18} />Enviar fotos</Link>}
        </div>
      </div>
      <PhotoBrowser
        load={load}
        albums={event.albums}
        albumId={albumId}
        onAlbum={(id) => setParams(id ? { album: id } : {}, { replace: true })}
        downloadHref={downloadHref}
        emptyHint="Seja o primeiro a compartilhar um momento deste evento."
      />
    </div>
  );
}
