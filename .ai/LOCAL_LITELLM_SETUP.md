# Local LiteLLM Setup Guide

## What Changed

Your local development environment now uses **LiteLLM** as a proxy between your application and OpenAI. This mirrors the Azure production architecture where LiteLLM proxies Azure OpenAI.

## Architecture

```
┌─────────────────┐
│  Azure Functions│
│   (port 7071)   │
└────────┬────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌─────────────────┐              ┌─────────────────┐
│    LiteLLM      │              │      AMS        │
│  (port 4000)    │◄─────────────│  (port 8000)    │
└────────┬────────┘              └────────┬────────┘
         │                                │
         ▼                                ▼
┌─────────────────┐              ┌─────────────────┐
│  OpenAI API     │              │     Redis       │
│                 │              │  (port 6379)    │
└─────────────────┘              └─────────────────┘
```

## Configuration Files

### 1. `litellm.config.yaml` (NEW)
Defines which models LiteLLM should proxy:
- `gpt-4o` - Complex reasoning
- `gpt-4o-mini` - Fast, cheap operations
- `text-embedding-3-small` - Embeddings for AMS

### 2. `docker-compose.yml` (UPDATED)
Added LiteLLM service:
- Runs on port 4000
- Uses master key `sk-1234` for local auth
- AMS now points to LiteLLM instead of OpenAI directly

### 3. `api/local.settings.json` (UPDATED)
Azure Functions now configured to use LiteLLM:
- `OPENAI_API_KEY`: `sk-1234` (LiteLLM master key)
- `OPENAI_BASE_URL`: `http://localhost:4000` (LiteLLM endpoint)
- `OPENAI_MODEL`: `gpt-4o-mini` (default model)

### 4. `api/src/clients/llm-client.ts` (UPDATED)
LLM client now reads configuration from environment variables:
- Supports custom base URL (for LiteLLM)
- Supports custom model selection
- Validates API key is present

## Setup Instructions

### 1. Update Your `.env` File
```bash
cp .env.example .env
# Edit .env and add your real OpenAI API key
```

Your `.env` should contain:
```
OPENAI_API_KEY=sk-proj-your-actual-openai-key-here
AUTH_MODE=disabled
LOG_LEVEL=DEBUG
```

### 2. Start Docker Services
```bash
docker compose up
```

This will start:
- **Redis** on port 6379
- **LiteLLM** on port 4000 (proxying to OpenAI)
- **AMS** on port 8000 (using LiteLLM)

### 3. Start Development Servers
```bash
npm run dev
```

This will start:
- **API** on port 7071 (using LiteLLM)
- **Web** on port 4280
- **Admin** on port 4281

## Testing LiteLLM

### Test LiteLLM Directly
```bash
curl http://localhost:4000/v1/models \
  -H "Authorization: Bearer sk-1234"
```

You should see a list of available models.

### Test Chat Completion
```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-1234" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Say hello!"}]
  }'
```

### Check LiteLLM Logs
```bash
docker logs ana-litellm
```

You should see requests flowing through LiteLLM.

## Troubleshooting

### LiteLLM Can't Start
- **Check**: Is your `OPENAI_API_KEY` set in `.env`?
- **Check**: Is port 4000 already in use?

### AMS Can't Connect to LiteLLM
- **Check**: Is LiteLLM running? (`docker ps`)
- **Check**: AMS logs: `docker logs ana-ams`

### Functions Can't Connect to LiteLLM
- **Check**: Is `OPENAI_BASE_URL` set to `http://localhost:4000` in `api/local.settings.json`?
- **Check**: Is `OPENAI_API_KEY` set to `sk-1234` (the LiteLLM master key)?

### Invalid API Key Errors
- **Local Development**: Use `sk-1234` (LiteLLM master key) in `api/local.settings.json`
- **Docker Services**: Use your real OpenAI key in `.env`

## Why This Architecture?

1. **Azure Parity**: Production uses LiteLLM to proxy Azure OpenAI. Local dev now matches.
2. **Flexibility**: Easy to swap OpenAI for Azure OpenAI or other providers.
3. **Monitoring**: LiteLLM provides unified logging and metrics.
4. **Cost Control**: LiteLLM can implement rate limiting and budgets.

## Next Steps

Once local development works with LiteLLM:
1. Build Azure Bicep infrastructure
2. Deploy to Azure with `azd up`
3. LiteLLM will proxy Azure OpenAI instead of OpenAI

