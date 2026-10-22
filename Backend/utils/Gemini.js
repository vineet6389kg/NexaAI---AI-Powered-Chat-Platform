import "dotenv/config";

const URL_STREAM =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:streamGenerateContent?alt=sse";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// messages = [{ role, content, image?: { mimeType, data } }]
const toContents = (messages) =>
    messages.map((m) => {
        const parts = [];
        if (m.image?.data) {
            parts.push({ inlineData: { mimeType: m.image.mimeType, data: m.image.data } });
        }
        parts.push({ text: m.content });
        return { role: m.role === "assistant" ? "model" : "user", parts };
    });

// Streams the reply: calls onChunk(text) for every piece, returns the full text
export const streamGeminiResponse = async (messages, onChunk, signal) => {
    const body = JSON.stringify({ contents: toContents(messages) });
    const MAX_TRIES = 3;
    let response;

    for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
        response = await fetch(URL_STREAM, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": process.env.GEMINI_API_KEY,
            },
            body,
            signal,
        });

        if (response.ok) break;

        const data = await response.json().catch(() => ({}));
        console.log(`Gemini error (try ${attempt}/${MAX_TRIES}):`, data?.error?.message);

        // 503 = Google busy, 429 = too many requests -> wait and retry
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