import { Camera, Loader2, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { fmtDate } from "../lib/format";
import type { PublicEventListItem } from "../lib/types";

/** "Enviar minhas fotos" sem QR: mostra os eventos que estão recebendo fotos. */
export default function ChooseEvent() {
  const [events, setEvents] = useState<PublicEventListItem[] | null>(null);
  const [error, setError] = useState("");
  const nav = useNavigate();
  useEffect(() => {
    api<{ events: PublicEventListItem[] }>("/public/events")
      .then((r) => {
        const open = r.events.filter((e) => e.accepting);
        if (open.length === 1) nav(`/e/${open[0].token}`, { replace: true });
        else setEvents(open);
      })
      .catch((e) => setError(e.message));
  }, [nav]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-3xl font-extrabold">Enviar minhas fotos</h1>
      <p className="mt-2 text-gray-600">Escolha o evento ou leia o QR Code impresso no local.</p>
      {error && <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {!events && !error && <Loader2 className="mt-10 animate-spin text-sipat" />}
      {events?.length === 0 && (
        <div className="card mt-8 grid place-items-center gap-3 p-10 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-3xl bg-sipat-light text-sipat"><QrCode size={30} /></span>
          <p className="font-display text-lg font-bold text-sipat-dark">Nenhum evento recebendo fotos</p>
          <p className="max-w-sm text-sm text-gray-500">Escaneie o QR Code do evento com a câmera do celular para enviar suas fotos.</p>
        </div>
      )}
      <ul className="mt-8 space-y-3">
        {events?.map((e) => (
          <li key={e.token}>
            <Link to={`/e/${e.token}`} className="card flex items-center gap-4 p-4 transition hover:shadow-lift">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sipat text-white"><Camera /></span>
              <span className="min-w-0 flex-1"><span className="block truncate font-display text-lg font-bold text-sipat-dark">{e.name}</span>
                <span className="text-sm text-gray-500">{[fmtDate(e.date), e.location].filter(Boolean).join(" • ")}</span></span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
