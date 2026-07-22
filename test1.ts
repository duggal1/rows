import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const prompt =
  "Explain the general theory of relativity clearly in 300 words maximum.";

const start = performance.now();

const response = await ai.models.generateContent({
  model: "gemini-3.6-flash",
  contents: prompt,
});

const elapsed = performance.now() - start;

console.log("\n--- RESPONSE ---\n");
console.log(response.text);

console.log("\n--- PERFORMANCE ---\n");
console.log(`SDK: ${(elapsed / 1000).toFixed(3)} seconds`);