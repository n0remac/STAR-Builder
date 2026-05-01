import { safeStarCategory } from "@/lib/star";

export { safeStarCategory };

export function validateJobId(jobId: string) {
  if (!jobId.trim()) {
    return "Missing job id.";
  }

  return null;
}

export function validateManualJobInput({
  company,
  title
}: {
  company: string;
  title: string;
}) {
  if (!title.trim() || !company.trim()) {
    return "Job title and company are required.";
  }

  return null;
}

export function validateManualStarInput({
  jobId,
  title
}: {
  jobId: string;
  title: string;
}) {
  return validateJobId(jobId) ?? (!title.trim() ? "STAR title is required." : null);
}

export function normalizeAiAnswers(answers: string[]) {
  return answers.map((answer) => answer.trim()).filter(Boolean);
}

export function validateAiAnswers(answers: string[]) {
  return normalizeAiAnswers(answers).length > 0
    ? null
    : "Answer at least one AI question before creating draft STAR answers.";
}
