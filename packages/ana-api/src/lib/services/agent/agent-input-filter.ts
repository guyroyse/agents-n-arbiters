import { MessagesAnnotation } from '@langchain/langgraph'

// Generic filter factory for agent input processing
export function agentInputFilter(_targetAgent: string) {
  return async function (state: typeof MessagesAnnotation.State) {
    // Filter to only include human messages (player commands)
    const humanMessages = state.messages.filter(msg => msg._getType() === 'human')
    
    // TODO: Could add agent-specific context here if needed
    // For example, injecting agent-specific system messages or reasoning
    
    return {
      messages: humanMessages
    }
  }
}