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

app.post('/api/gift',async (req, res) => {

    const systemPrompt = `You are the Gift Genie that can search the web!

        You generate gift ideas that feel thoughtful, specific, and genuinely useful.
        Your output must be in structured Markdown.
        Do not write introductions or conclusions.
        Start directly with the gift suggestions.

        Each gift must:
        - Have a clear heading with the actual product's name
        - Include a short explanation of why it works
        - Include the current price or a price range
        - Include one or more links to websites or social media business pages where the gift can be bought

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

    const { userPrompt } = req.body;

    try {

        const response = await openai.responses.create({
            model: process.env.AI_MODEL,
            input: userPrompt,
            tools: [{type : "web_search"}],
            instructions: systemPrompt,
            stream: false
        });

        const giftSuggestions = response.output_text;
        res.json({giftSuggestions});
    } catch (error) {
        console.error(e);
        return res.status(500).json({ message: `It's not you, it's us. something went wrong on the server.` });
    }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});