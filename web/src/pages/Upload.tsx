import { AlertTriangle, Camera, CheckCircle2, ImagePlus, Images, Loader2, RefreshCw, RotateCcw, ShieldCheck, SwitchCamera, Trash2, Upload as UploadIcon, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSettings } from "../components/SettingsContext";
import { api, ApiError, shrinkImage, uploadPhoto } from "../lib/api";
import { fmtDate, plural } from "../lib/format";
import type { PublicEvent } from "../lib/types";

interface Item { id: string; blob: Blob; url: string; name: string; status: "ready" | "uploading" | "done" | "error"; progress: number; error?: string }
const uid = () => Math.random().toString(36).slice(2);

function cameraErrorMessage(e: unknown): string {
  const name = (e as DOMException)?.name;
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) return "Este navegador só libera a câmera em conexão segura (HTTPS). Use o botão “Câmera do celular” abaixo.";
  if (name === "NotAllowedError" || name === "SecurityError") return "A permissão da câmera foi negada. Libere o acesso nas configurações do navegador ou use o botão “Câmera do celular”.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "Nenhuma câmera foi encontrada neste aparelho. Escolha uma foto da galeria.";
  if (name === "NotReadableError") return "A câmera está em uso por outro aplicativo. Feche-o e tente de novo.";
  return "Não foi possível abrir a câmera. Use o botão “Câmera do celular” ou escolha da galeria.";
}

function CameraView({ onCapture, onClose, onNative, count }: { onCapture: (b: Blob) => void; onClose: () => void; onNative: () => void; count: number }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null);

  const stop = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; };

  useEffect(() => {
    let cancelled = false;
    setReady(false); setError("");
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new DOMException("sem API", "SecurityError");
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stop(); stream.current = s;
        if (video.current) { video.current.srcObject = s; await video.current.play().catch(() => {}); }
        setReady(true);
      } catch (e) { if (!cancelled) setError(cameraErrorMessage(e)); }
    })();
    return () => { cancelled = true; };
  }, [facing]);
  useEffect(() => () => stop(), []);
  useEffect(() => () => { if (shot) URL.revokeObjectURL(shot.url); }, [shot]);

  const snap = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    c.toBlob((b) => b && setShot({ blob: b, url: URL.createObjectURL(b) }), "image/jpeg", 0.9);
    navigator.vibrate?.(30);
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black text-white" role="dialog" aria-modal="true" aria-label="Câmera">
      <div className="flex items-center justify-between p-4" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
        <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full bg-white/15" aria-label="Fechar câmera"><X /></button>
        {!shot && <button onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))} className="grid h-11 w-11 place-items-center rounded-full bg-white/15" aria-label="Alternar câmera"><SwitchCamera /></button>}
      </div>

      <div className="relative min-h-0 flex-1">
        {/* O <video> fica sempre montado: recriá-lo perderia o stream da câmera após "Refazer". */}
        <video ref={video} playsInline muted autoPlay className={`h-full w-full object-cover ${shot || error ? "invisible" : ""}`} />
        {!shot && !error && (
          <>
            <div className="viewfinder pointer-events-none absolute inset-8 text-white/90" aria-hidden><span className="vf-b" /></div>
            {!ready && <div className="absolute inset-0 grid place-items-center"><Loader2 className="animate-spin" size={32} /></div>}
          </>
        )}
        {shot && <img src={shot.url} alt="Prévia da foto" className="absolute inset-0 h-full w-full bg-black object-contain" />}
        {error && !shot && (
          <div className="absolute inset-0 grid place-items-center p-8 text-center">
            <div className="max-w-sm space-y-4">
              <AlertTriangle className="mx-auto text-amber-300" size={40} />
              <p className="text-sm leading-relaxed text-white/90">{error}</p>
              <button className="btn-primary w-full" onClick={onNative}><Camera size={18} />Câmera do celular</button>
              <button className="btn w-full bg-white/15 text-white" onClick={onClose}>Voltar</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 p-6" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
        {shot ? (
          <>
            <button className="btn flex-1 bg-white/15 text-white" onClick={() => setShot(null)}><RotateCcw size={18} />Refazer</button>
            <button className="btn-primary flex-1" onClick={() => { onCapture(shot.blob); setShot(null); }}><CheckCircle2 size={18} />Usar foto</button>
          </>
        ) : !error && (
          <>
            <span className="w-28" />
            <button onClick={snap} disabled={!ready} aria-label="Tirar foto" className="grid h-20 w-20 place-items-center rounded-full border-4 border-white disabled:opacity-40">
              <span className="h-14 w-14 rounded-full bg-white transition active:scale-90" />
            </button>
            <span className="flex w-28 justify-end">
              {count > 0 && <button onClick={onClose} className="btn-primary !px-4">Concluir ({count})</button>}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default function Upload() {
  const { token = "" } = useParams();
  const { settings } = useSettings();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loadError, setLoadError] = useState("");
  const [albumId, setAlbumId] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const nativeCam = useRef<HTMLInputElement>(null);
  const pick = useRef<HTMLInputElement>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const loadEvent = useCallback(() => {
    setLoadError("");
    api<{ event: PublicEvent }>(`/public/events/${token}`)
      .then((r) => { setEvent(r.event); setAlbumId(r.event.albums[0]?.id ?? ""); })
      .catch((e: ApiError) => setLoadError(e.status === 404 ? "not-found" : e.message));
  }, [token]);
  useEffect(loadEvent, [loadEvent]);
  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url)), []);

  const add = (blobs: { blob: Blob; name: string }[]) =>
    setItems((prev) => [...prev, ...blobs.map(({ blob, name }) => ({ id: uid(), blob, name, url: URL.createObjectURL(blob), status: "ready" as const, progress: 0 }))]);
  const onFiles = (files: FileList | null) => {
    if (!files?.length) return;
    add([...files].filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(f.name)).map((f) => ({ blob: f, name: f.name })));
  };
  const remove = (id: string) => setItems((prev) => { const it = prev.find((i) => i.id === id); if (it) URL.revokeObjectURL(it.url); return prev.filter((i) => i.id !== id); });

  const pending = items.filter((i) => i.status === "ready" || i.status === "error");
  const done = items.filter((i) => i.status === "done");
  const overall = items.length ? Math.round(items.reduce((s, i) => s + (i.status === "done" ? 100 : i.progress), 0) / items.length) : 0;
  const patch = (id: string, p: Partial<Item>) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)));

  const send = async () => {
    setSending(true);
    let ok = 0;
    for (const it of itemsRef.current.filter((i) => i.status === "ready" || i.status === "error")) {
      patch(it.id, { status: "uploading", progress: 0, error: undefined });
      try {
        const small = await shrinkImage(it.blob);
        const name = it.name.replace(/\.[^.]*$/, "") + ".jpg";
        await uploadPhoto(token, small, name, albumId || undefined, (p) => patch(it.id, { progress: Math.min(p, 99) }));
        patch(it.id, { status: "done", progress: 100 });
        ok++;
      } catch (e) {
        patch(it.id, { status: "error", error: (e as Error).message });
        if (e instanceof ApiError && e.code === "evento_encerrado") loadEvent();
      }
    }
    setSentCount((n) => n + ok);
    setSending(false);
  };

  if (loadError === "not-found") return <Msg icon={<AlertTriangle size={32} />} title="QR Code não reconhecido" text="Este link não corresponde a nenhum evento. Escaneie o QR Code do evento novamente ou peça um novo à organização." />;
  if (loadError) return <Msg icon={<AlertTriangle size={32} />} title="Não foi possível carregar" text={loadError} action={<button className="btn-primary" onClick={loadEvent}><RefreshCw size={18} />Tentar de novo</button>} />;
  if (!event) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="animate-spin text-sipat" size={32} /></div>;
  if (!event.accepting) return <Msg icon={<ShieldCheck size={32} />} title="Envio de fotos encerrado" text={`O evento “${event.name}” não está recebendo novas fotos agora. Você ainda pode ver a galeria.`} action={<Link className="btn-primary" to={`/galeria/${token}`}><Images size={18} />Ver galeria</Link>} />;

  const allDone = items.length > 0 && pending.length === 0 && !sending;

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-10">
      <input ref={nativeCam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ""; setCameraOpen(false); }} />
      <input ref={pick} type="file" accept="image/jpeg,image/png,image/webp,image/*" multiple hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />

      <div className="card overflow-hidden">
        <div className="bg-sipat px-6 py-6 text-white">
          <p className="text-sm font-semibold text-white/80">Você está enviando fotos para</p>
          <h1 className="mt-1 text-2xl font-extrabold !text-white sm:text-3xl">{event.name}</h1>
          <p className="mt-1 text-sm text-white/80">{[fmtDate(event.date), event.location].filter(Boolean).join(" • ")}</p>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {event.albums.length > 1 && (
            <div>
              <label className="label" htmlFor="album">Álbum</label>
              <select id="album" className="field" value={albumId} onChange={(e) => setAlbumId(e.target.value)}>
                {event.albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}

          {allDone ? (
            <div className="grid place-items-center gap-3 py-6 text-center" role="status">
              <span className="grid h-20 w-20 animate-pop place-items-center rounded-full bg-sipat-light text-sipat"><CheckCircle2 size={44} /></span>
              <h2 className="text-2xl font-bold">Fotos enviadas!</h2>
              <p className="text-sm text-gray-600">{plural(sentCount, "foto foi adicionada", "fotos foram adicionadas")} à galeria do evento. Obrigado por compartilhar!</p>
              <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row">
                <button className="btn-secondary flex-1" onClick={() => { items.forEach((i) => URL.revokeObjectURL(i.url)); setItems([]); setSentCount(0); }}><Camera size={18} />Enviar mais fotos</button>
                <Link className="btn-primary flex-1" to={`/galeria/${token}`}><Images size={18} />Ver galeria</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="viewfinder rounded-3xl bg-sipat-light p-5 text-sipat">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button className="btn-primary !min-h-[64px] !text-base" onClick={() => setCameraOpen(true)} disabled={sending}><Camera size={22} />Abrir câmera</button>
                  <button className="btn-secondary !min-h-[64px] !text-base" onClick={() => pick.current?.click()} disabled={sending}><ImagePlus size={22} />Escolher da galeria</button>
                </div>
                <span className="vf-b" />
              </div>

              {items.length === 0 && <p className="text-center text-sm text-gray-500">Tire uma foto ou escolha da galeria. Você confere tudo antes de enviar.</p>}

              {items.length > 0 && (
                <>
                  <ul className="grid grid-cols-3 gap-2.5">
                    {items.map((i) => (
                      <li key={i.id} className="relative aspect-square overflow-hidden rounded-2xl bg-sipat-light">
                        <img src={i.url} alt={`Prévia de ${i.name}`} className={`h-full w-full object-cover ${i.status === "done" ? "opacity-60" : ""}`} />
                        {i.status === "uploading" && (
                          <div className="absolute inset-x-0 bottom-0 bg-black/55 p-1.5"><div className="h-1.5 overflow-hidden rounded-full bg-white/30"><div className="h-full bg-white transition-all" style={{ width: `${i.progress}%` }} /></div></div>
                        )}
                        {i.status === "done" && <span className="absolute inset-0 grid place-items-center text-white"><CheckCircle2 className="drop-shadow" size={30} /></span>}
                        {i.status === "error" && <span className="absolute inset-0 grid place-items-center bg-red-600/80 p-1 text-center text-[11px] font-semibold leading-tight text-white">{i.error}</span>}
                        {(i.status === "ready" || i.status === "error") && !sending && (
                          <button onClick={() => remove(i.id)} className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white" aria-label={`Descartar ${i.name}`}><Trash2 size={15} /></button>
                        )}
                      </li>
                    ))}
                  </ul>

                  {sending && (
                    <div role="progressbar" aria-valuenow={overall} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso do envio">
                      <div className="mb-1 flex justify-between text-sm font-semibold text-sipat-dark"><span>Enviando…</span><span>{overall}%</span></div>
                      <div className="h-3 overflow-hidden rounded-full bg-sipat-light"><div className="h-full rounded-full bg-sipat transition-all" style={{ width: `${overall}%` }} /></div>
                    </div>
                  )}

                  <button className="btn-primary w-full !min-h-[56px] !text-base" onClick={send} disabled={sending || pending.length === 0}>
                    {sending ? <><Loader2 className="animate-spin" size={20} />Enviando {done.length + 1} de {items.length}</> : <><UploadIcon size={20} />{pending.some((p) => p.status === "error") ? "Tentar enviar de novo" : `Enviar ${plural(pending.length, "foto", "fotos")}`}</>}
                  </button>
                </>
              )}
            </>
          )}

          <p className="text-center text-xs leading-relaxed text-gray-500">
            Ao enviar, você autoriza o uso das fotos pela organização do evento. Veja o <Link to="/privacidade" className="font-semibold text-sipat underline">aviso de privacidade</Link>.
            {settings.retention_days && settings.retention_days !== "0" ? ` As imagens são mantidas por ${settings.retention_days} dias.` : ""}
          </p>
        </div>
      </div>

      {cameraOpen && (
        <CameraView
          count={items.filter((i) => i.status !== "done").length}
          onClose={() => setCameraOpen(false)}
          onNative={() => nativeCam.current?.click()}
          onCapture={(blob) => add([{ blob, name: `foto-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.jpg` }])}
        />
      )}
    </div>
  );
}

function Msg({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-md place-items-center gap-4 px-6 py-20 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-3xl bg-sipat-light text-sipat">{icon}</span>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm leading-relaxed text-gray-600">{text}</p>
      {action}
    </div>
  );
}
