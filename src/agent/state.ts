import { Annotation } from "@langchain/langgraph";

export const StateAnnotation = Annotation.Root({
  interruptResponse: Annotation<string>,
});
