import { CalendarDays, Images, Loader2, MapPin, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EventForm } from "../../components/EventForm";
import { api } from "../../lib/api";
import { fmtDate, plural } from "../../lib/format";
import type { AdminEvent } from "../../lib/types";

export default function Events() {
  const [events, setEvents] = useState<AdminEvent[] | null>(null);
  const [err, setErr] = useState("");
  const [creating, setCreating] = useState(false);
  const go = useNavigate();
  useEffect(() => { api<{ events: AdminEvent[] }>("/admin/events").then((r) => setEvents(r.events)).catch((e) => setErr(e.message)); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-extrabold">Eventos</h1><p className="text-gray-500">Cada evento tem seus álbuns, fotos e um QR Code exclusivo.</p></div>
        <button className="btn-primary" onClick={() => setCreating(true)}><Plus size={20} />Novo evento</button>
      </div>
      {err && <p className="rounded-2xl bg-red-50 p-4 text-red-700">{err}</p>}
      {!events && !err && <Loader2 className="animate-spin text-sipat" />}
      {events?.length === 0 && <div className="card p-12 text-center"><p className="font-display text-lg font-bold text-sipat-dark">Nenhum evento ainda</p><p className="mt-1 text-sm text-gray-500">Crie o primeiro evento para gerar o QR Code.</p><button className="btn-primary mt-5" onClick={() => setCreating(true)}><Plus size={20} />Criar evento</button></div>}
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events?.map((e) => (
          <li key={e.id}>
            <Link to={`/admin/eventos/${e.id}`} className="card block p-5 transition hover:shadow-lift">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold">{e.name}</h2>
                <span className={`chip shrink-0 ${e.status === "active" ? "bg-sipat-light text-sipat-dark" : "bg-gray-100 text-gray-500"}`}>{e.status === "active" ? "Recebendo fotos" : "Encerrado"}</span>
              </div>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                {e.date && <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />{fmtDate(e.date)}</span>}
                {e.location && <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{e.location}</span>}
              </p>
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sipat-dark"><Images size={16} />{plural(e.photoCount, "foto", "fotos")} · {plural(e.albumCount, "álbum", "álbuns")}</p>
            </Link>
          </li>
        ))}
      </ul>
      {creating && <EventForm onClose={() => setCreating(false)} onSaved={(e) => go(`/admin/eventos/${e.id}`)} />}
    </div>
  );
}
