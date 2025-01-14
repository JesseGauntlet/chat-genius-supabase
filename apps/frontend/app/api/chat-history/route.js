import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const INDEX_NAME = 'chat-embeddings';

export async function GET() {
    return new Response(JSON.stringify({ status: "Chat-history API is alive" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}

export async function POST(req) {
    try {
        const { query, maxResults = 5 } = await req.json();

        if (!query) {
            return Response.json(
                { error: 'Query is required' },
                { status: 400 }
            );
        }

        // Generate embedding for the query
        const embedding = await openai.embeddings.create({
            input: query,
            model: "text-embedding-3-large"
        });

        // Initialize Pinecone
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
        
        const index = pinecone.Index(INDEX_NAME);

        // Search for similar vectors
        const results = await index.query({
            vector: embedding.data[0].embedding,
            topK: maxResults,
            includeMetadata: true
        });

        // Format context for GPT
        const context = results.matches
            .map(match => `[${match.metadata.user_name}]: ${match.metadata.text}`)
            .join('\n\n');

        // Generate response using chat completion
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                    role: "system",
                    content: `You are a helpful AI assistant with access to chat history. 
Use the following relevant chat messages as context to answer the user's question.
Only use information from the provided context. If you can't find relevant information, say so.
When referring to messages, include the user's name if available.

Context:
${context}`
                },
                { role: "user", content: query }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        return Response.json({
            answer: response.choices[0].message.content,
            context: results.matches.map(match => ({
                text: match.metadata.text,
                user_name: match.metadata.user_name,
                created_at: match.metadata.created_at,
                score: match.score
            }))
        });

    } catch (error) {
        console.error('Error in chat-history API:', error);
        return Response.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
} 