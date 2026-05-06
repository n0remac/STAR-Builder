import { describe, expect, it } from "vitest";

import {
  buildProfileMetaNarrativeInput,
  buildProfileSummaryInput,
  flattenProfileMetaNarrative,
  normalizeProfileLinks,
  parseProfileLinks,
  parseProfileMetaNarrativeJson,
  profileDisplayName,
  profileReferenceHref,
  validateProfileMetaNarrativeReferences
} from "@/lib/profile";

describe("profile utilities", () => {
  it("normalizes and parses profile links", () => {
    const links = " GitHub | https://github.com/example \n\nhttps://example.com ";

    expect(normalizeProfileLinks(links)).toBe(
      "GitHub | https://github.com/example\nhttps://example.com"
    );
    expect(parseProfileLinks(links)).toEqual([
      {
        label: "GitHub",
        url: "https://github.com/example"
      },
      {
        label: "example.com",
        url: "https://example.com"
      }
    ]);
  });

  it("falls back to the user name when profile display name is blank", () => {
    expect(
      profileDisplayName({ displayName: "  ", userName: "Local User" })
    ).toBe("Local User");
    expect(
      profileDisplayName({ displayName: "Cameron", userName: "Local User" })
    ).toBe("Cameron");
  });

  it("builds profile summary input from non-empty narratives", () => {
    const input = buildProfileSummaryInput({
      profile: {
        displayName: " Cameron ",
        headline: " Senior Engineer ",
        location: " San Francisco "
      },
      narratives: [
        {
          scope: "career",
          theme: "impact",
          title: " Impact narrative ",
          positioning: " I improve systems. ",
          fullNarrative: " Full story. ",
          shortVersion: " Short story. "
        },
        {
          scope: "job",
          theme: "leadership",
          title: " ",
          positioning: "",
          fullNarrative: "",
          shortVersion: ""
        }
      ]
    });

    expect(input.profile).toEqual({
      displayName: "Cameron",
      headline: "Senior Engineer",
      location: "San Francisco"
    });
    expect(input.narratives).toHaveLength(1);
    expect(input.narratives[0]?.title).toBe("Impact narrative");
  });

  it("parses, flattens, and routes structured profile meta narrative links", () => {
    const narrative = {
      title: "Career narrative",
      themes: ["impact"],
      paragraphs: [
        {
          segments: [
            { text: "I built ", reference: null },
            {
              text: "reliable systems",
              reference: { type: "answer" as const, id: "answer_1" }
            },
            { text: " across teams.", reference: null }
          ]
        }
      ]
    };

    expect(parseProfileMetaNarrativeJson(JSON.stringify(narrative))).toEqual(
      narrative
    );
    expect(flattenProfileMetaNarrative(narrative)).toBe(
      "I built reliable systems across teams."
    );
    expect(profileReferenceHref({ type: "answer", id: "answer_1" })).toBe(
      "/answers/answer_1"
    );
    expect(profileReferenceHref({ type: "job", id: "job_1" })).toBe(
      "/jobs/job_1"
    );
    expect(profileReferenceHref({ type: "narrative", id: "narrative_1" })).toBe(
      "/narratives/narrative_1"
    );
  });

  it("strips invalid profile meta narrative references and counts valid ones", () => {
    const result = validateProfileMetaNarrativeReferences(
      {
        title: "Career narrative",
        themes: [],
        paragraphs: [
          {
            segments: [
              {
                text: "Valid answer",
                reference: { type: "answer", id: "answer_1" }
              },
              {
                text: "Invalid job",
                reference: { type: "job", id: "missing" }
              }
            ]
          }
        ]
      },
      {
        answerIds: new Set(["answer_1"]),
        jobIds: new Set(["job_1"]),
        narrativeIds: new Set(["narrative_1"])
      }
    );

    expect(result.validReferenceCount).toBe(1);
    expect(result.narrative.paragraphs[0]?.segments[0]?.reference).toEqual({
      type: "answer",
      id: "answer_1"
    });
    expect(result.narrative.paragraphs[0]?.segments[1]).toEqual({
      text: "Invalid job",
      reference: null
    });
  });

  it("builds normalized profile meta narrative input", () => {
    const input = buildProfileMetaNarrativeInput({
      profile: {
        displayName: " Cameron ",
        headline: " Senior Engineer ",
        contactEmail: " cameron@example.com ",
        location: " Remote "
      },
      resumeText: " Resume text ",
      jobs: [
        {
          id: "job_1",
          title: " Engineer ",
          company: " Acme ",
          start: " 2020 ",
          end: " Present ",
          profileSummary: " Summary ",
          starAnswers: [
            {
              id: "answer_1",
              category: "achievement",
              title: " Built thing ",
              situation: " Situation ",
              task: " Task ",
              actions: " Actions ",
              result: " Result ",
              score: 8
            }
          ]
        }
      ],
      narratives: [],
      targetJobs: []
    });

    expect(input.profile.contactEmail).toBe("cameron@example.com");
    expect(input.jobs[0]?.title).toBe("Engineer");
    expect(input.jobs[0]?.starAnswers[0]?.title).toBe("Built thing");
  });
});
