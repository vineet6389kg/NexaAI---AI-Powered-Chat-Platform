import "dotenv/config";

const MODEL_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// "messages" = [{ role: "user" | "assistant", content: "..." }, ...]
const getGeminiResponse = async (messages) => {
    const contents = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
    }));

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({ contents }),
    };

    const MAX_TRIES = 3;

    for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
        const response = await fetch(MODEL_URL, options);
        const data = await response.json();

        if (response.ok) {
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!reply) throw new Error("Gemini returned an empty response");
            return reply;
        }

        console.log(`Gemini error (try ${attempt}/${MAX_TRIES}):`, data?.error?.message);

        // 503 = Google is busy, 429 = too many requests -> wait and try again
        const busy = response.status === 503 || response.status === 429;
        if (busy && attempt < MAX_TRIES) {
            await sleep(attempt * 1500); // wait 1.5s, then 3s
            continue;
        }

        const err = new Error(data?.error?.message || "Gemini API request failed");
        err.status = response.status;
        throw err;
    }
};

// Streams the reply piece by piece.
// Calls onChunk(text) for every piece and returns the full text at the end.
export const streamGeminiResponse = async (messages, onChunk, signal) => {
    const contents = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
    }));

    const STREAM_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:streamGenerateContent?alt=sse";

    let response;
    for (let attempt = 1; attempt <= 3; attempt++) {
        response = await fetch(STREAM_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": process.env.GEMINI_API_KEY,
            },
            body: JSON.stringify({ contents }),
            signal,
        });

        if (response.ok) break;

        const data = await response.json().catch(() => ({}));
        console.log(`Gemini stream error (try ${attempt}/3):`, data?.error?.message);

        const busy = response.status === 503 || response.status === 429;
        if (busy && attempt < 3) {
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