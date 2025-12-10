import { ChatOpenAI } from '@langchain/openai'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'

let llmClient: BaseChatModel | null = null

export async function fetchLLMClient(): Promise<BaseChatModel> {
  if (!llmClient) llmClient = createLLMClient()
  return llmClient
}

function createLLMClient(): BaseChatModel {
  const apiKey = process.env.OPENAI_API_KEY
  const baseURL = process.env.OPENAI_BASE_URL

  if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is required')

  return new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0,
    apiKey,
    configuration: {
      baseURL
    }
  })
}
