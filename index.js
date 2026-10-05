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

// Initialize messages array with system prompt
const messages = [
  {
    role: "system",
    content: `You are the Gift Genie!
    Make your gift suggestions thoughtful and practical.
    Be context aware-If a location or constraint is mentioned, adapt the ideas.
    The user will describe the gift's recipient. 
    Your response must be in structured Markdown.
    Each gift must: 
      - Have a clear heading
      - A short explanation of why it would work

    If the user mentions a location or a time constraint,
    add another section under each gift that gives the user 
    a step by step guide on where and how they can get the gift.

    Skip intros and conclusions. 
    Only output gift suggestions.
    
    End with a section with an H2 heading titled "Questions for you" 
    that contains follow-ups that would help improve the 
    gift suggestions`,

  },
];

function start() {
  // Setup UI event listeners
  userInput.addEventListener("input", () => autoResizeTextarea(userInput));
  giftForm.addEventListener("submit", handleGiftRequest);
}

async function handleGiftRequest(e) {
  // Prevent default form submission
  e.preventDefault();

  // Get user input, trim whitespace, exit if empty
  const userPrompt = userInput.value.trim();
  if (!userPrompt) return;

  // Set loading state (hides output, animates lamp)
  setLoading(true);

  // Add user message to global messages array
  messages.push({ role: "user", content: userPrompt });

  /**
   * Challenge: Stream Gift Genie Responses
   *
   * You're starting with:
   * - A working Gift Genie app from the previous lesson
   * - A non-streaming chat completion request
   *
   * Your task:
   *
   * 1. Enable streaming by adding stream: true to the request
   * 2. Loop over the stream using for await...of syntax
   * 3. Extract content from each chunk
   * 4. Accumulate streamed text chunks into a single string
   * 5. Convert that accumulated Markdown into HTML
   * 6. Sanitize the HTML
   * 7. Render it progressively as the stream updates
   *
   * 💡 Check the hints folder for additional guidance
   */

  try {
    // Send a chat completions request and await its response
    const stream = await openai.chat.completions.create({
      model: process.env.AI_MODEL,
      messages,
      stream: true
    });

    // Show output container immediately for streaming feedback
    showStream();

    let giftSuggestions = "";
    // Extract gift suggestions from the assistant message's content
    for await (const chunk of stream) {

      const content = chunk.choices?.[0]?.delta?.content;
      giftSuggestions += content;

      // Convert Markdown to HTML
      const html = marked.parse(giftSuggestions);

      // Sanitize the HTML
      const safeHTML = DOMPurify.sanitize(html);

      // Display the sanitized HTML
      outputContent.innerHTML = safeHTML;
    }

  } catch (err) {
    // Log the error for debugging
    console.error(err);

    // Display friendly error message
    outputContent.textContent =
      "Sorry, I can't access what I need right now. Please try again in a bit.";
  } finally {
    // Always clear loading state (shows output, resets lamp)
    setLoading(false);
  }
}

start();
