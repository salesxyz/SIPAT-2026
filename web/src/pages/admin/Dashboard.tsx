import { CalendarDays, FolderOpen, HardDrive, Images, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { fmtBytes, fmtDateTime } from "../../lib/format";
import type { Photo } from "../../lib/types";
import { useMe } from "./AdminLayout";

interface Data {
  totals: { events: number; albums: number; photos: number; bytes: number };
  recentUploads: (Photo & { eventName: string; albumName: string })[];
  topEvents: { id: string; name: string; status: string; photoCount: number }[];
}

export default function Dashboard() {
  const me = useMe();
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { api<Data>("/admin/dashboard").then(setD).catch((e) => setErr(e.message)); }, []);
  if (err) return <p className="rounded-2xl bg-red-50 p-4 text-red-700">{err}</p>;
  if (!d) return <Loader2 className="animate-spin text-sipat" />;

  const cards = [
    { label: "Eventos", value: d.totals.events, Icon: CalendarDays, hero: true },
    { label: "Fotografias", value: d.totals.photos, Icon: Images },
    { label: "Álbuns", value: d.totals.albums, Icon: FolderOpen },
    { label: "Armazenamento", value: fmtBytes(d.totals.bytes), Icon: HardDrive },
  ];

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-extrabold">Olá, {me.name.split(" ")[0]}</h1><p className="text-gray-500">Resumo das fotos recebidas nos eventos.</p></div>
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, Icon, hero }) => (
          <li key={label} className={`rounded-3xl p-5 ${hero ? "bg-gradient-to-br from-sipat to-sipat-dark text-white shadow-lift" : "card"}`}>
            <span className={`grid h-11 w-11 place-items-center rounded-2xl ${hero ? "bg-white/20" : "bg-sipat-light text-sipat"}`}><Icon size={22} /></span>
            <p className={`mt-4 font-display text-3xl font-extrabold ${hero ? "" : "text-sipat-dark"}`}>{typeof value === "number" ? value.toLocaleString("pt-BR") : value}</p>
            <p className={`text-sm ${hero ? "text-white/80" : "text-gray-500"}`}>{label}</p>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-5" aria-labelledby="ult">
          <h2 id="ult" className="text-xl font-bold">Últimos envios</h2>
          {d.recentUploads.length === 0 ? <p className="py-10 text-center text-sm text-gray-500">Nenhuma foto recebida ainda. Crie um evento e imprima o QR Code.</p> : (
            <ul className="mt-3 divide-y divide-gray-100">
              {d.recentUploads.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <img src={p.thumbUrl} alt="" className="h-12 w-12 rounded-xl object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-sipat-dark">{p.fileName}</p><p className="truncate text-xs text-gray-500">{p.eventName} · {p.albumName}</p></div>
                  <time className="shrink-0 text-xs text-gray-500">{fmtDateTime(p.uploadedAt)}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card p-5" aria-labelledby="ev">
          <div className="flex items-center justify-between"><h2 id="ev" className="text-xl font-bold">Eventos recentes</h2><Link to="/admin/eventos" className="text-sm font-semibold text-sipat">Ver todos</Link></div>
          <ul className="mt-3 space-y-2">
            {d.topEvents.map((e) => (
              <li key={e.id}><Link to={`/admin/eventos/${e.id}`} className="flex items-center justify-between gap-3 rounded-2xl p-3 hover:bg-sipat-light">
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-sipat-dark">{e.name}</span><span className={`chip mt-1 ${e.status === "active" ? "bg-sipat-light text-sipat-dark" : "bg-gray-100 text-gray-500"}`}>{e.status === "active" ? "Recebendo fotos" : "Encerrado"}</span></span>
                <span className="text-sm font-bold text-sipat-dark">{e.photoCount}</span>
              </Link></li>
            ))}
            {d.topEvents.length === 0 && <li className="py-6 text-center text-sm text-gray-500">Nenhum evento criado.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
