import "dotenv/config";

const getGeminiResponse = async (message) => {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: message,
                        },
                    ],
                },
            ],
        }),
    };

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
            options
        );

        const data = await response.json();

        if (!response.ok) {
            console.log("Gemini API Error:", data);

            throw new Error(
                data?.error?.message || "Gemini API request failed"
            );
        }

        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            console.log("Unexpected Gemini response:", data);
            throw new Error("Gemini returned an empty response");
        }

        return reply;

    } catch (err) {
        console.log("Gemini Error:", err.message);
        throw err;
    }
};

export default getGeminiResponse;