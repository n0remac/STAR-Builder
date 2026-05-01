import { prisma } from "@/lib/db";
import { getDefaultUser } from "@/lib/default-user";

export async function getResumeStats() {
  const user = await getDefaultUser();

  const [resumes, answers] = await Promise.all([
    prisma.resume.count({ where: { userId: user.id } }),
    prisma.starResponse.count({ where: { userId: user.id } })
  ]);

  return { resumes, answers };
}
