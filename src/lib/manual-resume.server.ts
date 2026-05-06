import "server-only";

import { prisma } from "@/lib/db";

export async function getManualResume(userId: string) {
  const existing = await prisma.resume.findFirst({
    where: {
      userId,
      source: "manual"
    },
    orderBy: {
      importedAt: "asc"
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.resume.create({
    data: {
      userId,
      source: "manual",
      text: "Manually created jobs and STAR answers."
    }
  });
}

export async function getManualPosition(userId: string) {
  const resume = await getManualResume(userId);

  const existing = await prisma.position.findFirst({
    where: {
      title: "Manual STAR Answer",
      resumeId: resume.id
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.position.create({
    data: {
      resumeId: resume.id,
      title: "Manual STAR Answer",
      company: "Unassigned",
      start: "",
      end: ""
    }
  });
}
