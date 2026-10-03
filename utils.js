export function checkEnvironment() {
  if (!process.env.AI_URL) {
    throw new Error("Missing AI_URL. This tells us which AI provider you're using.");
  }

  if (!process.env.AI_MODEL) {
    throw new Error("Missing AI_MODEL. The AI request needs a model name.");
  }

  if (!process.env.AI_KEY) {
    throw new Error("Missing AI_KEY. Your API key is not being picked up.");
  }

  console.log("AI provider URL:", process.env.AI_URL);
  console.log("AI model:", process.env.AI_MODEL);
}