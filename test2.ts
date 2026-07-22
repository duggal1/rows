const API_KEY = process.env.GEMINI_API_KEY!;
const MODEL = "gemini-3.6-flash";

const prompt =
  "Explain the general theory of relativity clearly in 300 words maximum.";

const start = performance.now();

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
  {
    method: "POST",
    headers: {
      "x-goog-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  },
);

if (!response.ok) {
  throw new Error(
    `Gemini API error ${response.status}: ${await response.text()}`,
  );
}

const data = await response.json();

const elapsed = performance.now() - start;

console.log("\n--- RESPONSE ---\n");
console.log(data.candidates?.[0]?.content?.parts?.[0]?.text);

console.log("\n--- PERFORMANCE ---\n");
console.log(`Raw fetch: ${(elapsed / 1000).toFixed(3)} seconds`);

export { };
