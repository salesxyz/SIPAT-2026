import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { useSettings } from "./SettingsContext";

export function Footer() {
  const { settings: s } = useSettings();
  const ph = (v: string | undefined, placeholder: string) => (v ? <span>{v}</span> : <span className="italic text-white/50">{placeholder}</span>);
  const phone = s.contact_phone?.replace(/\D/g, "");
  const socials = [
    { href: s.social_instagram, label: "Instagram", Icon: Instagram },
    { href: s.social_facebook, label: "Facebook", Icon: Facebook },
    { href: s.social_linkedin, label: "LinkedIn", Icon: Linkedin },
    { href: s.social_youtube, label: "YouTube", Icon: Youtube },
  ].filter((x) => x.href);

  return (
    <footer className="mt-auto bg-sipat-dark text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/80">Promovendo segurança, saúde e bem-estar no ambiente de trabalho.</p>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socials.map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/25">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h2 className="!text-white text-base font-bold">Contato</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/90">
            <li className="flex gap-2.5"><Mail size={16} className="mt-0.5 shrink-0" />
              {s.contact_email ? <a className="underline-offset-2 hover:underline" href={`mailto:${s.contact_email}`}>{s.contact_email}</a> : ph("", "E-mail institucional a definir")}</li>
            <li className="flex gap-2.5"><Phone size={16} className="mt-0.5 shrink-0" />
              {s.contact_phone ? <a className="underline-offset-2 hover:underline" href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer">{s.contact_phone}</a> : ph("", "Telefone ou WhatsApp a definir")}</li>
            <li className="flex gap-2.5"><MapPin size={16} className="mt-0.5 shrink-0" />{ph(s.contact_address, "Endereço da empresa a definir")}</li>
          </ul>
        </div>
        <div>
          <h2 className="!text-white text-base font-bold">Plataforma</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/90">
            <li><Link className="underline-offset-2 hover:underline" to="/galeria">Galeria de fotos</Link></li>
            <li><Link className="underline-offset-2 hover:underline" to="/privacidade">Aviso de privacidade (LGPD)</Link></li>
            <li><Link className="underline-offset-2 hover:underline" to="/admin">Área administrativa</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15 px-5 py-4 text-center text-xs text-white/70">
        © {new Date().getFullYear()} {s.org_name || "SIPAT"}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
