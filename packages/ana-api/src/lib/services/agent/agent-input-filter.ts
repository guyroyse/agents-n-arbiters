import { MessagesAnnotation } from '@langchain/langgraph'
import { BaseMessage, SystemMessage } from '@langchain/core/messages'
import type { ClassifierOutput } from './classifier.js'
import { logMessages } from '@utils'

export function agentInputFilter(entityId: string, nodeName: string) {
  return async function (state: typeof MessagesAnnotation.State) {
    logMessages('🔍 AGENT INPUT FILTER: Input state', state.messages)

    const humanMessages = getHumanMessages(state.messages)
    const reasoningMessage = buildClassifierReasoningMessage(state.messages, entityId, nodeName)

    let outputMessages: BaseMessage[] = [...humanMessages, reasoningMessage]

    logMessages('🔍 AGENT INPUT FILTER: Output state', outputMessages)

    return { messages: outputMessages }
  }

  function getHumanMessages(message: BaseMessage[]): BaseMessage[] {
    return message.filter(message => message.getType() === 'human')
  }

  function buildClassifierReasoningMessage(messages: BaseMessage[], entityId: string, nodeName: string): SystemMessage {
    const reasoning = getClassifierReasoning(messages, entityId)
    return createReasoningMessage(reasoning, nodeName)
  }

  function getClassifierReasoning(messages: BaseMessage[], entityId: string): string {
    const classifierMessage = messages.find(message => {
      return message.getType() === 'system' && message.name === 'classifier'
    })!

    const classifierOutput = JSON.parse(classifierMessage.content as string) as ClassifierOutput
    return classifierOutput.selected_agents.find(agent => agent.agent_id === entityId)!.reasoning
  }

  function createReasoningMessage(reasoning: string, nodeName: string): SystemMessage {
    return new SystemMessage({
      content: `Classifier reasoning for why you were selected: ${reasoning}`,
      name: nodeName
    })
  }
}
