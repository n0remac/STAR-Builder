import {
  type JobStarDraftsInput,
  JobStarDraftsInputSchema,
  type JobStarDraftsOutput,
  type JobStarQuestionsInput,
  JobStarQuestionsInputSchema,
  type JobStarQuestionsOutput,
  type NarrativeFeedbackInput,
  NarrativeFeedbackInputSchema,
  type NarrativeFeedbackOutput,
  type NarrativeInput,
  NarrativeInputSchema,
  type NarrativeOutput,
  type NarrativeScoreInput,
  NarrativeScoreInputSchema,
  type NarrativeScoreOutput,
  type NarrativeThemeExtractionInput,
  NarrativeThemeExtractionInputSchema,
  type NarrativeThemeExtractionOutput,
  type ResumeExtractionInput,
  ResumeExtractionInputSchema,
  type ResumeExtractionOutput,
  type StarAssistInput,
  StarAssistInputSchema,
  type StarAssistOutput,
  type StarFeedbackInput,
  StarFeedbackInputSchema,
  type StarFeedbackOutput,
  type StarScoreInput,
  StarScoreInputSchema,
  type StarScoreOutput
} from "@/features/ai/schemas";
import {
  compactSentence,
  normalizeTextareaText
} from "@/lib/normalization";

const categoryCycle = [
  "achievement",
  "challenge",
  "collaboration"
] as const;
const draftFocusCategories = [
  "achievement",
  "challenge",
  "collaboration",
  "leadership"
] as const;

function extractResumeLines(resumeText: string) {
  return normalizeTextareaText(resumeText)
    .split("\n")
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
}

function extractMetric(value: string) {
  return value.match(/(?:\d+(?:\.\d+)?%?|\$[\d,.]+|[0-9]+x)/i)?.[0] ?? "";
}

function wordCount(value: string) {
  return normalizeTextareaText(value)
    .split(/\s+/)
    .filter(Boolean).length;
}

function readableTheme(theme: string) {
  return theme.replace(/_/g, " ");
}

function generatedStar({
  answerText,
  category,
  fallbackTitle
}: {
  answerText: string;
  category: "achievement" | "challenge" | "collaboration" | "leadership";
  fallbackTitle: string;
}) {
  const metric = extractMetric(answerText);

  return {
    category,
    title: compactSentence(answerText, fallbackTitle),
    situation: answerText,
    task: "",
    actions: "",
    result: metric ? `Captured metric: ${metric}.` : ""
  };
}

export function mockResumeExtraction(
  input: ResumeExtractionInput
): ResumeExtractionOutput {
  const { resumeText } = ResumeExtractionInputSchema.parse(input);
  const lines = extractResumeLines(resumeText);
  const roleLine =
    lines.find((line) =>
      /engineer|manager|designer|analyst|developer|lead|specialist/i.test(line)
    ) ?? lines[0];
  const companyLine =
    lines.find((line) => / at |, inc| llc| corp| company|labs|studio/i.test(line)) ??
    "Company from resume";
  const storyLines = lines
    .filter((line) => line.length > 25)
    .sort((a, b) => Number(/\d/.test(b)) - Number(/\d/.test(a)))
    .slice(0, 3);
  const starAnswers = (storyLines.length > 0 ? storyLines : lines.slice(0, 3))
    .slice(0, 3)
    .map((line, index) =>
      generatedStar({
        answerText: line,
        category: categoryCycle[index % categoryCycle.length],
        fallbackTitle: `Resume STAR draft ${index + 1}`
      })
    );

  return {
    positions: [
      {
        title: compactSentence(roleLine, "Resume-derived role"),
        company: compactSentence(companyLine, "Company from resume"),
        start: "",
        end: "",
        starAnswers:
          starAnswers.length > 0
            ? starAnswers
            : [
                {
                  category: "achievement",
                  title: "Resume-derived STAR draft",
                  situation: "Add details from this resume section.",
                  task: "",
                  actions: "",
                  result: ""
                }
              ]
      }
    ]
  };
}

export function mockJobStarQuestions(
  input: JobStarQuestionsInput
): JobStarQuestionsOutput {
  const parsed = JobStarQuestionsInputSchema.parse(input);
  const existingCategories = new Set(
    parsed.starAnswers.map((answer) => answer.category)
  );
  const jobLabel = `${parsed.job.title} at ${parsed.job.company}`;

  return {
    questions: [
      {
        question: `What was the most measurable outcome you created as ${jobLabel}?`,
        rationale:
          "Strong STAR answers need a before-and-after result or metric.",
        focus: "achievement"
      },
      {
        question:
          "What difficult problem did you personally own, and what made it hard?",
        rationale:
          "This can become a challenge answer with clear stakes and ownership.",
        focus: "challenge"
      },
      {
        question:
          "Where did you influence people outside your direct role or team?",
        rationale:
          "This adds collaboration or leadership range beyond individual execution.",
        focus: existingCategories.has("collaboration")
          ? "leadership"
          : "collaboration"
      },
      {
        question:
          "What process, product, system, or customer outcome improved because of your work?",
        rationale:
          "This helps discover distinct STAR answers that may not be on the resume yet.",
        focus: existingCategories.has("achievement") ? "result" : "achievement"
      }
    ]
  };
}

export function mockJobStarDrafts(
  input: JobStarDraftsInput
): JobStarDraftsOutput {
  const parsed = JobStarDraftsInputSchema.parse(input);
  const answered = parsed.answers
    .map((answer) => ({
      ...answer,
      answer: normalizeTextareaText(answer.answer)
    }))
    .filter((answer) => answer.answer.length > 0)
    .slice(0, 3);

  return {
    starAnswers: answered.map((answer, index) => {
      const inferredCategory = draftFocusCategories.includes(
        answer.focus as (typeof draftFocusCategories)[number]
      )
        ? (answer.focus as (typeof draftFocusCategories)[number])
        : categoryCycle[index % categoryCycle.length];

      return generatedStar({
        answerText: answer.answer,
        category: inferredCategory,
        fallbackTitle: `Draft STAR answer ${index + 1}`
      });
    })
  };
}

export function mockStarAssist(input: StarAssistInput): StarAssistOutput {
  const parsed = StarAssistInputSchema.parse(input);
  const draft = parsed.draft;
  const generated = {
    category: draft.category,
    title: draft.title || `STAR: ${parsed.job.title} at ${parsed.job.company}`,
    situation:
      draft.situation ||
      `At ${parsed.job.company}, I was working as ${parsed.job.title} when the team faced a meaningful business or customer problem.`,
    task:
      draft.task ||
      "My responsibility was to clarify the goal, own the work needed to make progress, and define what success would look like.",
    actions:
      draft.actions ||
      "I broke the problem into concrete steps, aligned the right stakeholders, executed the highest-impact work, and adjusted based on feedback.",
    result:
      draft.result ||
      "The work improved the outcome for the team or customer. Add a confirmed metric before using this answer in an interview."
  };

  if (parsed.mode === "generate") {
    return generated;
  }

  if (parsed.scope === "all") {
    return {
      ...generated,
      title: draft.title || generated.title,
      situation: draft.situation
        ? `Rewritten: ${draft.situation}`
        : generated.situation,
      task: draft.task ? `Rewritten: ${draft.task}` : generated.task,
      actions: draft.actions
        ? `Rewritten: ${draft.actions}`
        : generated.actions,
      result: draft.result ? `Rewritten: ${draft.result}` : generated.result
    };
  }

  return {
    ...draft,
    title:
      parsed.scope === "title"
        ? `Rewritten: ${draft.title || generated.title}`
        : draft.title,
    situation:
      parsed.scope === "situation"
        ? `Rewritten: ${draft.situation || generated.situation}`
        : draft.situation,
    task:
      parsed.scope === "task"
        ? `Rewritten: ${draft.task || generated.task}`
        : draft.task,
    actions:
      parsed.scope === "actions"
        ? `Rewritten: ${draft.actions || generated.actions}`
        : draft.actions,
    result:
      parsed.scope === "result"
        ? `Rewritten: ${draft.result || generated.result}`
        : draft.result
  };
}

export function mockStarFeedback(input: StarFeedbackInput): StarFeedbackOutput {
  const parsed = StarFeedbackInputSchema.parse(input);
  const draft = parsed.draft;

  return {
    situation: draft.situation
      ? "Clarify the initial stakes, constraints, and why this mattered to the business or customer."
      : `Add the context for the situation at ${parsed.job.company} before describing the task.`,
    task: draft.task
      ? "Make your specific ownership explicit and keep the task narrower than the action details."
      : "Add the responsibility you personally owned and the success criteria you were working toward.",
    actions: draft.actions
      ? "Replace generic action language with the key decisions, tradeoffs, and steps you personally drove."
      : "Add the concrete steps you took, including decisions, collaboration, and execution details.",
    result: draft.result
      ? "Tie the outcome to a measurable or clearly observable before-and-after impact."
      : "Add the outcome, preferably with a metric or clear evidence that the work mattered."
  };
}

export function mockStarScore(input: StarScoreInput): StarScoreOutput {
  const { draft } = StarScoreInputSchema.parse(input);
  const sectionWords = {
    situation: wordCount(draft.situation),
    task: wordCount(draft.task),
    actions: wordCount(draft.actions),
    result: wordCount(draft.result)
  };
  const filledSections = Object.values(sectionWords).filter(
    (count) => count >= 4
  ).length;
  const totalWords =
    wordCount(draft.title) +
    sectionWords.situation +
    sectionWords.task +
    sectionWords.actions +
    sectionWords.result;
  const hasMetric = Boolean(extractMetric(draft.result));
  const hasMeaningfulResult =
    sectionWords.result >= 8 &&
    /improv|reduc|increas|saved|grew|launched|delivered|faster|better|cut|impact/i.test(
      draft.result
    );
  const taskIsBalanced =
    sectionWords.task > 0 &&
    sectionWords.task <= sectionWords.actions + sectionWords.result;
  const actionDetail = sectionWords.actions >= 12 ? 1 : 0;
  const lengthScore = totalWords >= 90 ? 2 : totalWords >= 45 ? 1 : 0;
  const resultScore = hasMetric ? 2 : hasMeaningfulResult ? 1 : 0;
  const balanceScore = taskIsBalanced ? 1 : 0;
  const rawScore =
    1 + filledSections + lengthScore + actionDetail + resultScore + balanceScore;
  const score = Math.max(1, Math.min(10, rawScore));
  const strengths = [
    filledSections === 4 ? "covers all STAR sections" : "",
    hasMetric ? "includes a measurable result" : "",
    actionDetail ? "has concrete action detail" : ""
  ].filter(Boolean);
  const gaps = [
    filledSections < 4 ? "complete the missing STAR sections" : "",
    !hasMetric && !hasMeaningfulResult ? "make the result more concrete" : "",
    !taskIsBalanced ? "clarify the task without overexpanding it" : ""
  ].filter(Boolean);

  return {
    score,
    rationale:
      strengths.length > 0
        ? `This ${strengths.join(", ")}. ${
            gaps[0] ? `Next, ${gaps.join(" and ")}.` : "It is interview-ready."
          }`
        : `This needs more detail: ${gaps.join(" and ") || "expand the STAR sections"}.`
  };
}

export function mockCareerNarrative(input: NarrativeInput): NarrativeOutput {
  const parsed = NarrativeInputSchema.parse(input);
  const allStories = parsed.jobs.flatMap((job) =>
    job.stories.map((story) => ({
      ...story,
      job: job.job
    }))
  );
  const citedStories = allStories.slice(0, Math.max(1, Math.min(4, allStories.length)));
  const primaryStory = citedStories[0];
  const theme = readableTheme(parsed.theme);
  const scopeLabel =
    parsed.scope === "career"
      ? "career"
      : `${parsed.job?.title ?? primaryStory?.job.title} at ${
          parsed.job?.company ?? primaryStory?.job.company
        }`;
  const proofPoints = citedStories
    .map(
      (story) =>
        `${story.title} (${story.job.title} at ${story.job.company})`
    )
    .join("; ");

  return {
    title: `${theme[0]?.toUpperCase() ?? "T"}${theme.slice(1)} narrative`,
    positioning: `My ${scopeLabel} narrative centers on ${theme}, backed by ${proofPoints}.`,
    fullNarrative: `Across ${scopeLabel}, I can show ${theme} through specific STAR stories rather than broad claims. The strongest proof points are ${proofPoints}. Together, these examples show how I identify what matters, take ownership of the work, and connect execution to outcomes that teams and customers can understand.`,
    shortVersion: `I bring a ${theme}-oriented track record, with examples such as ${primaryStory?.title ?? "my strongest STAR story"}.`,
    interviewGuidance: `Lead with the positioning statement, then bridge into ${primaryStory?.title ?? "the clearest cited story"}. Keep the setup brief, emphasize your personal actions, and close with the result before offering another cited example.`,
    citedSourceIds: citedStories.map((story) => story.id)
  };
}

export function mockNarrativeThemeExtraction(
  input: NarrativeThemeExtractionInput
): NarrativeThemeExtractionOutput {
  const parsed = NarrativeThemeExtractionInputSchema.parse(input);
  const allStories = parsed.jobs.flatMap((job) =>
    job.stories.map((story) => ({
      ...story,
      job: job.job
    }))
  );
  const sourceIds = allStories.map((story) => story.id);
  const combinedText = allStories
    .map((story) =>
      [
        story.category,
        story.title,
        story.situation,
        story.task,
        story.actions,
        story.result
      ].join(" ")
    )
    .join(" ");
  const candidates = [
    {
      theme: "Measurable impact",
      pattern: /%|\$|\d|improv|reduc|increas|saved|grew|faster|launched|delivered/i,
      rationale:
        "Several STAR answers include outcomes or before-and-after results."
    },
    {
      theme: "Cross-functional leadership",
      pattern: /lead|align|partner|stakeholder|team|mentor|collabor/i,
      rationale:
        "The source stories show influence across people, teams, or functions."
    },
    {
      theme: "Technical ownership",
      pattern: /engineer|system|pipeline|build|migration|data|technical|architecture|reliability/i,
      rationale:
        "The answers include technical problem ownership and implementation detail."
    },
    {
      theme: "Operating through ambiguity",
      pattern: /ambiguous|unclear|complex|problem|challenge|constraint|risk|clarif/i,
      rationale:
        "The stories point to clarifying messy situations and moving work forward."
    },
    {
      theme: "Customer-centered execution",
      pattern: /customer|support|user|client|experience|product/i,
      rationale:
        "The answers connect execution to customer, user, or product outcomes."
    }
  ];
  const matched = candidates.filter((candidate) =>
    candidate.pattern.test(combinedText)
  );
  const themes = [...matched, ...candidates]
    .filter(
      (candidate, index, array) =>
        array.findIndex((item) => item.theme === candidate.theme) === index
    )
    .slice(0, 3);

  return {
    themes: themes.map((theme, index) => ({
      theme: theme.theme,
      rationale: theme.rationale,
      citedSourceIds: sourceIds.slice(0, Math.max(1, Math.min(sourceIds.length, index + 2)))
    }))
  };
}

export function mockCareerNarrativeScore(
  input: NarrativeScoreInput
): NarrativeScoreOutput {
  const parsed = NarrativeScoreInputSchema.parse(input);
  const totalWords =
    wordCount(parsed.draft.positioning) +
    wordCount(parsed.draft.fullNarrative) +
    wordCount(parsed.draft.shortVersion) +
    wordCount(parsed.draft.interviewGuidance);
  const hasGuidance = wordCount(parsed.draft.interviewGuidance) >= 10;
  const hasShortVersion = wordCount(parsed.draft.shortVersion) >= 8;
  const hasFullNarrative = wordCount(parsed.draft.fullNarrative) >= 35;
  const rawScore =
    2 +
    (hasGuidance ? 2 : 0) +
    (hasShortVersion ? 2 : 0) +
    (hasFullNarrative ? 2 : 0) +
    (totalWords >= 90 ? 2 : totalWords >= 50 ? 1 : 0);
  const score = Math.max(1, Math.min(10, rawScore));

  return {
    score,
    rationale:
      score >= 8
        ? "This narrative has a clear theme, usable delivery guidance, and enough detail to bridge into STAR stories."
        : "This narrative needs a sharper throughline, a stronger short version, or more concrete interview delivery guidance."
  };
}

export function mockCareerNarrativeFeedback(
  input: NarrativeFeedbackInput
): NarrativeFeedbackOutput {
  const parsed = NarrativeFeedbackInputSchema.parse(input);
  const theme = readableTheme(parsed.theme);

  return {
    feedback: `Make the ${theme} throughline more explicit, name the proof points you will cite in interviews, and tighten the short version so it can be delivered in under 30 seconds.`
  };
}
