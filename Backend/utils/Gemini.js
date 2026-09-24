import 'dotenv/config';

const getGeminiResponse = async (message) => {

    const option = {

        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: message
                }]
            }]
        })

    };

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
            option
        );

        const data = await response.json();

        return data.candidates[0].content.parts[0].text;

    } catch (err) {
        console.log(err);
    }
};

export default getGeminiResponse;