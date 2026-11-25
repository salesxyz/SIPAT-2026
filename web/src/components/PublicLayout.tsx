import { Camera, Images } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import { Logo } from "./Logo";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-sipat/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo />
          <nav className="flex items-center gap-1" aria-label="Principal">
            <Link to="/galeria" className="btn-ghost !px-3"><Images size={18} /><span className="hidden sm:inline">Galeria</span></Link>
            <Link to="/enviar" className="btn-primary !px-4"><Camera size={18} />Enviar fotos</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
