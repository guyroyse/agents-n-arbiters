import { StateGraph, MessagesAnnotation, START, END } from '@langchain/langgraph'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { fetchLLMClient } from './llm-client.js'

// Simple function to process a command
export async function processCommand(command: string): Promise<string> {
  const graph = buildGraph()

  const initialState = {
    messages: [new HumanMessage({ content: command })]
  }

  const result = await graph.invoke(initialState)

  const lastMessage = result.messages[result.messages.length - 1]
  return lastMessage.content as string
}

// Simple classifier function using LLM
async function classifier(state: typeof MessagesAnnotation.State) {
  const llm = await fetchLLMClient()

  // Add a system message for the classifier
  const classifierMessages = [
    new SystemMessage({
      content:
        'You are a text adventure game classifier. Analyze the player command and respond with a brief classification and explanation.'
    }),
    ...state.messages
  ]

  // Call the LLM
  const response = await llm.invoke(classifierMessages)

  return {
    messages: [...state.messages, response]
  }
}

function buildGraph() {
  return new StateGraph(MessagesAnnotation)
    .addNode('classifier', classifier)
    .addEdge(START, 'classifier')
    .addEdge('classifier', END)
    .compile()
}
