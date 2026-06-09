import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEFAULT_USER_EMAIL = "local@star.test";

async function main() {
  const targetEmail = process.argv[2]?.trim().toLowerCase();

  if (!targetEmail) {
    throw new Error(
      "Usage: pnpm tsx scripts/claim-existing-data.ts your-google-email@example.com"
    );
  }

  if (targetEmail === DEFAULT_USER_EMAIL) {
    throw new Error("Choose your Google account email, not local@star.test.");
  }

  const [sourceUser, targetUser] = await Promise.all([
    prisma.user.findUnique({
      where: { email: DEFAULT_USER_EMAIL },
      include: { profile: true }
    }),
    prisma.user.findUnique({
      where: { email: targetEmail },
      include: { profile: true }
    })
  ]);

  if (!sourceUser) {
    throw new Error("No local@star.test user was found.");
  }

  if (!targetUser) {
    throw new Error(
      `No user exists for ${targetEmail}. Sign in with Google once, then run this script again.`
    );
  }

  if (sourceUser.profile && targetUser.profile) {
    throw new Error(
      "Both source and target users already have profiles. Run `pnpm tsx scripts/profile-admin.ts list`, then delete the disposable target profile with `pnpm tsx scripts/profile-admin.ts delete-profile <email|profile-id|public-slug>` before claiming data."
    );
  }

  const [resumeCount, answerCount, narrativeCount, targetJobCount] =
    await prisma.$transaction([
      prisma.resume.updateMany({
        where: { userId: sourceUser.id },
        data: { userId: targetUser.id }
      }),
      prisma.starResponse.updateMany({
        where: { userId: sourceUser.id },
        data: { userId: targetUser.id }
      }),
      prisma.narrative.updateMany({
        where: { userId: sourceUser.id },
        data: { userId: targetUser.id }
      }),
      prisma.targetJob.updateMany({
        where: { userId: sourceUser.id },
        data: { userId: targetUser.id }
      }),
      ...(sourceUser.profile
        ? [
            prisma.profile.update({
              where: { id: sourceUser.profile.id },
              data: { userId: targetUser.id }
            })
          ]
        : [])
    ]);

  console.log(`Claimed data for ${targetEmail}:`);
  console.log(`- resumes: ${resumeCount.count}`);
  console.log(`- STAR answers: ${answerCount.count}`);
  console.log(`- narratives: ${narrativeCount.count}`);
  console.log(`- target jobs: ${targetJobCount.count}`);
  console.log("- source user was left in place");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
