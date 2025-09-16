import { prisma } from "../../prisma";
import bcrypt from "bcrypt";

export async function validateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;
  // retire le hash
  const { password: _p, ...safe } = user;
  return safe;
}