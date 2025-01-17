import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const INDEX_NAME = 'chat-embeddings';

export async function GET() {
    return new Response(JSON.stringify({ status: "User-chat API is alive" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}

export async function POST(req) {
    try {
        const { query, userId, maxResults = 10 } = await req.json();

        if (!query || !userId) {
            return Response.json(
                { error: 'Query and userId are required' },
                { status: 400 }
            );
        }

        // Initialize Supabase to get user info
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        // Get user info
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('name')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            return Response.json(
                { error: 'User not found' },
                { status: 404 }
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

        // Search for similar vectors from this specific user
        const results = await index.query({
            vector: embedding.data[0].embedding,
            topK: maxResults,
            includeMetadata: true,
            filter: {
                user_id: { "$eq": userId }
            }
        });

        // Format context for GPT
        const context = results.matches
            .map(match => match.metadata.text)
            .join('\n\n');

        // Generate response using chat completion
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                    role: "system",
                    content: `You are an AI that mimics ${userData.name}'s communication style and knowledge.
I will provide you with examples of their past messages, and you should respond to the query in their style.
Limit your response to under 5 sentences.
Use their past messages as examples of their:
1. Tone and formality level
2. Typical sentence structure and length
3. Common phrases or expressions they use
4. How they format their messages
5. Their personality traits that come through in their writing

Here are examples of their past messages:

${context}

Respond to the query in a way that authentically matches their communication style.
If you don't have enough context to mimic their style or knowledge, just do your best.`
                },
                { role: "user", content: query }
            ],
            temperature: 0.3,
            max_tokens: 500
        });

        return Response.json({
            answer: response.choices[0].message.content,
            context: results.matches.map(match => ({
                text: match.metadata.text,
                created_at: match.metadata.created_at,
                score: match.score
            }))
        });

    } catch (error) {
        console.error('Error in user-chat API:', error);
        return Response.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
} 