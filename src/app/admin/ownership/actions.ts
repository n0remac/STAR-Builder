"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUserForAction } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formString } from "@/lib/form";

function revalidateOwnershipPaths(publicSlugs: Array<string | null | undefined> = []) {
  revalidatePath("/admin/ownership");
  revalidatePath("/profile");
  revalidatePath("/profile/publish");
  revalidatePath("/resume");
  revalidatePath("/jobs");
  revalidatePath("/narratives");

  for (const slug of publicSlugs) {
    if (slug) {
      revalidatePath(`/u/${slug}`);
    }
  }
}

function requireId(formData: FormData, name: string) {
  const value = formString(formData, name);

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function assertConfirmation({
  allowed,
  confirmation,
  label
}: {
  allowed: string[];
  confirmation: string;
  label: string;
}) {
  const normalized = confirmation.trim().toLowerCase();
  const valid = allowed
    .filter(Boolean)
    .map((value) => value.trim().toLowerCase());

  if (!normalized || !valid.includes(normalized)) {
    throw new Error(`Type ${label} exactly to confirm.`);
  }
}

async function requireTargetUser(targetUserId: string) {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { profile: true }
  });

  if (!targetUser) {
    throw new Error("Target user not found.");
  }

  return targetUser;
}

export async function reassignProfileAction(formData: FormData) {
  await requireAdminUserForAction();
  const profileId = requireId(formData, "profileId");
  const targetUserId = requireId(formData, "targetUserId");
  const [profile, targetUser] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: profileId },
      include: { user: true }
    }),
    requireTargetUser(targetUserId)
  ]);

  if (!profile) {
    throw new Error("Profile not found.");
  }

  if (profile.userId === targetUserId) {
    throw new Error("Profile already belongs to that user.");
  }

  if (targetUser.profile) {
    throw new Error("Target user already has a profile. Delete that profile first.");
  }

  await prisma.$transaction([
    prisma.profile.update({
      where: { id: profile.id },
      data: { userId: targetUser.id }
    })
  ]);

  revalidateOwnershipPaths([profile.publicSlug]);
}

export async function deleteProfileAction(formData: FormData) {
  await requireAdminUserForAction();
  const profileId = requireId(formData, "profileId");
  const confirmation = formString(formData, "confirmation");
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { user: true }
  });

  if (!profile) {
    throw new Error("Profile not found.");
  }

  assertConfirmation({
    allowed: [profile.id, profile.user.email ?? ""],
    confirmation,
    label: profile.id
  });

  await prisma.$transaction([
    prisma.profile.delete({
      where: { id: profile.id }
    })
  ]);

  revalidateOwnershipPaths([profile.publicSlug]);
}

export async function reassignResumeAction(formData: FormData) {
  await requireAdminUserForAction();
  const resumeId = requireId(formData, "resumeId");
  const targetUserId = requireId(formData, "targetUserId");
  const [resume, targetUser] = await Promise.all([
    prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        positions: {
          select: {
            id: true
          }
        },
        user: {
          include: {
            profile: true
          }
        }
      }
    }),
    requireTargetUser(targetUserId)
  ]);

  if (!resume) {
    throw new Error("Resume not found.");
  }

  if (resume.userId === targetUser.id) {
    throw new Error("Resume already belongs to that user.");
  }

  const positionIds = resume.positions.map((position) => position.id);

  await prisma.$transaction([
    prisma.resume.update({
      where: { id: resume.id },
      data: { userId: targetUser.id }
    }),
    prisma.starResponse.updateMany({
      where: {
        positionId: {
          in: positionIds
        }
      },
      data: { userId: targetUser.id }
    })
  ]);

  revalidateOwnershipPaths([resume.user.profile?.publicSlug, targetUser.profile?.publicSlug]);
}

export async function deleteResumeAction(formData: FormData) {
  await requireAdminUserForAction();
  const resumeId = requireId(formData, "resumeId");
  const confirmation = formString(formData, "confirmation");
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: {
      user: {
        include: {
          profile: true
        }
      }
    }
  });

  if (!resume) {
    throw new Error("Resume not found.");
  }

  assertConfirmation({
    allowed: [resume.id, resume.user.email ?? ""],
    confirmation,
    label: resume.id
  });

  await prisma.$transaction([
    prisma.resume.delete({
      where: { id: resume.id }
    })
  ]);

  revalidateOwnershipPaths([resume.user.profile?.publicSlug]);
}

export async function reassignStarAnswerAction(formData: FormData) {
  await requireAdminUserForAction();
  const answerId = requireId(formData, "answerId");
  const targetUserId = requireId(formData, "targetUserId");
  const [answer, targetUser] = await Promise.all([
    prisma.starResponse.findUnique({
      where: { id: answerId },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    }),
    requireTargetUser(targetUserId)
  ]);

  if (!answer) {
    throw new Error("STAR answer not found.");
  }

  await prisma.$transaction([
    prisma.starResponse.update({
      where: { id: answer.id },
      data: { userId: targetUser.id }
    })
  ]);

  revalidatePath(`/answers/${answer.id}`);
  revalidateOwnershipPaths([answer.user.profile?.publicSlug, targetUser.profile?.publicSlug]);
}

export async function deleteStarAnswerAction(formData: FormData) {
  await requireAdminUserForAction();
  const answerId = requireId(formData, "answerId");
  const confirmation = formString(formData, "confirmation");
  const answer = await prisma.starResponse.findUnique({
    where: { id: answerId },
    include: {
      user: {
        include: {
          profile: true
        }
      }
    }
  });

  if (!answer) {
    throw new Error("STAR answer not found.");
  }

  assertConfirmation({
    allowed: [answer.id, answer.user.email ?? ""],
    confirmation,
    label: answer.id
  });

  await prisma.$transaction([
    prisma.starResponse.delete({
      where: { id: answer.id }
    })
  ]);

  revalidateOwnershipPaths([answer.user.profile?.publicSlug]);
}

export async function reassignNarrativeAction(formData: FormData) {
  await requireAdminUserForAction();
  const narrativeId = requireId(formData, "narrativeId");
  const targetUserId = requireId(formData, "targetUserId");
  const [narrative, targetUser] = await Promise.all([
    prisma.narrative.findUnique({
      where: { id: narrativeId },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    }),
    requireTargetUser(targetUserId)
  ]);

  if (!narrative) {
    throw new Error("Narrative not found.");
  }

  await prisma.$transaction([
    prisma.narrative.update({
      where: { id: narrative.id },
      data: { userId: targetUser.id }
    })
  ]);

  revalidatePath(`/narratives/${narrative.id}`);
  revalidateOwnershipPaths([narrative.user.profile?.publicSlug, targetUser.profile?.publicSlug]);
}

export async function deleteNarrativeAction(formData: FormData) {
  await requireAdminUserForAction();
  const narrativeId = requireId(formData, "narrativeId");
  const confirmation = formString(formData, "confirmation");
  const narrative = await prisma.narrative.findUnique({
    where: { id: narrativeId },
    include: {
      user: {
        include: {
          profile: true
        }
      }
    }
  });

  if (!narrative) {
    throw new Error("Narrative not found.");
  }

  assertConfirmation({
    allowed: [narrative.id, narrative.user.email ?? ""],
    confirmation,
    label: narrative.id
  });

  await prisma.$transaction([
    prisma.narrative.delete({
      where: { id: narrative.id }
    })
  ]);

  revalidateOwnershipPaths([narrative.user.profile?.publicSlug]);
}

export async function reassignTargetJobAction(formData: FormData) {
  await requireAdminUserForAction();
  const targetJobId = requireId(formData, "targetJobId");
  const targetUserId = requireId(formData, "targetUserId");
  const [targetJob, targetUser] = await Promise.all([
    prisma.targetJob.findUnique({
      where: { id: targetJobId },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    }),
    requireTargetUser(targetUserId)
  ]);

  if (!targetJob) {
    throw new Error("Target job not found.");
  }

  await prisma.$transaction([
    prisma.targetJob.update({
      where: { id: targetJob.id },
      data: { userId: targetUser.id }
    })
  ]);

  revalidateOwnershipPaths([targetJob.user.profile?.publicSlug, targetUser.profile?.publicSlug]);
}

export async function deleteTargetJobAction(formData: FormData) {
  await requireAdminUserForAction();
  const targetJobId = requireId(formData, "targetJobId");
  const confirmation = formString(formData, "confirmation");
  const targetJob = await prisma.targetJob.findUnique({
    where: { id: targetJobId },
    include: {
      user: {
        include: {
          profile: true
        }
      }
    }
  });

  if (!targetJob) {
    throw new Error("Target job not found.");
  }

  assertConfirmation({
    allowed: [targetJob.id, targetJob.user.email ?? ""],
    confirmation,
    label: targetJob.id
  });

  await prisma.$transaction([
    prisma.targetJob.delete({
      where: { id: targetJob.id }
    })
  ]);

  revalidateOwnershipPaths([targetJob.user.profile?.publicSlug]);
}
