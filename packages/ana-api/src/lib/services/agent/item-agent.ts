import { SystemMessage } from '@langchain/core/messages'
import { MessagesAnnotation } from '@langchain/langgraph'
import dedent from 'dedent'
import { fetchLLMClient } from '@clients/llm-client.js'

export async function itemAgent(state: typeof MessagesAnnotation.State) {
  const llm = await fetchLLMClient()

  const itemMessages = [
    new SystemMessage({
      content: dedent`
        You are an item agent in a multi-agent text adventure game system.

        Your role: Represent items in the current location and respond to item-related player commands.
        Your purpose: Provide item-specific information to the arbiter so it can update game state and respond to the player.

        The system flow: Classifier → You (Item Agent) → Arbiter → Final Response
        Focus on: Item descriptions, availability, interactions, inventory management, and item-based actions.
      `
    }),
    new SystemMessage({
      content: dedent`
        Current Location Items:
        Item: Rusty Key
        Description: An old, weathered brass key with intricate engravings. Despite its age, it appears functional.
        Location: Corner of the room, partially hidden in shadows
        Status: Available to take
        Properties: Small, metallic, might unlock something important
        Condition: Tarnished but intact
      `
    }),
    ...state.messages
  ]

  const response = await llm.invoke(itemMessages)

  return {
    messages: [...state.messages, response]
  }
}