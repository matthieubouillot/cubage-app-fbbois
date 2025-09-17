// apps/web/src/pages/Home.tsx
import { Link } from "react-router-dom";
import { getUser } from "../../features/auth/auth";

export default function Home() {
  const u = getUser();
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold">
          Bienvenue {u ? `${u.firstName} ${u.lastName}` : ""}
        </h1>
        <div className="pt-2">
          <Link
            to="/chantiers"
            className="inline-flex items-center justify-center rounded-full bg-black text-white px-5 py-2"
          >
            Mes chantiers
          </Link>
        </div>
      </div>
    </div>
  );
}
