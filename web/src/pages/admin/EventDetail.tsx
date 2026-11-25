import { ArrowLeft, Camera, Copy, Download, ExternalLink, FolderPlus, Loader2, Pencil, QrCode, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EventForm } from "../../components/EventForm";
import { Confirm, Modal } from "../../components/Modal";
import { PhotoBrowser, type Query } from "../../components/PhotoBrowser";
import { useToast } from "../../components/Toast";
import { api } from "../../lib/api";
import { fmtDate } from "../../lib/format";
import type { AdminAlbum, AdminEvent, Photo, PhotoPage } from "../../lib/types";

export default function EventDetail() {
  const { id = "" } = useParams();
  const go = useNavigate();
  const toast = useToast();
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [albums, setAlbums] = useState<AdminAlbum[]>([]);
  const [albumId, setAlbumId] = useState<string | undefined>();
  const [err, setErr] = useState("");
  const [reload, setReload] = useState(0);
  const [qrKey, setQrKey] = useState(0);
  const [modal, setModal] = useState<null | "edit" | "delete" | "regen" | "album" | "album-edit" | "album-delete">(null);
  const [albumName, setAlbumName] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const [e, a] = await Promise.all([api<{ event: AdminEvent }>(`/admin/events/${id}`), api<{ albums: AdminAlbum[] }>(`/admin/events/${id}/albums`)]);
      setEvent(e.event); setAlbums(a.albums);
    } catch (e: any) { setErr(e.message); }
  }, [id]);
  useEffect(() => { loadAll(); }, [loadAll]);

  const load = useCallback((q: Query) => {
    const qs = new URLSearchParams({ eventId: id, page: String(q.page), limit: String(q.limit), sort: q.sort });
    if (q.q) qs.set("q", q.q);
    if (q.albumId) qs.set("albumId", q.albumId);
    return api<PhotoPage>(`/admin/photos?${qs}`);
  }, [id]);
  const downloadHref = useCallback((p: Photo) => `/api/admin/photos/${p.id}/download`, []);

  if (err) return <div><p className="rounded-2xl bg-red-50 p-4 text-red-700">{err}</p><Link to="/admin/eventos" className="btn-ghost mt-3">Voltar aos eventos</Link></div>;
  if (!event) return <Loader2 className="animate-spin text-sipat" />;

  const album = albums.find((a) => a.id === albumId);
  const patchEvent = async (body: object) => { try { const r = await api<{ event: AdminEvent }>(`/admin/events/${id}`, { method: "PATCH", body }); setEvent(r.event); } catch (e: any) { toast(e.message, "erro"); } };
  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); toast("Link copiado!"); } catch { toast("Não foi possível copiar", "erro"); } };

  const saveAlbum = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (modal === "album-edit" && album) await api(`/admin/albums/${album.id}`, { method: "PATCH", body: { name: albumName } });
      else { const r = await api<{ album: AdminAlbum }>(`/admin/events/${id}/albums`, { method: "POST", body: { name: albumName } }); setAlbumId(r.album.id); }
      toast(modal === "album-edit" ? "Álbum renomeado" : "Álbum criado"); setModal(null); loadAll();
    } catch (e: any) { toast(e.message, "erro"); }
  };

  const del = async (ids: string[]) => {
    try { await api("/admin/photos/bulk-delete", { method: "POST", body: { ids } }); toast(ids.length === 1 ? "Foto excluída" : `${ids.length} fotos excluídas`); setReload((n) => n + 1); loadAll(); }
    catch (e: any) { toast(e.message, "erro"); }
  };

  return (
    <div className="space-y-6">
      <Link to="/admin/eventos" className="inline-flex items-center gap-2 text-sm font-semibold text-sipat"><ArrowLeft size={16} />Eventos</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">{event.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{[fmtDate(event.date), event.location].filter(Boolean).join(" • ") || "Sem data ou local"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold shadow-card">
            <input type="checkbox" role="switch" className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-gray-300 transition checked:bg-sipat relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition checked:before:translate-x-4" checked={event.status === "active"} onChange={(e) => patchEvent({ status: e.target.checked ? "active" : "closed" })} />
            {event.status === "active" ? "Recebendo fotos" : "Envio desativado"}
          </label>
          <button className="btn-secondary" onClick={() => setModal("edit")}><Pencil size={18} />Editar</button>
          <button className="btn-secondary !text-red-600" onClick={() => setModal("delete")}><Trash2 size={18} />Excluir</button>
        </div>
      </div>

      <section className="card grid gap-6 p-5 md:grid-cols-[220px_1fr]" aria-labelledby="qr">
        <div className="viewfinder mx-auto w-full max-w-[220px] p-3 text-sipat">
          <img key={qrKey} src={`/api/admin/events/${id}/qrcode.png?size=600&v=${qrKey}`} alt={`QR Code do evento ${event.name}`} className="w-full rounded-xl" />
          <span className="vf-b" />
        </div>
        <div className="flex flex-col justify-center gap-4">
          <div><h2 id="qr" className="flex items-center gap-2 text-xl font-bold"><QrCode size={22} className="text-sipat" />QR Code do evento</h2>
            <p className="mt-1 text-sm text-gray-600">Imprima e coloque no local. Quem escanear cai direto na tela de envio deste evento.</p></div>
          <p className="break-all rounded-2xl bg-sipat-gray px-4 py-3 font-mono text-xs text-sipat-ink">{event.uploadUrl}</p>
          <div className="flex flex-wrap gap-2">
            <a className="btn-primary" href={`/api/admin/events/${id}/qrcode.png?size=1600&download`}><Download size={18} />Baixar QR Code (PNG)</a>
            <button className="btn-secondary" onClick={() => copy(event.uploadUrl)}><Copy size={18} />Copiar link</button>
            <a className="btn-secondary" href={event.uploadUrl} target="_blank" rel="noopener noreferrer"><Camera size={18} />Testar envio</a>
            <a className="btn-secondary" href={`/galeria/${event.qrCodeToken}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={18} />Galeria pública</a>
            <button className="btn-ghost !text-red-600" onClick={() => setModal("regen")}><RefreshCw size={18} />Gerar novo QR Code</button>
          </div>
        </div>
      </section>

      <section aria-labelledby="fotos">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="fotos" className="text-2xl font-bold">Álbuns e fotografias</h2>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => { setAlbumName(""); setModal("album"); }}><FolderPlus size={18} />Novo álbum</button>
            {album && <>
              <a className="btn-secondary" href={`/api/admin/albums/${album.id}/zip`}><Download size={18} />Baixar álbum (ZIP)</a>
              <button className="btn-secondary" onClick={() => { setAlbumName(album.name); setModal("album-edit"); }}><Pencil size={18} />Renomear</button>
              <button className="btn-secondary !text-red-600" onClick={() => setModal("album-delete")}><Trash2 size={18} />Excluir álbum</button>
            </>}
          </div>
        </div>
        <PhotoBrowser load={load} albums={albums} albumId={albumId} onAlbum={setAlbumId} downloadHref={downloadHref} reloadKey={reload} onDelete={del} emptyHint="Quando alguém enviar fotos pelo QR Code, elas aparecem aqui." />
      </section>

      {modal === "edit" && <EventForm event={event} onClose={() => setModal(null)} onSaved={(e) => { setEvent(e); setModal(null); toast("Evento atualizado"); }} />}
      {modal === "delete" && <Confirm title="Excluir evento" text={`Isso apaga “${event.name}”, todos os álbuns e ${event.photoCount} foto(s), inclusive os arquivos. Não dá para desfazer.`} action="Excluir evento" onClose={() => setModal(null)} onConfirm={async () => { try { await api(`/admin/events/${id}`, { method: "DELETE" }); toast("Evento excluído"); go("/admin/eventos"); } catch (e: any) { toast(e.message, "erro"); } }} />}
      {modal === "regen" && <Confirm title="Gerar novo QR Code" text="O QR Code e o link atuais deixam de funcionar. Você precisará reimprimir o novo QR Code." action="Gerar novo" onClose={() => setModal(null)} onConfirm={async () => { try { const r = await api<{ event: AdminEvent }>(`/admin/events/${id}/regenerate-token`, { method: "POST" }); setEvent(r.event); setQrKey((k) => k + 1); toast("Novo QR Code gerado"); } catch (e: any) { toast(e.message, "erro"); } }} />}
      {modal === "album-delete" && album && <Confirm title="Excluir álbum" text={`Isso apaga o álbum “${album.name}” e suas ${album.photoCount} foto(s). Não dá para desfazer.`} action="Excluir álbum" onClose={() => setModal(null)} onConfirm={async () => { try { await api(`/admin/albums/${album.id}`, { method: "DELETE" }); setAlbumId(undefined); toast("Álbum excluído"); setReload((n) => n + 1); loadAll(); } catch (e: any) { toast(e.message, "erro"); } }} />}
      {(modal === "album" || modal === "album-edit") && (
        <Modal title={modal === "album" ? "Novo álbum" : "Renomear álbum"} onClose={() => setModal(null)}>
          <form onSubmit={saveAlbum} className="space-y-4">
            <div><label className="label" htmlFor="alb">Nome do álbum</label><input id="alb" className="field" value={albumName} onChange={(e) => setAlbumName(e.target.value)} required maxLength={120} autoFocus placeholder="Ex.: Palestras" /></div>
            <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancelar</button><button className="btn-primary">Salvar álbum</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
