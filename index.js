import OpenAI from "openai";
import { marked } from "marked";
import DOMPurify from "dompurify";
import {
  checkEnvironment,
  autoResizeTextarea,
  setLoading,
  showStream,
} from "./utils.js";

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

/**
 * Challenge: Align the System Prompt with Web Search
 *
 * The model’s tools have changed.
 * The system prompt has not.
 *
 * Right now, the output feels better —
 * but it’s not yet *designed* for real-world information.
 *
 * Your goal is to adjust the system prompt so that
 * it takes advantage of the web search tool.
 *
 * There are many valid directions this can go.
 * What matters is whether the prompt uses
 * the model’s new capabilities.
 */

const systemPrompt = `You are the Gift Genie that can search the web! 

You generate gift ideas that feel thoughtful, specific, and genuinely useful.
Your output must be in structured Markdown.
Do not write introductions or conclusions.
Start directly with the gift suggestions.

Each gift must:
- Have a clear heading with the actual product's name
- Include a short explanation of why it works
- Include the current price or a price range
- Include one or more links to websites or social media business pages
where the gift can be bought

Prefer products that are widely available and well-reviewed.
If you can't find a working link, say so rather than guessing.

If the user mentions a location, situation, or constraint,
adapt the gift ideas and add another short section 
under each gift that guides the user to get the gift in that 
constrained context.

After the gift ideas, include a section titled "Questions for you"
with clarifying questions that would help improve the recommendations.

Finish with a section with H2 heading titled "Wanna browse yourself?"
with links to various ecommerce sites with relevant search queries and filters 
already applied.`;

async function handleGiftRequest(e) {
  // Prevent default form submission
  e.preventDefault();

  // Get user input, trim whitespace, exit if empty
  const userPrompt = userInput.value.trim();
  if (!userPrompt) return;

  setLoading(true);

  try {
    // Send a chat completions request and await its response

    const response = await fetch('http://localhost:3000/api/gift', {
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify({ userPrompt })
    });

    const data = await response.json();

    if(! response.ok){
      throw new Error(data.message)
    }

    showStream();
    const html = marked.parse(data.giftSuggestions);
    const safeHTML = DOMPurify.sanitize(html);
    outputContent.innerHTML = safeHTML

  } catch (error) {
    // Log the error for debugging
    console.error(error.message); 

    // Display friendly error message
    outputContent.textContent =
      "Sorry, I can't access what I need right now. Please try again in a bit.";
  } finally {
    // Always clear loading state (shows output, resets lamp)
    setLoading(false);
  }
}

start();
