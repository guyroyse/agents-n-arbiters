import { MessagesAnnotation } from '@langchain/langgraph'
import { BaseMessage, SystemMessage } from '@langchain/core/messages'
import type { ClassifierOutput } from './classifier.js'
import { log } from '@utils'
import type { GameEntity } from '@domain/entities.js'

export function agentInputFilter(gameId: string, entity: GameEntity, nodeName: string) {
  return async function (state: typeof MessagesAnnotation.State) {
    log(gameId, '🔍 AGENT INPUT FILTER: Input state', state.messages)

    const humanMessages = getHumanMessages(state.messages)
    const reasoningMessage = buildClassifierReasoningMessage(state.messages, entity.id, nodeName)

    let outputMessages: BaseMessage[] = [...humanMessages, reasoningMessage]

    log(gameId, '🔍 AGENT INPUT FILTER: Output state', outputMessages)

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
