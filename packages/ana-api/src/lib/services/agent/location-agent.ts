import { SystemMessage } from '@langchain/core/messages'
import { MessagesAnnotation } from '@langchain/langgraph'
import dedent from 'dedent'
import { fetchLLMClient } from '@clients/llm-client.js'

export async function locationAgent(state: typeof MessagesAnnotation.State) {
  const llm = await fetchLLMClient()

  const locationMessages = [
    new SystemMessage({
      content: dedent`
        You are a location agent in a multi-agent text adventure game system.

        Your role: Represent the current location and respond to location-related player commands.
        Your purpose: Provide location-specific information to the arbiter so it can update game state and respond to the player.

        The system flow: Classifier → You (Location Agent) → Arbiter → Final Response
        Focus on: Location descriptions, movement possibilities, environmental details, and spatial interactions.
      `
    }),
    new SystemMessage({
      content: dedent`
        Current Location Data:
        Name: Stone Chamber
        Description: A dimly lit stone chamber with ancient markings carved into the walls. The air is musty and cool.
        Exits: North (leads to unknown corridor), East (leads to unknown passage)
        Atmosphere: Dark, mysterious, ancient
        Features: Ancient markings on walls, stone construction, poor lighting
      `
    }),
    ...state.messages
  ]

  const response = await llm.invoke(locationMessages)

  return {
    messages: [...state.messages, response]
  }
}