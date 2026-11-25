import { CalendarDays, FolderOpen, ImageOff, Loader2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { fmtDate, plural } from "../lib/format";
import type { PublicEventListItem } from "../lib/types";

export default function Gallery() {
  const [events, setEvents] = useState<PublicEventListItem[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<{ events: PublicEventListItem[] }>("/public/events").then((r) => setEvents(r.events)).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-3xl font-extrabold">Galeria de fotos</h1>
      <p className="mt-2 text-gray-600">Escolha um evento para ver as fotos compartilhadas.</p>
      {error && <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {!events && !error && <Loader2 className="mt-10 animate-spin text-sipat" />}
      {events?.length === 0 && (
        <div className="card mt-8 grid place-items-center gap-3 p-12 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-3xl bg-sipat-light text-sipat"><FolderOpen size={30} /></span>
          <p className="font-display text-lg font-bold text-sipat-dark">Nenhum evento disponível ainda</p>
          <p className="max-w-sm text-sm text-gray-500">Os eventos aparecem aqui quando a organização os publica. Se você tem o QR Code de um evento, escaneie para acessá-lo.</p>
        </div>
      )}
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {events?.map((e) => (
          <li key={e.token}>
            <Link to={`/galeria/${e.token}`} className="card group block overflow-hidden transition hover:shadow-lift">
              <div className="relative aspect-[16/10] bg-sipat-light">
                {e.coverUrl ? <img src={e.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <span className="grid h-full place-items-center text-sipat/50"><ImageOff size={40} /></span>}
                <span className="chip absolute bottom-3 left-3 bg-white/95 text-sipat-dark">{plural(e.photoCount, "foto", "fotos")}</span>
              </div>
              <div className="p-5">
                <h2 className="text-xl font-bold">{e.name}</h2>
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                  {e.date && <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />{fmtDate(e.date)}</span>}
                  {e.location && <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{e.location}</span>}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
