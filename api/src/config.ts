export const config = {
  // OpenAI/LiteLLM configuration
  // - Local dev: LiteLLM proxy with OPENAI_BASE_URL pointing to http://localhost:4000
  // - Azure deployment: LiteLLM Container App with OPENAI_BASE_URL pointing to LiteLLM service
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiBaseUrl: process.env.OPENAI_BASE_URL,
  openaiModel: 'gpt-4o-mini',
  openaiTemperature: 0.7,

  // Agent Memory Server configuration
  amsBaseUrl: process.env.AMS_BASE_URL ?? 'http://localhost:8000',
  amsContextWindowMax: process.env.AMS_CONTEXT_WINDOW_MAX ? parseInt(process.env.AMS_CONTEXT_WINDOW_MAX) : 4000,

  // Redis configuration
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379'
}
