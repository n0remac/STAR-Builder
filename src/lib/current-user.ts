import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function getCurrentUser() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId }
  });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/api/auth/signin");
  }

  return user;
}

export async function requireCurrentUserForAction() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You must be signed in to do that.");
  }

  return user;
}
