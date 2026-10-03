import OpenAI from "openai"
import { checkEnvironment } from "./utils.js"

const openai = new OpenAI({
  apiKey: process.env.AI_KEY,
  baseURL: process.env.AI_URL,
  dangerouslyAllowBrowser: true
})

checkEnvironment();

const userPrompt = "Suggest some gifts for someone who loves hiphop music"

const userMessage = {
  role: "user",
  content: userPrompt
}

const response = await openai.chat.completions.create({
  model: process.env.AI_MODEL,
  messages: [ userMessage ],
  stream: false
})

/**
 * Challenge: Extract the AI's Reply
 *
 * Right now, we’re logging the entire response object,
 * which is far more information than we actually need.
 *
 * Your task:
 *
 * 1. Access the first item in the `choices` array
 * 2. Extract the assistant’s message
 * 3. Log only the AI-generated text to the console
 *
 * The console output should show just the response content —
 * nothing else.
 */

if (response.choices && response.choices.length > 0) {
  console.log(response.choices[0].message.content)
} else {
  console.log("No response text could be generated.")
}