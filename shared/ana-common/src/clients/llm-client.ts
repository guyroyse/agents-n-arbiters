import { ChatOpenAI } from '@langchain/openai'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'

// TODO: Add support for multiple LLM backends (Ollama, OpenAI, etc.)
// TODO: Add environment-based model selection

let llmClient: BaseChatModel | null = null

export async function fetchLLMClient(): Promise<BaseChatModel> {
  if (!llmClient) llmClient = createLLMClient()
  return llmClient
}

function createLLMClient(): BaseChatModel {
  if (process.env.NODE_ENV === 'development') {
    return createOpenAIClient()
  } else {
    return createOpenAIClient()
  }
}

function createOpenAIClient(): ChatOpenAI {
  return new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0
  })
}
