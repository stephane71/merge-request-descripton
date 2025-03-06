"use client";

import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  HumanMessage,
  MessageContent,
} from "@langchain/core/messages";
import { useState } from "react";
import { getGitlabMergeRequestChangesTool } from "@/tools/getGitlabMergeRequestChanges";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

const model = new ChatOpenAI({
  model: "gpt-4",
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const modelWithMergeRequestTool = model.bindTools([
  getGitlabMergeRequestChangesTool,
]);

export default function Home() {
  const [responseWithTool, setResponseWithTool] = useState<AIMessage>();
  const [mergeRequestNumber, setMergeRequestNumber] = useState("");

  const handleClickMergeRequestTool = async () => {
    if (!mergeRequestNumber) {
      return;
    }

    const messages = [
      new HumanMessage(
        `Can you describe in 2 lines the merge request ${mergeRequestNumber} based on it's changes?`,
      ),
    ];
    const aiMessage = await modelWithMergeRequestTool.invoke(messages);

    if (!aiMessage.tool_calls) {
      throw new Error("No tool calls found");
    }

    const toolsByName = {
      get_gitlab_merge_request_changes: getGitlabMergeRequestChangesTool,
    };

    for (const toolCall of aiMessage.tool_calls) {
      const selectedTool = toolsByName[toolCall.name];
      const toolMessage = await selectedTool.invoke(toolCall);
      messages.push(toolMessage);
    }

    const finalMessage = await model.invoke(messages);
    setResponseWithTool(finalMessage);
  };

  return (
    <div className="flex flex-col items-center justify-center p-10 h-full">
      <div className="flex gap-4">
        <Button onClick={handleClickMergeRequestTool}>
          Generate merge request description
        </Button>
        <Input
          value={mergeRequestNumber}
          onChange={(e) => setMergeRequestNumber(e.target.value)}
          inputProps={{
            type: "text",
            name: "mergeRequestNumber",
            id: "mergeRequestNumber",
            placeholder: "Merge request number",
          }}
        />
      </div>

      <div className="flex-grow border-2 border-gray-300 w-full overflow-y-auto">
        <pre>{responseWithTool?.content as MessageContent as string}</pre>
      </div>
    </div>
  );
}
