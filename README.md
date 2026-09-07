# AI HUB Pro Knowledge Backend V2.1 Free

Free-provider deployment build for the AI HUB Pro Knowledge Engine.

## Architecture

ASK → SEARCH → UNDERSTAND → VERIFY → SYNTHESIZE → TEACH → DO

### Free search
- Tavily Search API: 1,000 free API credits/month, no credit card required.
- `TAVILY_API_KEY` is required for real web/official-docs/image/audio search.

### Free AI synthesis
- OpenRouter Free Models Router: `openrouter/free`.
- Groq Free Plan fallback: `openai/gpt-oss-20b`.
- Set `AI_PROVIDER=auto` to use OpenRouter first and Groq second.

### Existing real connectors retained
- YouTube Data API v3
- GitHub REST API
- HTTP source verification with SSRF protection

## Render environment variables

Required for the full real E2E gate:
- `OPENROUTER_API_KEY`
- `TAVILY_API_KEY`
- `YOUTUBE_API_KEY`

Optional:
- `GROQ_API_KEY`
- `GITHUB_TOKEN`

Recommended:
- `AI_PROVIDER=auto`
- `OPENROUTER_MODEL=openrouter/free`
- `GROQ_MODEL=openai/gpt-oss-20b`
- `TAVILY_SEARCH_DEPTH=basic`
- `KNOWLEDGE_CACHE_SECONDS=0` during E2E testing

## Health

`GET /health`

## Knowledge API

`POST /api/knowledge/query`

Example body:

```json
{
  "question": "Explain the official Python tutorial and show a useful Python example.",
  "language": "en",
  "mode": "text",
  "sources": ["web", "official_docs", "youtube", "github"]
}
```

## Tests

`npm test` runs 11 deterministic unit/integration tests.

`npm run e2e:local` runs the real-provider gate against the configured endpoint. It only passes when web, official docs, YouTube, GitHub, verification, AI synthesis and citation binding all succeed.

## Important

This build does not depend on OpenAI API credits for its default path. OpenAI is intentionally not used by the default free architecture.
