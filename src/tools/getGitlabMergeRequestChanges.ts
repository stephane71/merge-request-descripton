import { tool } from "@langchain/core/tools";
import { z } from "zod";

const getGitlabMergeRequestChanges = async ({
  mergeRequestId,
}: {
  mergeRequestId: number;
}) => {
  const response = await fetch(
    `https://gitlab.com/api/v4/projects/${process.env.NEXT_PUBLIC_GITLAB_PROJECT_ID}/merge_requests/${mergeRequestId}/raw_diffs`,
    {
      method: "GET",
      headers: {
        "PRIVATE-TOKEN": process.env.NEXT_PUBLIC_GITLAB_API_KEY || "",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }

  return response.text();
};

export const getGitlabMergeRequestChangesTool = tool(
  getGitlabMergeRequestChanges,
  {
    name: "get_gitlab_merge_request_changes",
    description: "Get the changes of a GitLab merge request",
    schema: z.object({
      mergeRequestId: z.number(),
    }),
  },
);
