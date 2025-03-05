"use client";

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { useState } from "react";
import { multiply } from "@/tools/multiply";
import { getGitlabMergeRequestChangesTool } from "@/tools/getGitlabMergeRequestChanges";

const model = new ChatOpenAI({
  model: "gpt-4",
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const modelWithMultiplyTool = model.bindTools([multiply]);
const modelWithMergeRequestTool = model.bindTools([
  getGitlabMergeRequestChangesTool,
]);

export default function Home() {
  const [response, setResponse] = useState();
  const [content, setContent] = useState("");
  const [responseWithTool, setResponseWithTool] = useState();

  const handleClickTranslateInvoke = async () => {
    const messages = [
      new SystemMessage("Translate the following from English into Italian"),
      new HumanMessage("Hi! My name is John. I am a software engineer."),
    ];

    const res = await model.invoke(messages);
    setResponse(res);
  };

  const handleClickTranslateStream = async () => {
    const messages = [
      new SystemMessage("Translate the following from English into Italian"),
      new HumanMessage(
        "Hi! My name is John. I am a software engineer. I live in Berlin.",
      ),
    ];

    const stream = await model.stream(messages);

    for await (const chunk of stream) {
      setContent((prevContent) => prevContent + chunk.content);
    }
  };

  const handleClickMultiplyTool = async () => {
    const messages = [new HumanMessage("What is 2 multiplied by 3?")];
    const aiMessage = await modelWithMultiplyTool.invoke(messages);

    messages.push(aiMessage);

    const toolsByName = {
      multiply,
    };

    for (const toolCall of aiMessage.tool_calls) {
      const selectedTool = toolsByName[toolCall.name];
      const toolMessage = await selectedTool.invoke(toolCall);
      messages.push(toolMessage);
    }

    const finalMessage = await model.invoke(messages);
    setResponseWithTool(finalMessage);
  };

  const handleClickMergeRequestTool = async () => {
    const messages = [
      new HumanMessage(
        "Can you describe in 2 lines the merge request 8492 based on it's changes?",
      ),
    ];
    const aiMessage = await modelWithMergeRequestTool.invoke(messages);

    messages.push(aiMessage);

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
        <button onClick={handleClickTranslateInvoke}>Invoke</button>
        <button onClick={handleClickTranslateStream}>Stream</button>
        <button onClick={handleClickMultiplyTool}>Call with tool</button>
        <button onClick={handleClickMergeRequestTool}>
          Call with tool merge request
        </button>
      </div>

      <div className="flex-grow border-2 border-gray-300 w-full overflow-y-auto">
        <pre>{JSON.stringify(response?.content, null, 2)}</pre>
        <pre>{JSON.stringify(responseWithTool, null, 2)}</pre>
        <pre>{content}</pre>
      </div>
    </div>
  );
}
