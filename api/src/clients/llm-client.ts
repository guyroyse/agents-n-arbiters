import { ChatOpenAI } from '@langchain/openai'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { config } from '@/config.js'

let llmClient: BaseChatModel | null = null

export async function fetchLLMClient(): Promise<BaseChatModel> {
  if (!llmClient) llmClient = createLLMClient()
  return llmClient
}

function createLLMClient(): BaseChatModel {
  if (!config.openaiApiKey) throw new Error('OPENAI_API_KEY environment variable is required')

  return new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0,
    apiKey: config.openaiApiKey,
    configuration: {
      baseURL: config.openaiBaseUrl
    }
  })
}
