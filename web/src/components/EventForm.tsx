import { useState, type FormEvent } from "react";
import { api } from "../lib/api";
import type { AdminEvent } from "../lib/types";
import { Modal } from "./Modal";

export function EventForm({ event, onClose, onSaved }: { event?: AdminEvent; onClose: () => void; onSaved: (e: AdminEvent) => void }) {
  const [f, setF] = useState({ name: event?.name ?? "", description: event?.description ?? "", date: event?.date ?? "", location: event?.location ?? "", isListed: event?.isListed ?? true });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = event
        ? await api<{ event: AdminEvent }>(`/admin/events/${event.id}`, { method: "PATCH", body: f })
        : await api<{ event: AdminEvent }>("/admin/events", { method: "POST", body: f });
      onSaved(r.event);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal title={event ? "Editar evento" : "Novo evento"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="ev-name">Nome do evento</label><input id="ev-name" className="field" value={f.name} onChange={(e) => set("name", e.target.value)} required minLength={2} maxLength={120} autoFocus placeholder="Ex.: SIPAT 2026" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="ev-date">Data</label><input id="ev-date" type="date" className="field" value={f.date} onChange={(e) => set("date", e.target.value)} /></div>
          <div><label className="label" htmlFor="ev-loc">Local</label><input id="ev-loc" className="field" value={f.location} onChange={(e) => set("location", e.target.value)} maxLength={200} placeholder="Ex.: Auditório principal" /></div>
        </div>
        <div><label className="label" htmlFor="ev-desc">Descrição</label><textarea id="ev-desc" className="field min-h-[90px]" value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={1000} /></div>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-sipat-light p-4 text-sm">
          <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[#168447]" checked={f.isListed} onChange={(e) => set("isListed", e.target.checked)} />
          <span><b className="text-sipat-dark">Mostrar na galeria pública</b><br />Desmarque para que só quem tem o QR Code ou o link acesse o evento.</span>
        </label>
        {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
        <div className="flex justify-end gap-2 pt-2"><button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn-primary" disabled={busy}>{busy ? "Salvando…" : "Salvar evento"}</button></div>
      </form>
    </Modal>
  );
}
