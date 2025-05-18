import {GoogleGenAI} from '@google/genai';


const ai = new GoogleGenAI({apiKey: "AIzaSyBjS9ZsEPNwSXGZCJjLLj1fy5cV6GcZFuE"});

export async function* getResponse(context: string,content: string) {
  const response = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash-001',
    contents: [
      { role: 'user', parts: [{ text: context }] },
      { role: 'user', parts: [{ text: content }] }
    ],
  });

  for await (const chunk of response) {
    yield chunk.text; // stream it one piece at a time
  }
}