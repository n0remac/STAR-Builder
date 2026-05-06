import Link from "next/link";
import { notFound } from "next/navigation";

import { StarAnswerEditor } from "@/app/answers/_components/star-answer-editor";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export default async function AnswerDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const answer = await prisma.starResponse.findFirst({
    where: {
      id,
      userId: user.id
    },
    include: {
      position: true
    }
  });

  if (!answer) {
    notFound();
  }

  const draft = {
    category: answer.category,
    title: answer.title,
    situation: answer.situation,
    task: answer.task,
    actions: answer.actions,
    result: answer.result
  };
  const feedback = {
    situation: answer.situationFeedback,
    task: answer.taskFeedback,
    actions: answer.actionsFeedback,
    result: answer.resultFeedback
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <StarAnswerEditor
        id={answer.id}
        initialState={{
          draft,
          feedback,
          score: answer.score,
          scoreRationale: answer.scoreRationale,
          scoreIsStale: answer.scoreIsStale
        }}
      />

      <aside className="card h-fit">
        <p className="label">Job context</p>
        <h2 className="mt-3 text-3xl font-black">{answer.position.title}</h2>
        <p className="mt-2 text-lg font-semibold text-moss">
          {answer.position.company}
        </p>
        <p className="mt-2 text-sm font-semibold text-ink/55">
          {[answer.position.start, answer.position.end]
            .filter(Boolean)
            .join(" - ") || "Dates not set"}
        </p>
        <Link
          href={`/jobs/${answer.positionId}`}
          className="button-secondary mt-6"
        >
          Back to job
        </Link>
      </aside>
    </div>
  );
}
