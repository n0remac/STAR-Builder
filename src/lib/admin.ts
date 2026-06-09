import "server-only";

import { notFound } from "next/navigation";

import { requireCurrentUser, requireCurrentUserForAction } from "@/lib/current-user";

export function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminEmail(email?: string | null) {
  return Boolean(email && adminEmails().has(email.toLowerCase()));
}

export async function requireAdminUser() {
  const user = await requireCurrentUser();

  if (!isAdminEmail(user.email)) {
    notFound();
  }

  return user;
}

export async function requireAdminUserForAction() {
  const user = await requireCurrentUserForAction();

  if (!isAdminEmail(user.email)) {
    throw new Error("You must be an admin to do that.");
  }

  return user;
}
