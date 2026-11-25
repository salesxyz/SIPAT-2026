import { Camera, HardHat, HeartPulse, Images, QrCode, Send, ShieldCheck, Smartphone, UserX, Users } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  { Icon: QrCode, title: "Leia o QR Code", text: "Aponte a câmera do celular para o QR Code do evento." },
  { Icon: Smartphone, title: "Acesse a câmera", text: "O site abre direto na tela de envio, sem instalar nada." },
  { Icon: Camera, title: "Tire suas fotos", text: "Confira cada foto e descarte as que não gostar." },
  { Icon: Send, title: "Envie para a galeria", text: "Suas fotos aparecem para todos os participantes." },
];

const benefits = [
  { Icon: UserX, title: "Sem cadastro", text: "Nenhum login ou formulário. Escaneou, fotografou, enviou." },
  { Icon: Users, title: "Álbum de todos", text: "Cada participante contribui e todos veem o evento completo." },
  { Icon: ShieldCheck, title: "Seguro e privado", text: "Fotos em armazenamento protegido, com regras de retenção e exclusão." },
  { Icon: HeartPulse, title: "Memória da prevenção", text: "Registre o compromisso da empresa com a saúde e a segurança." },
];

function Phone() {
  const cells = Array.from({ length: 81 }, (_, i) => ((i * 7 + (i >> 3) * 3) % 5 < 2 || [0, 1, 2, 9, 11, 18, 19, 20, 6, 7, 8, 15, 17, 24, 25, 26, 54, 55, 56, 63, 65, 72, 73, 74].includes(i)) ? 1 : 0);
  return (
    <div className="relative mx-auto w-[260px] sm:w-[300px]" aria-hidden>
      <div className="rounded-[2.6rem] bg-sipat-dark p-3 shadow-lift">
        <div className="relative overflow-hidden rounded-[2rem] bg-white px-5 pb-6 pt-8">
          <div className="absolute left-1/2 top-2.5 h-1.5 w-16 -translate-x-1/2 rounded-full bg-sipat-dark/20" />
          <div className="viewfinder mx-auto aspect-square w-full p-4 text-sipat">
            <div className="relative grid h-full grid-cols-9 gap-[3px] overflow-hidden rounded-lg">
              {cells.map((c, i) => <span key={i} className={`rounded-[2px] ${c ? "bg-sipat-dark" : "bg-sipat-light"}`} />)}
              <span className="absolute inset-x-0 top-0 h-1/4 animate-scan bg-gradient-to-b from-transparent via-sipat/40 to-transparent" />
            </div>
            <span className="vf-b" />
          </div>
          <p className="mt-4 text-center font-display text-sm font-bold text-sipat-dark">SIPAT 2026</p>
          <div className="mt-3 flex justify-center"><span className="grid h-12 w-12 place-items-center rounded-full border-4 border-sipat"><span className="h-7 w-7 rounded-full bg-sipat" /></span></div>
        </div>
      </div>
      <span className="absolute -left-6 top-14 grid h-14 w-14 -rotate-6 place-items-center rounded-2xl bg-white text-sipat shadow-lift"><HardHat size={28} /></span>
      <span className="absolute -right-5 top-40 grid h-14 w-14 rotate-6 place-items-center rounded-2xl bg-sipat text-white shadow-lift"><ShieldCheck size={28} /></span>
      <span className="absolute -left-4 bottom-16 grid h-12 w-12 rotate-3 place-items-center rounded-2xl bg-sipat-light text-sipat-dark shadow-lift"><HeartPulse size={24} /></span>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-sipat-light to-sipat-gray">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 md:grid-cols-[1.15fr_1fr] md:py-20">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">SIPAT – Compartilhe seus momentos</h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-sipat-ink/80">
              Registre os melhores momentos do nosso evento e compartilhe suas fotografias com todos os participantes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/galeria" className="btn-primary !min-h-[52px] !px-7 !text-base"><Images size={20} />Acessar galeria</Link>
              <Link to="/enviar" className="btn-secondary !min-h-[52px] !px-7 !text-base"><Camera size={20} />Enviar minhas fotos</Link>
            </div>
          </div>
          <Phone />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16" aria-labelledby="como">
        <h2 id="como" className="text-3xl font-extrabold">Como funciona</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ Icon, title, text }, i) => (
            <li key={title} className="card relative p-6">
              <span className="absolute right-5 top-4 font-display text-5xl font-extrabold text-sipat-light">{i + 1}</span>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sipat text-white"><Icon size={24} /></span>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white py-16" aria-labelledby="beneficios">
        <div className="mx-auto max-w-6xl px-5">
          <h2 id="beneficios" className="text-3xl font-extrabold">Por que usar o SIPAT Photo Drive</h2>
          <ul className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {benefits.map(({ Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sipat-light text-sipat"><Icon size={24} /></span>
                <div><h3 className="text-lg font-bold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-gray-600">{text}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
