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
  { // first example
    role: 'user',
    content: `dubai airport. last minute gifts for niece (arts & crafts) and nephew who loves football`
  },
  {
    role: 'assistant',
    content: `### Travel Art Kit for Niece (Compact & Portable)
    A small, kid-friendly arts & crafts item that's easy to pack and perfect for a quick creative distraction during travel.

    **How to get it:**
    1. Head to Dubai International Airport (DXB) and proceed to Terminal 3 Departures.
    2. Visit Dubai Duty Free or a nearby WHSmith that carries kids’ stationery.
    3. Ask for compact arts & crafts kits or a coloring book with pencils.
    4. Choose a lightweight option suitable for carry-on.
    5. Request gift wrapping if available.

    ---

    ### Mini Football Keychain for Nephew

    A light, inexpensive football-themed souvenir that’s easy to carry and perfect for an airport purchase.

    **How to get it:**
    1. Visit Dubai Duty Free or a souvenir shop near the gates.
    2. Ask for football-themed keychains or small sports souvenirs.
    3. Check toy or sports sections if needed.
    4. Purchase and pack securely.

    ---

    ## Questions for you
    1. What are the ages of your niece and nephew?
    2. Do you have a budget per gift?
    3. Are you departing from Terminal 3?
    4. Does your nephew support a specific team?`
  },
  {
    role: 'user',
    content: ``
  },
  {
    role: 'assistant',
    content: `### LED Dandiya Stick Sets
    Glowing sticks for safe, fun garba dancing—perfect for office celebrations and individual keepsakes.

    **How to get it:**

    1. Open the Amazon Prime app.
    2. Search for "LED dandiya sticks."
    3. Filter for delivery by October 10.
    4. Order 10–15 sets within budget.
    5. Select the office delivery address.

    ---

    ### Colorful Bandhani Dupattas

    Lightweight, vibrant dupattas ideal for garba nights and office festive attire.

    **How to get it:**

    1. Search for "women's bandhani dupatta" on Amazon.
    2. Filter for Prime-eligible items with October 9–10 delivery.
    3. Choose assorted colors.
    4. Order the required quantities.
    5. Arrange an office courier drop.

    ---

    ### Navratri Snack & Sweet Combo Box

    Assorted traditional mithai and snacks for office sharing during garba nights.

    **How to get it:**

    1. Search for "Navratri special thali" or "festive sweets box."
    2. Select Amazon Kitchen or gourmet stores with Prime delivery.
    3. Verify delivery by October 10.
    4. Order 2–3 boxes for team sharing.
    5. Deliver to the office reception.

    ---

    ### Traditional Kada/Choodi Sets

    Silver-tone or fashion jewelry suitable for garba outfits and office wear.

    **How to get it:**

    1. Search for "garba jewelry set" or "kada choodi."
    2. Filter by Prime and a price range of ₹500–₹1,000.
    3. Select items with delivery by October 9.
    4. Order multiple sets within the total budget of ₹10,000.
    5. Select office delivery.

    ---

    ## Questions for You

    1. How many colleagues are we gifting?
    2. Is the ₹10,000 budget total or per person?
    3. Are there any gender-specific preferences for jewelry or clothing?
    4. Do you want individual gifts or one shared item for the office?`
  }
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
  messages.push({
     role: "user", 
     content: `Generate fresh gift ideas for this new user request: ${userPrompt}` 
    });

  /**
   * Challenge: Few-Shot Prompting with Multiple Examples
   *
   * So far, we’ve been relying on zero-shot prompting.
   * Now we’re going to show the model multiple examples
   * of what “good” looks like.
   *
   * You are starting with:
   * - A system prompt
   * - One example user message
   * - One example assistant response (already edited for clarity)
   *
   * Your task:
   *
   * 1. Add ANOTHER example user message
   * 2. Add a matching example assistant response
   *
   * Guidelines for your new example:
   *
   * - It must follow the system rules exactly
   * - It should be consistent with the formatting of the first example
   * - Explanations should be plain text (no “Why this works” labels)
   * - Use “How to get it” instead of long step-by-step headings
   * - Questions at the end should be numbered
   *
   * You’re allowed to generate your example using another AI tool
   * (ChatGPT, Gemini, t3chat, etc.) and paste it in here.
   * What matters is that it demonstrates the style and structure we want.
   * 
   * 💡 Check the hints folder for additional guidance!
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
