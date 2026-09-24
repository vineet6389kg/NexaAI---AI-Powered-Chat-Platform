import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'joke on a computer',
    });

    console.log(response.text);
  } catch (error) {
    console.error('Gemini API Error:', error);
  }
}

main();