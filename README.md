# CalmCradle

CalmCradle is a very simple MVP built for the **TECL2500 course at York University**. It explores a way for caregivers to organize infant symptom observations, talk through concerns, and prepare a summary for a doctor visit.

This is a course prototype, not a clinically validated medical tool.

## How it works

- **Timeline:** record symptoms, notes, photos, and videos, then view changes over time.
- **Chat:** ask questions with recent timeline entries, conversation history, and an optional image as context.
- **Community demo:** explore sample posts and add posts or replies locally; this is not a shared, multi-user forum.
- **Report:** export observations as a PDF for a doctor visit.

The app uses React and TypeScript, with Next.js APIs running through vinext and a Cloudflare Worker. Records and uploaded media persist in the browser using IndexedDB; the MVP does not use a server database. Chat context and the selected image are sent to the configured AI provider when live AI is enabled.

## Chat UI and response sources

The chat UI is decoupled from the source of assistant messages. It sends requests to `/api/chat` and renders a common `{ reply: string }` response, without needing to know which provider produced the text.

The server currently tries **OpenAI**, then **Anthropic**, when their API keys are configured. If neither is configured, or both fail, it returns a local sample response from `data/demo-responses.json`. Sample replies follow a fixed sequence for demonstrations rather than answering the actual message.

Another vendor can be added behind the same API contract without changing the chat UI. The current implementation returns complete replies as JSON; it does **not** stream tokens. Token streaming would require a transport change.

## Run locally

Requires Node.js **22.13.0 or newer**.

```bash
npm ci
npm run dev
```

Open the local URL printed in the terminal. No API key is needed for the scripted demo. To enable live AI, copy `.env.example` to `.env.local` and configure one or both provider keys. Keep keys out of Git.

## Demo

Sending a message and receiving a local scripted sample response (no API key required):

https://github.com/user-attachments/assets/8b0a751b-402f-497c-bfe2-bac4513fcad6
