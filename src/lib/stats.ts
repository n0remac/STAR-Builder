import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export async function getResumeStats() {
  const user = await getCurrentUser();

  if (!user) {
    return { resumes: 0, answers: 0 };
  }

  const [resumes, answers] = await Promise.all([
    prisma.resume.count({ where: { userId: user.id } }),
    prisma.starResponse.count({ where: { userId: user.id } })
  ]);

  return { resumes, answers };
}
