const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 4000;

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

function getAllowedOrigin(request, env) {
  const requestOrigin = request.headers.get("Origin");
  const allowedOrigin = env.ALLOWED_ORIGIN;

  if (!allowedOrigin) {
    return requestOrigin || "*";
  }

  return requestOrigin === allowedOrigin ? allowedOrigin : null;
}

function toGeminiConversation(messages) {
  return messages
    .filter((message) => ["user", "assistant"].includes(message?.role))
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: String(message.content).slice(0, MAX_MESSAGE_CHARS) }],
    }));
}

export default {
  async fetch(request, env) {
    const origin = getAllowedOrigin(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: origin ? 204 : 403,
        headers: origin ? corsHeaders(origin) : {},
      });
    }

    if (!origin) {
      return json({ error: "Origin is not allowed." }, 403, "null");
    }

    if (request.method !== "POST") {
      return json({ error: "Use POST." }, 405, origin);
    }

    if (!env.GEMINI_API_KEY) {
      return json({ error: "GEMINI_API_KEY is not configured." }, 500, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Request body must be valid JSON." }, 400, origin);
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const latestUserMessage = messages
      .filter((message) => message?.role === "user")
      .at(-1);

    if (!latestUserMessage?.content || typeof latestUserMessage.content !== "string") {
      return json({ error: "Missing user message." }, 400, origin);
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: toGeminiConversation(messages),
          systemInstruction: {
            parts: [
              {
                text:
                  "You are a helpful assistant embedded in Foundations, a personal Quartz site for exploring the Bible and related notes. Be concise, kind, and clear.",
              },
            ],
          },
        }),
      },
    );

    const geminiBody = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return json(
        {
          error: "Gemini request failed.",
          details: geminiBody.error?.message || "Unknown error",
        },
        geminiResponse.status,
        origin,
      );
    }

    const reply =
      geminiBody.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim() || "I could not generate a response.";

    return json({ reply }, 200, origin);
  },
};
