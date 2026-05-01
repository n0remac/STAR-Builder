-- Preserve existing single-field feedback as Situation guidance, then
-- replace it with section-specific feedback columns.
ALTER TABLE "StarResponse" ADD COLUMN "situationFeedback" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StarResponse" ADD COLUMN "taskFeedback" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StarResponse" ADD COLUMN "actionsFeedback" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StarResponse" ADD COLUMN "resultFeedback" TEXT NOT NULL DEFAULT '';

UPDATE "StarResponse"
SET "situationFeedback" = "feedback"
WHERE "feedback" IS NOT NULL AND "feedback" != '';

ALTER TABLE "StarResponse" DROP COLUMN "feedback";
