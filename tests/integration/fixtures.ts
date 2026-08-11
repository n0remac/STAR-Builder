import { prisma } from "@/lib/db";
import { getNarrativeFingerprint } from "@/lib/narrative";
import { getStarDraftFingerprint } from "@/lib/star";

export async function resetDatabase() {
  await prisma.narrativeSource.deleteMany();
  await prisma.narrative.deleteMany();
  await prisma.targetJob.deleteMany();
  await prisma.starResponse.deleteMany();
  await prisma.position.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
}

export async function createOwnedGraph(owner: string) {
  const user = await prisma.user.create({
    data: {
      id: `${owner}-user`,
      email: `${owner}@example.test`,
      name: `User ${owner.toUpperCase()}`,
      profile: {
        create: {
          displayName: `User ${owner.toUpperCase()}`
        }
      }
    }
  });
  const resume = await prisma.resume.create({
    data: {
      id: `${owner}-resume`,
      source: "integration-test",
      text: `${owner} resume`,
      userId: user.id
    }
  });
  const position = await prisma.position.create({
    data: {
      id: `${owner}-position`,
      company: `${owner.toUpperCase()} Company`,
      resumeId: resume.id,
      title: `${owner.toUpperCase()} Engineer`
    }
  });
  const answerDraft = {
    title: `${owner.toUpperCase()} delivery`,
    situation: "A critical delivery was at risk.",
    task: "Restore a predictable delivery plan.",
    actions: "Aligned the team and removed blockers.",
    result: "Delivered the project on time."
  };
  const answer = await prisma.starResponse.create({
    data: {
      id: `${owner}-answer`,
      ...answerDraft,
      positionId: position.id,
      score: 8,
      scoreDraftHash: getStarDraftFingerprint(answerDraft),
      scoreIsStale: false,
      scoreRationale: "Clear ownership and outcome.",
      scoredAt: new Date("2026-01-01T00:00:00.000Z"),
      userId: user.id
    }
  });
  const narrativeDraft = {
    title: `${owner.toUpperCase()} impact narrative`,
    positioning: "I turn ambiguity into delivery.",
    fullNarrative: "I repeatedly align teams around measurable outcomes.",
    shortVersion: "I align teams and deliver outcomes.",
    interviewGuidance: "Lead with the delivery result."
  };
  const narrative = await prisma.narrative.create({
    data: {
      id: `${owner}-narrative`,
      ...narrativeDraft,
      positionId: position.id,
      scope: "job",
      score: 8,
      scoreIsStale: false,
      scoreRationale: "Strong evidence and positioning.",
      scoredAt: new Date("2026-01-01T00:00:00.000Z"),
      sourceHash: getNarrativeFingerprint({
        ...narrativeDraft,
        scope: "job",
        sourceIds: [answer.id],
        theme: "impact"
      }),
      sources: {
        create: {
          roleInNarrative: "Cited",
          starResponseId: answer.id
        }
      },
      theme: "impact",
      userId: user.id
    }
  });

  return {
    answer,
    narrative,
    position,
    resume,
    user
  };
}
