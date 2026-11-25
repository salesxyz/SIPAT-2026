import { useEffect, useState, type FormEvent } from "react";
import { useSettings } from "../../components/SettingsContext";
import { useToast } from "../../components/Toast";
import { api } from "../../lib/api";

const contact = [
  ["org_name", "Nome da organização"], ["contact_email", "E-mail institucional"], ["contact_phone", "Telefone ou WhatsApp"], ["contact_address", "Endereço da empresa"],
] as const;
const social = [["social_instagram", "Instagram"], ["social_facebook", "Facebook"], ["social_linkedin", "LinkedIn"], ["social_youtube", "YouTube"]] as const;

export default function SettingsPage() {
  const { settings, reload, error: settingsError } = useSettings();
  const toast = useToast();
  const [f, setF] = useState<Record<string, string>>({});
  
  const [pw, setPw] = useState({ current: "", next: "" });
  useEffect(() => setF(settings), [settings]);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try { await api("/admin/settings", { method: "PUT", body: f }); reload(); toast("Configurações salvas"); } catch (e: any) { toast(e.message, "erro"); }
  };
  const changePw = async (e: FormEvent) => {
    e.preventDefault();
    try { await api("/auth/password", { method: "POST", body: pw }); setPw({ current: "", next: "" }); toast("Senha alterada"); } catch (e: any) { toast(e.message, "erro"); }
  };
  const retention = async () => {
    try { const r = await api<{ deleted: number }>("/admin/maintenance/retention", { method: "POST" }); toast(r.deleted ? `${r.deleted} foto(s) excluída(s)` : "Nenhuma foto passou do prazo"); } catch (e: any) { toast(e.message, "erro"); }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div><h1 className="text-3xl font-extrabold">Configurações</h1><p className="text-gray-500">Contatos do rodapé, privacidade e retenção das fotos.</p></div>
      {settingsError && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">Falha ao carregar as configurações: {settingsError}</p>}
      <form onSubmit={save} className="space-y-8">
        <section className="card space-y-4 p-6"><h2 className="text-xl font-bold">Contato no rodapé</h2>
          {contact.map(([k, l]) => <div key={k}><label className="label" htmlFor={k}>{l}</label><input id={k} className="field" value={f[k] ?? ""} onChange={(e) => set(k, e.target.value)} /></div>)}
          <div className="grid gap-4 sm:grid-cols-2">{social.map(([k, l]) => <div key={k}><label className="label" htmlFor={k}>{l} (link)</label><input id={k} type="url" className="field" placeholder="https://" value={f[k] ?? ""} onChange={(e) => set(k, e.target.value)} /></div>)}</div>
          <p className="text-xs text-gray-500">Campos vazios aparecem no rodapé como “a definir”. Redes sociais vazias não aparecem.</p>
        </section>
        <section className="card space-y-4 p-6"><h2 className="text-xl font-bold">Privacidade e LGPD</h2>
          <div><label className="label" htmlFor="privacy_notice">Aviso de privacidade</label><textarea id="privacy_notice" className="field min-h-[180px]" value={f.privacy_notice ?? ""} onChange={(e) => set("privacy_notice", e.target.value)} /></div>
          <div><label className="label" htmlFor="retention_days">Excluir fotos automaticamente após (dias)</label><input id="retention_days" type="number" min={0} max={3650} className="field max-w-[200px]" value={f.retention_days ?? "0"} onChange={(e) => set("retention_days", e.target.value)} />
            <p className="mt-1 text-xs text-gray-500">0 desliga a exclusão automática. A verificação roda a cada hora.</p></div>
          <button type="button" className="btn-secondary" onClick={retention}>Executar limpeza agora</button>
        </section>
        <button className="btn-primary">Salvar configurações</button>
      </form>
      <form onSubmit={changePw} className="card space-y-4 p-6"><h2 className="text-xl font-bold">Alterar senha</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="pw1">Senha atual</label><input id="pw1" type="password" autoComplete="current-password" className="field" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></div>
          <div><label className="label" htmlFor="pw2">Nova senha (mín. 8 caracteres)</label><input id="pw2" type="password" autoComplete="new-password" minLength={8} className="field" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></div>
        </div>
        <button className="btn-secondary">Alterar senha</button>
      </form>
    </div>
  );
}
