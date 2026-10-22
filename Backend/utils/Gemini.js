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

export default getGeminiResponse;