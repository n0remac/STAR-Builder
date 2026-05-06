import { requireCurrentUser } from "@/lib/current-user";

import { ResumeIngestionForm } from "./resume-ingestion-form";

export default async function ResumePage() {
  await requireCurrentUser();

  return <ResumeIngestionForm />;
}
