import {
  deleteNarrativeAction,
  deleteProfileAction,
  deleteResumeAction,
  deleteStarAnswerAction,
  deleteTargetJobAction,
  reassignNarrativeAction,
  reassignProfileAction,
  reassignResumeAction,
  reassignStarAnswerAction,
  reassignTargetJobAction
} from "@/app/admin/ownership/actions";
import { requireAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getOwnershipUsers() {
  return prisma.user.findMany({
    include: {
      accounts: {
        select: {
          provider: true
        }
      },
      profile: true,
      resumes: {
        include: {
          positions: {
            include: {
              _count: {
                select: {
                  starResponses: true,
                  narratives: true
                }
              }
            },
            orderBy: [{ end: "desc" }, { start: "desc" }, { updatedAt: "desc" }]
          }
        },
        orderBy: { importedAt: "desc" }
      },
      starResponses: {
        include: {
          position: {
            include: {
              resume: {
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { updatedAt: "desc" }
      },
      narratives: {
        include: {
          position: {
            include: {
              resume: {
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true
                    }
                  }
                }
              }
            }
          },
          targetJob: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          },
          sources: {
            include: {
              starResponse: {
                select: {
                  id: true,
                  title: true,
                  userId: true
                }
              }
            }
          }
        },
        orderBy: { updatedAt: "desc" }
      },
      targetJobs: {
        orderBy: { updatedAt: "desc" }
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
}

type OwnershipUser = Awaited<ReturnType<typeof getOwnershipUsers>>[number];
type AdminAction = (formData: FormData) => Promise<void>;

function userLabel(user: Pick<OwnershipUser, "id" | "email" | "name">) {
  return user.email || user.name || user.id;
}

function UserSelect({
  currentUserId,
  users
}: {
  currentUserId: string;
  users: OwnershipUser[];
}) {
  return (
    <select name="targetUserId" className="field" required>
      <option value="">Move to...</option>
      {users
        .filter((user) => user.id !== currentUserId)
        .map((user) => (
          <option key={user.id} value={user.id}>
            {userLabel(user)}
          </option>
        ))}
    </select>
  );
}

function ReassignForm({
  action,
  currentUserId,
  idName,
  idValue,
  users
}: {
  action: AdminAction;
  currentUserId: string;
  idName: string;
  idValue: string;
  users: OwnershipUser[];
}) {
  return (
    <form action={action} className="mt-3 flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name={idName} value={idValue} />
      <UserSelect currentUserId={currentUserId} users={users} />
      <button type="submit" className="button-secondary">
        Reassign
      </button>
    </form>
  );
}

function DeleteForm({
  action,
  idName,
  idValue,
  ownerEmail
}: {
  action: AdminAction;
  idName: string;
  idValue: string;
  ownerEmail: string | null;
}) {
  return (
    <form action={action} className="mt-3 flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name={idName} value={idValue} />
      <input
        name="confirmation"
        className="field"
        placeholder={`Type ${idValue} or ${ownerEmail ?? "owner email"}`}
        required
      />
      <button type="submit" className="button-secondary">
        Delete
      </button>
    </form>
  );
}

function WarningList({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 rounded-[1.25rem] border border-ochre/30 bg-ochre/10 p-3 text-sm font-semibold leading-6 text-ink/75">
      {warnings.map((warning) => (
        <p key={warning}>{warning}</p>
      ))}
    </div>
  );
}

export default async function AdminOwnershipPage() {
  const admin = await requireAdminUser();
  const users = await getOwnershipUsers();

  return (
    <div className="space-y-6">
      <section className="card">
        <p className="label">Admin</p>
        <h1 className="mt-3 text-5xl font-black">Ownership console.</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-ink/60">
          Signed in as {userLabel(admin)}. Inspect claimed and unclaimed
          accounts, then reassign or delete selected records with guarded
          controls. Deletes require typing the record id or owner email.
        </p>
      </section>

      <section className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="label">Accounts</p>
            <h2 className="mt-3 text-3xl font-black">Claim state.</h2>
          </div>
          <span className="pill">{users.length} users</span>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="text-xs font-black uppercase text-ink/45">
              <tr>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Profile</th>
                <th className="py-2 pr-4">Resumes</th>
                <th className="py-2 pr-4">Answers</th>
                <th className="py-2 pr-4">Narratives</th>
                <th className="py-2 pr-4">Target jobs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="py-3 pr-4">
                    <div className="font-black">{userLabel(user)}</div>
                    <div className="font-mono text-xs text-ink/45">{user.id}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="pill">
                      {user.accounts.length > 0 ? "claimed" : "unclaimed"}
                    </span>
                    <div className="mt-1 text-xs text-ink/45">
                      {user.accounts.map((account) => account.provider).join(", ")}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    {user.profile ? user.profile.displayName || user.profile.id : "None"}
                  </td>
                  <td className="py-3 pr-4">{user._count.resumes}</td>
                  <td className="py-3 pr-4">{user._count.starResponses}</td>
                  <td className="py-3 pr-4">{user._count.narratives}</td>
                  <td className="py-3 pr-4">{user._count.targetJobs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {users.map((user) => (
        <section key={user.id} className="card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="label">
                {user.accounts.length > 0 ? "Claimed account" : "Unclaimed account"}
              </p>
              <h2 className="mt-3 text-4xl font-black">{userLabel(user)}</h2>
              <p className="mt-2 font-mono text-xs text-ink/45">{user.id}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="pill">{user.resumes.length} resumes</span>
              <span className="pill">{user.starResponses.length} answers</span>
              <span className="pill">{user.narratives.length} narratives</span>
              <span className="pill">{user.targetJobs.length} target jobs</span>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <article className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-5">
              <p className="label">Profile</p>
              {user.profile ? (
                <>
                  <h3 className="mt-2 text-2xl font-black">
                    {user.profile.displayName || "Untitled profile"}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-ink/45">
                    {user.profile.id}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="pill">
                      {user.profile.isPublic ? "public" : "private"}
                    </span>
                    {user.profile.publicSlug ? (
                      <span className="pill">/{user.profile.publicSlug}</span>
                    ) : null}
                  </div>
                  <ReassignForm
                    action={reassignProfileAction}
                    currentUserId={user.id}
                    idName="profileId"
                    idValue={user.profile.id}
                    users={users}
                  />
                  <DeleteForm
                    action={deleteProfileAction}
                    idName="profileId"
                    idValue={user.profile.id}
                    ownerEmail={user.email}
                  />
                </>
              ) : (
                <p className="mt-2 text-sm text-ink/55">No profile row.</p>
              )}
            </article>

            <div className="grid gap-4 lg:grid-cols-2">
              <article className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-5">
                <p className="label">Resumes</p>
                <div className="mt-4 grid gap-4">
                  {user.resumes.length === 0 ? (
                    <p className="text-sm text-ink/55">No resumes.</p>
                  ) : (
                    user.resumes.map((resume) => {
                      const answerCount = resume.positions.reduce(
                        (total, position) => total + position._count.starResponses,
                        0
                      );
                      const narrativeCount = resume.positions.reduce(
                        (total, position) => total + position._count.narratives,
                        0
                      );

                      return (
                        <div key={resume.id} className="border-t border-ink/10 pt-4">
                          <h3 className="font-black">{resume.source}</h3>
                          <p className="mt-1 font-mono text-xs text-ink/45">
                            {resume.id}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="pill">
                              {resume.positions.length} positions
                            </span>
                            <span className="pill">{answerCount} answers</span>
                            <span className="pill">{narrativeCount} narratives</span>
                          </div>
                          <ReassignForm
                            action={reassignResumeAction}
                            currentUserId={user.id}
                            idName="resumeId"
                            idValue={resume.id}
                            users={users}
                          />
                          <p className="mt-3 text-xs font-semibold text-ink/50">
                            Deleting this resume cascades its positions and STAR
                            answers.
                          </p>
                          <DeleteForm
                            action={deleteResumeAction}
                            idName="resumeId"
                            idValue={resume.id}
                            ownerEmail={user.email}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </article>

              <article className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-5">
                <p className="label">Target jobs</p>
                <div className="mt-4 grid gap-4">
                  {user.targetJobs.length === 0 ? (
                    <p className="text-sm text-ink/55">No target jobs.</p>
                  ) : (
                    user.targetJobs.map((targetJob) => (
                      <div key={targetJob.id} className="border-t border-ink/10 pt-4">
                        <h3 className="font-black">{targetJob.title}</h3>
                        <p className="mt-1 text-sm font-semibold text-moss">
                          {targetJob.company}
                        </p>
                        <p className="mt-1 font-mono text-xs text-ink/45">
                          {targetJob.id}
                        </p>
                        <ReassignForm
                          action={reassignTargetJobAction}
                          currentUserId={user.id}
                          idName="targetJobId"
                          idValue={targetJob.id}
                          users={users}
                        />
                        <DeleteForm
                          action={deleteTargetJobAction}
                          idName="targetJobId"
                          idValue={targetJob.id}
                          ownerEmail={user.email}
                        />
                      </div>
                    ))
                  )}
                </div>
              </article>
            </div>

            <article className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-5">
              <p className="label">STAR answers</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {user.starResponses.length === 0 ? (
                  <p className="text-sm text-ink/55">No STAR answers.</p>
                ) : (
                  user.starResponses.map((answer) => {
                    const warnings =
                      answer.position.resume.userId === answer.userId
                        ? []
                        : [
                            `Answer owner differs from its resume owner (${answer.position.resume.user.email ?? answer.position.resume.user.id}).`
                          ];

                    return (
                      <div key={answer.id} className="border-t border-ink/10 pt-4">
                        <h3 className="font-black">{answer.title}</h3>
                        <p className="mt-1 text-sm font-semibold text-moss">
                          {answer.position.title} at {answer.position.company}
                        </p>
                        <p className="mt-1 font-mono text-xs text-ink/45">
                          {answer.id}
                        </p>
                        <WarningList warnings={warnings} />
                        <ReassignForm
                          action={reassignStarAnswerAction}
                          currentUserId={user.id}
                          idName="answerId"
                          idValue={answer.id}
                          users={users}
                        />
                        <DeleteForm
                          action={deleteStarAnswerAction}
                          idName="answerId"
                          idValue={answer.id}
                          ownerEmail={user.email}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </article>

            <article className="rounded-[1.5rem] border border-ink/10 bg-paper/70 p-5">
              <p className="label">Narratives</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {user.narratives.length === 0 ? (
                  <p className="text-sm text-ink/55">No narratives.</p>
                ) : (
                  user.narratives.map((narrative) => {
                    const warnings = [
                      narrative.position &&
                      narrative.position.resume.userId !== narrative.userId
                        ? `Narrative owner differs from position resume owner (${narrative.position.resume.user.email ?? narrative.position.resume.user.id}).`
                        : "",
                      narrative.targetJob &&
                      narrative.targetJob.userId !== narrative.userId
                        ? `Narrative owner differs from target job owner (${narrative.targetJob.user.email ?? narrative.targetJob.user.id}).`
                        : "",
                      ...narrative.sources
                        .filter((source) => source.starResponse.userId !== narrative.userId)
                        .map(
                          (source) =>
                            `Source answer "${source.starResponse.title}" is owned by another user.`
                        )
                    ].filter(Boolean);

                    return (
                      <div key={narrative.id} className="border-t border-ink/10 pt-4">
                        <h3 className="font-black">{narrative.title}</h3>
                        <p className="mt-1 text-sm font-semibold text-moss">
                          {narrative.scope} / {narrative.theme}
                        </p>
                        <p className="mt-1 font-mono text-xs text-ink/45">
                          {narrative.id}
                        </p>
                        <WarningList warnings={warnings} />
                        <ReassignForm
                          action={reassignNarrativeAction}
                          currentUserId={user.id}
                          idName="narrativeId"
                          idValue={narrative.id}
                          users={users}
                        />
                        <DeleteForm
                          action={deleteNarrativeAction}
                          idName="narrativeId"
                          idValue={narrative.id}
                          ownerEmail={user.email}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </article>
          </div>
        </section>
      ))}
    </div>
  );
}
