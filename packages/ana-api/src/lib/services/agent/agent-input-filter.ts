import { MessagesAnnotation } from '@langchain/langgraph'
import { BaseMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'

import type { ClassifierOutput } from './classifier.js'
import { log, toPrettyJsonString } from '@utils'
import type { GameEntity } from '@domain/entities.js'

const FilterOutputSchema = z.object({
  reasoning: z.string().describe('One sentence why this specific agent is needed')
})

export type FilterOutput = z.infer<typeof FilterOutputSchema>

export function agentInputFilter(gameId: string, entity: GameEntity, nodeName: string) {
  return async function (state: typeof MessagesAnnotation.State) {
    log(gameId, '🔍 AGENT INPUT FILTER: Input state', state.messages)

    const humanMessages = getHumanMessages(state.messages)
    const reasoningMessage = buildReasoningMessage(state.messages, entity.id, nodeName)

    let outputMessages: BaseMessage[] = [...humanMessages, reasoningMessage]
    log(gameId, '🔍 AGENT INPUT FILTER: Output state', outputMessages)

    return { messages: outputMessages }
  }

  function getHumanMessages(message: BaseMessage[]): BaseMessage[] {
    return message.filter(message => message.getType() === 'human')
  }

  function buildReasoningMessage(messages: BaseMessage[], entityId: string, nodeName: string): SystemMessage {
    const output = buildReasoningOutput(messages, entityId)
    return new SystemMessage({
      content: toPrettyJsonString(output),
      name: nodeName
    })
  }

  function buildReasoningOutput(messages: BaseMessage[], entityId: string): FilterOutput {
    const reasoning = getFilterReasoning(messages, entityId)
    return { reasoning }
  }

  function getFilterReasoning(messages: BaseMessage[], entityId: string): string {
    const classifierMessage = messages.find(message => {
      return message.getType() === 'system' && message.name === 'classifier'
    })!

    const classifierOutput = JSON.parse(classifierMessage.content as string) as ClassifierOutput
    return classifierOutput.selected_agents.find(agent => agent.agent_id === entityId)!.reasoning
  }
}
