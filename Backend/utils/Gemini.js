import "dotenv/config";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const toContents = (messages) =>
    messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
    }));

const headers = () => ({
    "Content-Type": "application/json",
    "x-goog-api-key": process.env.GEMINI_API_KEY,
});

// Normal (non-streaming) reply, with retry when Google is busy
const getGeminiResponse = async (messages) => {
    const body = JSON.stringify({ contents: toContents(messages) });
    const MAX_TRIES = 3;

    for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
        const response = await fetch(`${BASE}:generateContent`, {
            method: "POST",
            headers: headers(),
            body,
        });
        const data = await response.json();

        if (response.ok) {
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!reply) throw new Error("Gemini returned an empty response");
            return reply;
        }

        console.log(`Gemini error (try ${attempt}/${MAX_TRIES}):`, data?.error?.message);

        const busy = response.status === 503 || response.status === 429;
        if (busy && attempt < MAX_TRIES) {
            await sleep(attempt * 1500);
            continue;
        }

        const err = new Error(data?.error?.message || "Gemini API request failed");
        err.status = response.status;
        throw err;
    }
};

// Streaming reply: calls onChunk(text) for every piece, returns the full text
export const streamGeminiResponse = async (messages, onChunk, signal) => {
    const body = JSON.stringify({ contents: toContents(messages) });
    const MAX_TRIES = 3;
    let response;

    for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
        response = await fetch(`${BASE}:streamGenerateContent?alt=sse`, {
            method: "POST",
            headers: headers(),
            body,
            signal,
        });

        if (response.ok) break;

        const data = await response.json().catch(() => ({}));
        console.log(`Gemini stream error (try ${attempt}/${MAX_TRIES}):`, data?.error?.message);

        const busy = response.status === 503 || response.status === 429;
        if (busy && attempt < MAX_TRIES) {
            await sleep(attempt * 1500);
            continue;
        }

        const err = new Error(data?.error?.message || "Gemini API request failed");
        err.status = response.status;
        throw err;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";

    const handleLine = (line) => {
        if (!line.startsWith("data:")) return;
        const json = line.slice(5).trim();
        if (!json) return;
        try {
            const data = JSON.parse(json);
            const text = (data?.candidates?.[0]?.content?.parts || [])
                .map((p) => p.text || "")
                .join("");
            if (text) {
                full += text;
                onChunk(text);
            }
        } catch {
            // ignore incomplete lines
        }
    };

    for await (const chunk of response.body) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep the unfinished last line
        lines.forEach(handleLine);
    }
    handleLine(buffer);

    return full;
};

export default getGeminiResponse;