import "server-only";

import { prisma } from "@/lib/db";

export const DEFAULT_USER_EMAIL = "local@star.test";

export async function getDefaultUser() {
  return prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: {},
    create: {
      email: DEFAULT_USER_EMAIL,
      name: "Local User"
    }
  });
}

export async function getManualResume() {
  const user = await getDefaultUser();

  const existing = await prisma.resume.findFirst({
    where: {
      userId: user.id,
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
      userId: user.id,
      source: "manual",
      text: "Manually created jobs and STAR answers."
    }
  });
}

export async function getManualPosition() {
  const resume = await getManualResume();

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
