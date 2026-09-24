import express from 'express';
import 'dotenv/config';
import cors from 'cors';

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors());

app.listen(PORT, () => {
    console.log(`server is running ${PORT}`)
});

app.post("/test", async (req, res) => {

    const option = {

        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: req.body.message
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

        console.log(console.log(data.candidates[0].content.parts[0].text));

        res.status(response.status).json(data);

    } catch (err) {
        console.log(err);
    }

});