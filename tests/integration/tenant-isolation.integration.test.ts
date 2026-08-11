import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const sessionState = vi.hoisted(() => ({
  userId: null as string | null
}));
const nextAdapters = vi.hoisted(() => ({
  redirect: vi.fn(),
  revalidatePath: vi.fn()
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () =>
    sessionState.userId
      ? {
          user: {
            id: sessionState.userId
          }
        }
      : null
  )
}));

vi.mock("next/cache", () => ({
  revalidatePath: nextAdapters.revalidatePath
}));

vi.mock("next/navigation", () => ({
  redirect: nextAdapters.redirect
}));

import { updateStarAnswerAction } from "@/app/answers/actions";
import { deleteJobAction } from "@/app/jobs/actions";
import { updateNarrativeAction } from "@/app/narratives/actions";
import { prisma } from "@/lib/db";
import {
  createOwnedGraph,
  resetDatabase
} from "./fixtures";

type OwnedGraph = Awaited<ReturnType<typeof createOwnedGraph>>;

let ownerA: OwnedGraph;
let ownerB: OwnedGraph;

function jobDeleteForm(jobId: string) {
  const formData = new FormData();
  formData.set("jobId", jobId);
  return formData;
}

function answerUpdateForm(answerId: string, title: string) {
  const formData = new FormData();
  formData.set("id", answerId);
  formData.set("category", "leadership");
  formData.set("title", title);
  formData.set("situation", "A changed situation.");
  formData.set("task", "A changed task.");
  formData.set("actions", "Changed actions with clear ownership.");
  formData.set("result", "A changed measurable result.");
  return formData;
}

function narrativeUpdateForm(narrativeId: string, title: string) {
  const formData = new FormData();
  formData.set("id", narrativeId);
  formData.set("title", title);
  formData.set("positioning", "Updated positioning.");
  formData.set("fullNarrative", "An updated full narrative with evidence.");
  formData.set("shortVersion", "An updated short narrative.");
  formData.set("interviewGuidance", "Use the updated evidence.");
  return formData;
}

describe("tenant-isolated server actions", () => {
  beforeEach(async () => {
    sessionState.userId = null;
    vi.clearAllMocks();
    await resetDatabase();
    ownerA = await createOwnedGraph("a");
    ownerB = await createOwnedGraph("b");
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it("does not let another user delete a job", async () => {
    sessionState.userId = ownerB.user.id;

    await expect(deleteJobAction(jobDeleteForm(ownerA.position.id))).rejects.toThrow(
      "Job not found."
    );

    expect(
      await prisma.position.findUnique({ where: { id: ownerA.position.id } })
    ).not.toBeNull();
    expect(
      await prisma.starResponse.findUnique({ where: { id: ownerA.answer.id } })
    ).not.toBeNull();
  });

  it("lets the owner delete a job and applies relational cleanup", async () => {
    sessionState.userId = ownerA.user.id;

    await deleteJobAction(jobDeleteForm(ownerA.position.id));

    expect(nextAdapters.redirect).toHaveBeenCalledWith("/jobs");
    expect(
      await prisma.position.findUnique({ where: { id: ownerA.position.id } })
    ).toBeNull();
    expect(
      await prisma.starResponse.findUnique({ where: { id: ownerA.answer.id } })
    ).toBeNull();
    expect(
      await prisma.narrative.findUnique({ where: { id: ownerA.narrative.id } })
    ).toMatchObject({ positionId: null });
    expect(
      await prisma.narrativeSource.count({
        where: { narrativeId: ownerA.narrative.id }
      })
    ).toBe(0);
    expect(
      await prisma.position.findUnique({ where: { id: ownerB.position.id } })
    ).not.toBeNull();
  });

  it("does not let another user update a STAR answer", async () => {
    sessionState.userId = ownerB.user.id;
    const original = await prisma.starResponse.findUniqueOrThrow({
      where: { id: ownerA.answer.id }
    });

    await expect(
      updateStarAnswerAction(
        answerUpdateForm(ownerA.answer.id, "Unauthorized update")
      )
    ).rejects.toThrow("STAR answer not found.");

    expect(
      await prisma.starResponse.findUniqueOrThrow({
        where: { id: ownerA.answer.id }
      })
    ).toEqual(original);
  });

  it("lets the owner update a STAR answer and marks its score stale", async () => {
    sessionState.userId = ownerA.user.id;

    await updateStarAnswerAction(
      answerUpdateForm(ownerA.answer.id, "Authorized update")
    );

    expect(nextAdapters.redirect).toHaveBeenCalledWith(
      `/answers/${ownerA.answer.id}`
    );
    expect(
      await prisma.starResponse.findUniqueOrThrow({
        where: { id: ownerA.answer.id }
      })
    ).toMatchObject({
      score: 8,
      scoreIsStale: true,
      title: "Authorized update",
      userId: ownerA.user.id
    });
  });

  it("does not let another user update a narrative", async () => {
    sessionState.userId = ownerB.user.id;
    const original = await prisma.narrative.findUniqueOrThrow({
      where: { id: ownerA.narrative.id }
    });

    await expect(
      updateNarrativeAction(
        narrativeUpdateForm(ownerA.narrative.id, "Unauthorized narrative")
      )
    ).rejects.toThrow("Narrative not found.");

    expect(
      await prisma.narrative.findUniqueOrThrow({
        where: { id: ownerA.narrative.id }
      })
    ).toEqual(original);
  });

  it("lets the owner update a narrative without losing its sources", async () => {
    sessionState.userId = ownerA.user.id;

    await updateNarrativeAction(
      narrativeUpdateForm(ownerA.narrative.id, "Authorized narrative")
    );

    expect(nextAdapters.redirect).toHaveBeenCalledWith(
      `/narratives/${ownerA.narrative.id}`
    );
    expect(
      await prisma.narrative.findUniqueOrThrow({
        where: { id: ownerA.narrative.id },
        include: { sources: true }
      })
    ).toMatchObject({
      score: 8,
      scoreIsStale: true,
      sources: [
        {
          starResponseId: ownerA.answer.id
        }
      ],
      title: "Authorized narrative",
      userId: ownerA.user.id
    });
  });

  it.each([
    ["without a session", null],
    ["when the session user no longer exists", "missing-user"]
  ])("rejects mutations %s", async (_label, userId) => {
    sessionState.userId = userId;

    await expect(
      updateStarAnswerAction(
        answerUpdateForm(ownerA.answer.id, "Unauthenticated update")
      )
    ).rejects.toThrow("You must be signed in to do that.");
  });
});
