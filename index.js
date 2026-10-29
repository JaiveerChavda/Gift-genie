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

async function handleGiftRequest(e) {
  // Prevent default form submission
  e.preventDefault();

  // Get user input, trim whitespace, exit if empty
  const userPrompt = userInput.value.trim();
  if (!userPrompt) return;

  setLoading(true);

  try {
    const response = await fetch('/api/gift', {
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify({ userPrompt })
    });

    if(! response.ok){
      const data = await response.json();
      throw new Error(data.message);
    }

    showStream();

    if (!response.body) throw new Error("Streaming is not supported by this browser.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let streamedText = '';

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

      const events = buffer.split('\n\n');
      buffer = events.pop();

      for (const event of events) {
        const line = event.split('\n').find((line) => line.startsWith('data: '));
        if (!line) continue;

        const payload = line.slice(6);
        if (payload === '[DONE]') continue;

        const { delta } = JSON.parse(payload);
        streamedText += delta;
        outputContent.innerHTML = DOMPurify.sanitize(marked.parse(streamedText));
      }

      if (done) break;
    }

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
