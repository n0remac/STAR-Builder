import { deleteNarrativeAction } from "@/app/narratives/actions";
import { NarrativeGenerationPanel } from "@/app/narratives/_components/narrative-generation-panel";
import { DeleteSubmitButton } from "@/components/delete-submit-button";
import { Badge, ButtonLink, EmptyState, Panel } from "@/components/ui";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import {
  NARRATIVE_SCOPE_LABELS,
  getNarrativeScoreLabel,
  narrativeThemeLabel
} from "@/lib/narrative";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export default async function NarrativesPage() {
  const user = await requireCurrentUser();
  const [jobs, narratives] = await Promise.all([
    prisma.position.findMany({
      where: {
        resume: {
          userId: user.id
        }
      },
      include: {
        starResponses: {
          orderBy: {
            updatedAt: "desc"
          },
          select: {
            id: true,
            category: true,
            title: true,
            result: true,
            situation: true
          }
        },
        _count: {
          select: {
            starResponses: true
          }
        }
      },
      orderBy: [
        { end: "desc" },
        { start: "desc" },
        { updatedAt: "desc" }
      ]
    }),
    prisma.narrative.findMany({
      where: {
        userId: user.id
      },
      include: {
        position: true,
        targetJob: true,
        _count: {
          select: {
            sources: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    })
  ]);
  const careerNarratives = narratives.filter(
    (narrative) => narrative.scope === "career"
  );
  const jobNarratives = narratives.filter(
    (narrative) => narrative.scope === "job"
  );
  const targetJobNarratives = narratives.filter(
    (narrative) => narrative.scope === "target_job"
  );
  const narrativeSections = [
    { label: "Career-wide", narratives: careerNarratives },
    { label: "Per-job", narratives: jobNarratives },
    { label: "Target job", narratives: targetJobNarratives }
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <NarrativeGenerationPanel
        jobs={jobs.map((job) => ({
          id: job.id,
          title: job.title,
          company: job.company,
          starCount: job._count.starResponses
        }))}
        sourceGroups={jobs.map((job) => ({
          id: job.id,
          title: job.title,
          company: job.company,
          answers: job.starResponses
        }))}
      />

      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="label">Saved narratives</p>
            <h2 className="mt-3 text-4xl font-black">Narrative library.</h2>
          </div>
          <Badge>{narratives.length} total</Badge>
        </div>

        {narratives.length === 0 ? (
          <EmptyState>
            No narratives yet. Generate one from your saved STAR answers.
          </EmptyState>
        ) : (
          <div className="mt-6 space-y-6">
            {narrativeSections.map((section) => (
              <div key={section.label}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-black">{section.label}</h3>
                  <Badge>{section.narratives.length}</Badge>
                </div>
                <div className="mt-3 grid gap-4">
                  {section.narratives.length === 0 ? (
                    <EmptyState size="compact">
                      None saved.
                    </EmptyState>
                  ) : (
                    section.narratives.map((narrative) => (
                      <article
                        key={narrative.id}
                        className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <Badge>
                                {NARRATIVE_SCOPE_LABELS[narrative.scope]}
                              </Badge>
                              <Badge>
                                {narrativeThemeLabel(narrative.theme)}
                              </Badge>
                              <Badge>
                                {getNarrativeScoreLabel(narrative)}
                              </Badge>
                            </div>
                            <h4 className="mt-3 text-2xl font-black">
                              {narrative.title}
                            </h4>
                            {narrative.position ? (
                              <p className="mt-1 text-sm font-semibold text-moss">
                                {narrative.position.title} at{" "}
                                {narrative.position.company}
                              </p>
                            ) : null}
                            {narrative.targetJob ? (
                              <p className="mt-1 text-sm font-semibold text-moss">
                                Targeting {narrative.targetJob.title} at{" "}
                                {narrative.targetJob.company}
                              </p>
                            ) : null}
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink/65">
                              {narrative.positioning}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <ButtonLink
                              href={`/narratives/${narrative.id}`}
                              variant="secondary"
                            >
                              Edit
                            </ButtonLink>
                            <form action={deleteNarrativeAction}>
                              <input
                                type="hidden"
                                name="id"
                                value={narrative.id}
                              />
                              <DeleteSubmitButton
                                confirmationMessage={`Delete narrative "${narrative.title}"?`}
                              >
                                Delete
                              </DeleteSubmitButton>
                            </form>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge>
                            {narrative._count.sources} source
                            {narrative._count.sources === 1 ? "" : "s"}
                          </Badge>
                          <Badge>
                            Updated {formatDate(narrative.updatedAt)}
                          </Badge>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
