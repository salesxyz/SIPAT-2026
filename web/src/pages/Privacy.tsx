import { Clock, ShieldCheck, Trash2 } from "lucide-react";
import { useSettings } from "../components/SettingsContext";

export default function Privacy() {
  const { settings: s } = useSettings();
  const days = Number(s.retention_days || 0);
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-extrabold">Aviso de privacidade</h1>
      <p className="mt-4 whitespace-pre-line leading-relaxed text-gray-700">{s.privacy_notice}</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        <li className="card p-5"><ShieldCheck className="text-sipat" /><h2 className="mt-3 text-base font-bold">Uso das imagens</h2><p className="mt-1 text-sm text-gray-600">Registro e divulgação interna do evento.</p></li>
        <li className="card p-5"><Clock className="text-sipat" /><h2 className="mt-3 text-base font-bold">Retenção</h2><p className="mt-1 text-sm text-gray-600">{days ? `As fotos são excluídas após ${days} dias.` : "O prazo é definido pela organização do evento."}</p></li>
        <li className="card p-5"><Trash2 className="text-sipat" /><h2 className="mt-3 text-base font-bold">Remoção</h2><p className="mt-1 text-sm text-gray-600">Peça a exclusão de uma foto pelos contatos no rodapé.</p></li>
      </ul>
    </div>
  );
}
