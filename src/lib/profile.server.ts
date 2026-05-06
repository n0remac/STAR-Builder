import "server-only";

import { prisma } from "@/lib/db";
import { DEFAULT_RESUME_PATH } from "@/lib/profile";

export async function getOrCreateProfile(
  userId: string,
  userName?: string | null
) {
  return prisma.profile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      displayName: userName ?? "",
      resumePath: DEFAULT_RESUME_PATH
    }
  });
}
