import express from 'express';
import cors from 'cors';
import e from 'express';
import OpenAI from 'openai';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Initialize an OpenAI client for your provider using env vars
const openai = new OpenAI({
  apiKey: process.env.AI_KEY,
  baseURL: process.env.AI_URL,
});

const messages = [
    {
        role: "system",
        content: `You are the Gift Genie.
        You generate gift ideas that feel thoughtful, specific, and genuinely useful.
        Your output must be in structured Markdown.
        Do not write introductions or conclusions.
        Start directly with the gift suggestions.

        Each gift must:
        - Have a clear heading
        - Include a short explanation of why it works

        If the user mentions a location, situation, or constraint,
        adapt the gift ideas and add another short section 
        under each gift that guides the user to get the gift in that 
        constrained context.

        After the gift ideas, include a section titled "Questions for you"
        with clarifying questions that would help improve the recommendations.`
    }
];

app.post('/api/gift',async (req, res) => {
    const { userPrompt } = req.body;
    messages.push({
        role: 'user',
        content: userPrompt
    });

    try {
        const response = await openai.chat.completions.create({
            model: process.env.AI_MODEL,
            messages
        });

        const giftSuggestions = response.choices[0].message.content;
        console.log(giftSuggestions)
        res.json({giftSuggestions})
    } catch (error) {
        console.error(e);
        return res.status(500).json({ message: `It's not you, it's us. something went wrong on the server.` });
    }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});