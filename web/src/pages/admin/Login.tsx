import { Loader2, Lock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../../components/Logo";
import { api } from "../../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const go = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try { await api("/auth/login", { method: "POST", body: { email, password } }); go("/admin", { replace: true }); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-sipat-light to-sipat-gray p-5">
      <div className="card w-full max-w-sm p-8">
        <Logo />
        <h1 className="mt-6 text-2xl font-extrabold">Área administrativa</h1>
        <p className="mt-1 text-sm text-gray-500">Entre para gerenciar eventos, QR Codes e fotos.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><label className="label" htmlFor="email">E-mail</label><input id="email" type="email" autoComplete="username" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></div>
          <div><label className="label" htmlFor="senha">Senha</label><input id="senha" type="password" autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}Entrar</button>
        </form>
        <Link to="/" className="mt-5 block text-center text-sm font-semibold text-sipat">Voltar ao site</Link>
      </div>
    </div>
  );
}
