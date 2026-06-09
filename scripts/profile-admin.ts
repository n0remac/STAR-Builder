import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function usage() {
  return [
    "Usage:",
    "  pnpm tsx scripts/profile-admin.ts list",
    "  pnpm tsx scripts/profile-admin.ts delete-profile <email|profile-id|public-slug>",
    "",
    "delete-profile removes only the Profile row. It does not delete the user, resumes, STAR answers, narratives, or target jobs."
  ].join("\n");
}

function userLabel(user: { email: string | null; id: string }) {
  return user.email || user.id;
}

async function listProfiles() {
  const users = await prisma.user.findMany({
    include: {
      accounts: {
        select: {
          provider: true
        }
      },
      profile: {
        select: {
          id: true,
          displayName: true,
          publicSlug: true,
          isPublic: true
        }
      },
      _count: {
        select: {
          resumes: true,
          starResponses: true,
          narratives: true,
          targetJobs: true
        }
      }
    },
    orderBy: [{ email: "asc" }, { createdAt: "asc" }]
  });

  if (users.length === 0) {
    console.log("No users found.");
    return;
  }

  console.table(
    users.map((user) => ({
      email: user.email ?? "",
      userId: user.id,
      status: user.accounts.length > 0 ? "claimed" : "unclaimed",
      providers: user.accounts.map((account) => account.provider).join(", "),
      profileId: user.profile?.id ?? "",
      profileName: user.profile?.displayName ?? "",
      publicSlug: user.profile?.publicSlug ?? "",
      public: user.profile?.isPublic ? "yes" : "no",
      resumes: user._count.resumes,
      answers: user._count.starResponses,
      narratives: user._count.narratives,
      targetJobs: user._count.targetJobs
    }))
  );
}

async function deleteProfile(identifier: string) {
  const value = identifier.trim();

  if (!value) {
    throw new Error(usage());
  }

  const profile = await prisma.profile.findFirst({
    where: {
      OR: [
        { id: value },
        { publicSlug: value },
        {
          user: {
            email: value.toLowerCase()
          }
        }
      ]
    },
    include: {
      user: {
        select: {
          id: true,
          email: true
        }
      }
    }
  });

  if (!profile) {
    throw new Error(`No profile found for ${value}.`);
  }

  await prisma.profile.delete({
    where: {
      id: profile.id
    }
  });

  console.log(
    `Deleted profile ${profile.id} for ${userLabel(profile.user)}. Owned data was left intact.`
  );
}

async function main() {
  const [command, identifier] = process.argv.slice(2);

  switch (command) {
    case "list":
      await listProfiles();
      return;
    case "delete-profile":
      await deleteProfile(identifier ?? "");
      return;
    default:
      throw new Error(usage());
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
