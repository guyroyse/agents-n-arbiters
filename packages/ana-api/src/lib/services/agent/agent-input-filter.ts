import { MessagesAnnotation } from '@langchain/langgraph'
import { SystemMessage } from '@langchain/core/messages'
import type { ClassifierOutput } from './classifier.js'

export function agentInputFilter(entityId: string, nodeName: string) {
  return async function (state: typeof MessagesAnnotation.State) {
    const humanMessages = getHumanMessages(state)
    const reasoning = getClassifierReasoning(state, entityId)

    if (reasoning) {
      const reasoningMessage = createReasoningMessage(reasoning, nodeName)
      return { messages: [...humanMessages, reasoningMessage] }
    }

    return { messages: humanMessages }
  }

  function getHumanMessages(state: typeof MessagesAnnotation.State) {
    return state.messages.filter(message => message.getType() === 'human')
  }

  function getClassifierReasoning(state: typeof MessagesAnnotation.State, entityId: string): string | null {
    const classifierMessage = findClassifierMessage(state)
    if (!classifierMessage) return null

    const classifierOutput = parseClassifierOutput(classifierMessage)
    if (!classifierOutput) return null

    return findReasoningForEntity(classifierOutput, entityId)
  }

  function findClassifierMessage(state: typeof MessagesAnnotation.State) {
    return state.messages.find(message => message.getType() === 'system' && message.name === 'classifier')
  }

  function parseClassifierOutput(classifierMessage: any): ClassifierOutput | null {
    try {
      return JSON.parse(classifierMessage.content as string)
    } catch (error) {
      return null
    }
  }

  function findReasoningForEntity(classifierOutput: ClassifierOutput, entityId: string): string | null {
    const reasoning = classifierOutput.selected_agents.find(agent => agent.agent_id === entityId)?.reasoning
    return reasoning ?? null
  }

  function createReasoningMessage(reasoning: string, nodeName: string) {
    return new SystemMessage({
      content: `Classifier reasoning for why you were selected: ${reasoning}`,
      name: nodeName
    })
  }
}
