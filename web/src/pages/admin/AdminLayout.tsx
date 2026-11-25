import { CalendarDays, LayoutDashboard, Loader2, LogOut, Settings } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "../../components/Logo";
import { api } from "../../lib/api";
import type { Me } from "../../lib/types";

const Ctx = createContext<Me | null>(null);
export const useMe = () => useContext(Ctx)!;

const nav = [
  { to: "/admin", end: true, label: "Painel", Icon: LayoutDashboard },
  { to: "/admin/eventos", end: false, label: "Eventos", Icon: CalendarDays },
  { to: "/admin/configuracoes", end: false, label: "Configurações", Icon: Settings },
];

export function AdminLayout() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const go = useNavigate();
  useEffect(() => { api<{ user: Me }>("/auth/me").then((r) => setMe(r.user)).catch(() => setMe(null)); }, []);
  if (me === undefined) return <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-sipat" size={32} /></div>;
  if (me === null) return <Navigate to="/admin/login" replace />;

  const logout = async () => { await api("/auth/logout", { method: "POST" }); go("/admin/login"); };
  const link = ({ isActive }: { isActive: boolean }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive ? "bg-sipat text-white shadow-card" : "text-sipat-dark hover:bg-sipat-light"}`;

  return (
    <Ctx.Provider value={me}>
      <div className="min-h-screen bg-sipat p-0 md:p-4">
        <div className="mx-auto flex min-h-screen max-w-[1500px] overflow-hidden bg-sipat-gray md:min-h-[calc(100vh-2rem)] md:rounded-[2rem]">
          <aside className="hidden w-64 shrink-0 flex-col rounded-r-[2rem] bg-white p-5 shadow-card md:flex">
            <Logo to="/admin" />
            <nav className="mt-8 flex flex-1 flex-col gap-1.5" aria-label="Administração">
              {nav.map(({ to, end, label, Icon }) => <NavLink key={to} to={to} end={end} className={link}><Icon size={20} />{label}</NavLink>)}
            </nav>
            <div className="rounded-2xl bg-sipat-light p-4 text-sm">
              <p className="truncate font-bold text-sipat-dark">{me.name}</p>
              <p className="truncate text-xs text-gray-500">{me.email}</p>
              <button onClick={logout} className="btn-ghost mt-3 !min-h-[40px] w-full !justify-start !px-3"><LogOut size={18} />Sair</button>
            </div>
          </aside>
          <div className="min-w-0 flex-1 pb-20 md:pb-0">
            <header className="flex items-center justify-between bg-white px-4 py-3 shadow-card md:hidden">
              <Logo to="/admin" />
              <button onClick={logout} className="btn-ghost !px-3" aria-label="Sair"><LogOut size={20} /></button>
            </header>
            <div className="p-4 sm:p-6 lg:p-8"><Outlet /></div>
          </div>
          <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-gray-100 bg-white md:hidden" aria-label="Administração">
            {nav.map(({ to, end, label, Icon }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${isActive ? "text-sipat" : "text-gray-500"}`}><Icon size={22} />{label}</NavLink>
            ))}
          </nav>
        </div>
      </div>
    </Ctx.Provider>
  );
}
