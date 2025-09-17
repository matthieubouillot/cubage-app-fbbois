// apps/web/src/components/Navbar.tsx
import { Link } from "react-router-dom";
import { getUser } from "../features/auth/auth";

export default function Navbar() {
  const u = getUser();
  return (
    <nav className="w-full border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.png" alt="Accueil" className="h-6 w-6" />
          <span className="sr-only md:not-sr-only font-semibold">
            Gestion de Cubage
          </span>
        </Link>

        <div className="text-xs text-gray-600">
          {u ? `${u.firstName} ${u.lastName} · ${u.role}` : ""}
        </div>
      </div>
    </nav>
  );
}
