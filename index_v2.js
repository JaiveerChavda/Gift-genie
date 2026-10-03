import OpenAI from "openai"
import { checkEnvironment } from "./utils.js"

/**
 * Challenge: Follow-Up Gift-Genie Conversation
 *
 * The model has no memory!
 * We simulate a conversation history by rebuilding
 * state manually.
 *
 * 1. Store the AI model's first response in the messages array
 * 2. Add a second user message asking for the suggestions to be 
      more budget friendly and under $40.
 * 3. Send a chat completions request with the messages array again
 * 4. Log the final response's content
 *
 * 💡 Check the hints folder for more guidance!
 */

const openai = new OpenAI({
  baseURL: process.env.AI_URL,
  apiKey: process.env.AI_KEY,
  stream: false
});

checkEnvironment();

const messages = [{
  role: 'user',
  content: `Suggest some gifts for someone who loves sneakers.Make you're suggestion thoughtful and practical. keep you're response within 100 words. skip intros and conclusions`
}];

const response = await openai.chat.completions.create({
  model: process.env.AI_MODEL,
  messages: messages,
  stream: false,
  max_completion_tokens: 1000
});

// storing the first ai model's response
if (response.choices && response.choices.length > 0) {
  const firstAiResponse = {
    role: 'assistant',
    content: response.choices[0].message.content
  };

  messages.push(firstAiResponse);
  console.log('first ai response ');
  console.log(firstAiResponse.content);
} else {
  console.log("No response text could be generated.");
}

// second user message
const secondUserPrompt = "can you please be more budget friendly , under $4000";

messages.push({
  role: 'user',
  content: secondUserPrompt
});

// calling the chat completions api
const responsev2 = await openai.chat.completions.create({
  model: process.env.AI_MODEL,
  messages: messages,
  stream: false
});

// log the final ai model's response
if(responsev2.choices && responsev2.choices.length > 0){
  console.log("final ai response");
  console.log(responsev2.choices[0].message.content);
}