import { getUser } from "../../features/auth/auth";

export default function Home() {
  const u = getUser();
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Bienvenue {u ? `${u.firstName} ${u.lastName}` : ""}</h1>
      <p className="text-sm text-gray-600">Choisissez un chantier dans le menu.</p>
    </div>
  );
}