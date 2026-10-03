import OpenAI from "openai";
import { autoResizeTextarea, checkEnvironment, setLoading } from "./utils.js";
checkEnvironment();

// Initialize an OpenAI client for your provider using env vars
const openai = new OpenAI({
  apiKey: process.env.AI_KEY,
  baseURL: process.env.AI_URL,
  dangerouslyAllowBrowser: true,
});

// Get UI elements
const giftForm = document.getElementById("gift-form");
const userInput = document.getElementById("user-input");
const outputContent = document.getElementById("output-content");

function start() {
  // Setup UI event listeners
  userInput.addEventListener("input", () => autoResizeTextarea(userInput));
  giftForm.addEventListener("submit", handleGiftRequest);
}

// Initialize messages array with system prompt
const messages = [
  {
    role: "system",
    content: `You are the Gift Genie!
    Make your gift suggestions thoughtful and practical.
    Your response must be under 100 words. 
    Skip intros and conclusions. 
    Only output gift suggestions.`,
  },
];

async function handleGiftRequest(e) {
  // Prevent default form submission
  e.preventDefault();

  // Get user input, trim whitespace, exit if empty
  const userPrompt = userInput.value.trim();
  if (!userPrompt) return;

  /**
    * Challenge: Basic Error Handling
    *
    * Right now, if the AI request fails,
    * the app will silently break.
    *
    * Your task:
    *
    * 1. Wrap the AI request in a try/catch block
    * 2. If an error occurs:
    *    - Log the error to the console
    *    - Show a friendly message in the UI
    * 3. Ensure loading always stops
    *
    * 💡 Check the hints folder for additional guidance!
    */

  // Set loading state
  setLoading(true);

  messages.push({
    role: 'user',
    content: userPrompt
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-50",
      messages: messages,
      stream: false
    });

    if (response.choices && response.choices.length > 0) {
      const giftSuggestions = response.choices[0].message.content;
      outputContent.textContent = giftSuggestions;
    }
  } catch (error) {
    outputContent.textContent = "Sorry! something went wrong."
    console.log("error");
  } finally {
    setLoading(false);
  }

  // Clear loading state
  setLoading(false);
}

start();
