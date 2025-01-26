import { interrupt, START, StateGraph } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "./state.js";
import {
  ActionRequest,
  HumanInterruptConfig,
  HumanInterrupt,
  HumanResponse,
} from "@langchain/langgraph/prebuilt";

/**
 * Call the interrupt function to pause the graph and handle user interaction.
 * Once resumed, it will log the type of action which was returned from
 * the interrupt function.
 */
async function humanNode(
  _state: typeof StateAnnotation.State,
  _config: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.Update>> {
  // Define the interrupt request
  const actionRequest: ActionRequest = {
    action: "Confirm Joke",
    args: { joke: "What did the engineer say to the manager?" },
  };

  const interruptConfig: HumanInterruptConfig = {
    allow_ignore: true, // Allow the user to `ignore` the interrupt
    allow_respond: true, // Allow the user to `respond` to the interrupt
    allow_edit: true, // Allow the user to `edit` the interrupt's args
    allow_accept: true, // Allow the user to `accept` the interrupt's args
  };

  // The description will be rendered as markdown in the UI
  const description = [
    "# Confirm Joke",
    "Please carefully examine the joke, and decide if you want to accept, edit, or ignore the joke.",
    "If you accept, the joke will be added to the conversation.",
    "If you edit and submit, the edited joke will be added to the conversation.",
    "If you ignore, the conversation will continue without adding the joke.",
    "If you respond, the response will be used to generate a new joke.",
  ].join("\n");

  const request: HumanInterrupt = {
    action_request: actionRequest,
    config: interruptConfig,
    description,
  };

  const humanResponse = interrupt<HumanInterrupt[], HumanResponse[]>([
    request,
  ])[0];

  if (humanResponse.type === "response") {
    const message = `User responded with: ${humanResponse.args}`;
    return { interruptResponse: message };
  } else if (humanResponse.type === "accept") {
    const message = `User accepted with: ${JSON.stringify(humanResponse.args)}`;
    return { interruptResponse: message };
  } else if (humanResponse.type === "edit") {
    const message = `User edited with: ${JSON.stringify(humanResponse.args)}`;
    return { interruptResponse: message };
  } else if (humanResponse.type === "ignore") {
    const message = "User ignored interrupt.";
    return { interruptResponse: message };
  }

  return {
    interruptResponse:
      "Unknown interrupt response type: " + JSON.stringify(humanResponse),
  };
}

// Define a new graph
const workflow = new StateGraph(StateAnnotation)
  .addNode("humanNode", humanNode)
  .addEdge(START, "humanNode");

// Compile the workflow into an executable graph
export const graph = workflow.compile();

// This defines the custom name in LangSmith
graph.name = "Agent Inbox Example";
