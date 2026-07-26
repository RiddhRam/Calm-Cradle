import demoResponses from "@/data/demo-responses.json";

type IncomingMessage = { role: "user" | "assistant"; content: string };
type TimelineContext = { category: string; title: string; note: string; observedAt: string };

type ChatPayload = {
  message?: string;
  image?: string;
  scriptStep?: number;
  history?: IncomingMessage[];
  timeline?: TimelineContext[];
};

const systemPrompt = `You are the support assistant inside CalmCradle, a calm educational tool for parents of infants.

Your role is to help a caregiver organize observations, understand what details matter, and prepare questions for a qualified healthcare professional. You may describe visible characteristics in an attached image, but never claim to diagnose a rash, infection, injury, or other condition from text or an image.

Keep responses warm, concise, and specific to the supplied infant timeline. Clearly distinguish recorded facts from inference. Do not give medication dosing. If the caregiver mentions trouble breathing, blue lips, a seizure, an infant who is difficult to wake or unusually floppy, or immediate danger, tell them to call emergency services now. Otherwise, recommend using the app's structured urgency check for care-level guidance. End with concrete warning signs to watch for when relevant.`;

function timelineText(timeline: TimelineContext[] = []) {
  if (!timeline.length) return "No timeline entries have been recorded.";
  return timeline
    .map((entry) => `${entry.observedAt}: ${entry.category} — ${entry.title}. ${entry.note}`)
    .join("\n");
}

function splitDataUrl(value: string) {
  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  return match ? { mediaType: match[1], data: match[2] } : null;
}

async function askOpenAI(payload: ChatPayload, apiKey: string) {
  const image = payload.image ? splitDataUrl(payload.image) : null;
  const content: Array<Record<string, string>> = [
    {
      type: "input_text",
      text: `Infant timeline:\n${timelineText(payload.timeline)}\n\nCaregiver message:\n${payload.message}`,
    },
  ];
  if (image) content.push({ type: "input_image", image_url: payload.image as string, detail: "auto" });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions: systemPrompt,
      input: [
        ...(payload.history || []).slice(-8).map((message) => ({
          role: message.role,
          content: [{ type: "input_text", text: message.content }],
        })),
        { role: "user", content },
      ],
      max_output_tokens: 500,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
  const result = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  const reply =
    result.output_text ||
    result.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
  if (!reply) throw new Error("OpenAI returned no text");
  return reply;
}

async function askAnthropic(payload: ChatPayload, apiKey: string) {
  const image = payload.image ? splitDataUrl(payload.image) : null;
  const latestContent: Array<Record<string, unknown>> = [];
  if (image) {
    latestContent.push({
      type: "image",
      source: { type: "base64", media_type: image.mediaType, data: image.data },
    });
  }
  latestContent.push({
    type: "text",
    text: `Infant timeline:\n${timelineText(payload.timeline)}\n\nCaregiver message:\n${payload.message}`,
  });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        ...(payload.history || []).slice(-8).map((message) => ({
          role: message.role,
          content: message.content,
        })),
        { role: "user", content: latestContent },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Anthropic request failed: ${response.status}`);
  const result = (await response.json()) as { content?: Array<{ type?: string; text?: string }> };
  const reply = result.content?.find((item) => item.type === "text")?.text;
  if (!reply) throw new Error("Anthropic returned no text");
  return reply;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as ChatPayload;
  if (!payload.message?.trim()) {
    return Response.json({ error: "A message is required." }, { status: 400 });
  }

  const providers = [
    process.env.OPENAI_API_KEY
      ? () => askOpenAI(payload, process.env.OPENAI_API_KEY as string)
      : null,
    process.env.ANTHROPIC_API_KEY
      ? () => askAnthropic(payload, process.env.ANTHROPIC_API_KEY as string)
      : null,
  ].filter((provider): provider is () => Promise<string> => provider !== null);

  for (const provider of providers) {
    try {
      return Response.json({ reply: await provider() });
    } catch (error) {
      console.error("Assistant provider failed; trying the next available path.", error);
    }
  }

  const step = Math.abs(payload.scriptStep || 0) % demoResponses.length;
  return Response.json({ reply: demoResponses[step].response });
}
