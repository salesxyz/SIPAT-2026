import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="text-3xl font-extrabold">Página não encontrada</h1>
      <p className="mt-2 text-gray-600">O endereço que você abriu não existe.</p>
      <Link to="/" className="btn-primary mt-6">Voltar ao início</Link>
    </div>
  );
}
