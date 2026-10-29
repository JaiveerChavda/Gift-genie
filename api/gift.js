import OpenAI from "openai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    if (!process.env.AI_URL || !process.env.AI_MODEL || !process.env.AI_KEY) {
        console.error('Missing AI_URL, AI_MODEL, or AI_KEY environment variable.');
        return res.status(500).json({ error: 'Translation service is not configured.' });
    }

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

    const { userPrompt } = req.body ?? {};

    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
        return res.status(400).json({ error: "Invalid input: 'userPrompt' is required." });
    }

    try {

        const openai = new OpenAI({
            apiKey: process.env.AI_KEY,
            baseURL: process.env.AI_URL,
        });

        // Keep the connection open and send each generated text delta immediately.
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const stream = await openai.responses.create({
            model: process.env.AI_MODEL,
            input: userPrompt,
            tools: [{ type: "web_search" }],
            instructions: systemPrompt,
            stream: true
        });

        let giftSuggestions = '';

        for await (const event of stream) {
            if (event.type === "response.output_text.delta") {
                giftSuggestions += event.delta;
                res.write(`data: ${JSON.stringify({ delta: event.delta })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();

        // const giftSuggestions = response.output_text;
    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            return res.status(500).json({ message: `It's not you, it's us. something went wrong on the server.` });
        }
        res.write(`event: error\ndata: ${JSON.stringify({ message: `It's not you, it's us. something went wrong on the server.` })}\n\n`);
        res.end();
    }

}