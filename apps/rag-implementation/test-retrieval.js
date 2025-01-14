require('dotenv').config({ path: '.env.local' });
const { OpenAI } = require('openai');
const { Pinecone } = require('@pinecone-database/pinecone');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const INDEX_NAME = 'chat-embeddings';

async function searchMessages(query, topK = 5) {
    try {
        console.log(`Searching for: "${query}"`);
        
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
            topK,
            includeMetadata: true
        });

        // Format and display results
        console.log('\nSearch Results:');
        results.matches.forEach((match, i) => {
            console.log(`\n${i + 1}. Score: ${match.score.toFixed(3)}`);
            console.log(`From: ${match.metadata.user_name}`);
            console.log(`Text: ${match.metadata.text}`);
            console.log(`Metadata:`, {
                id: match.metadata.id,
                channel_id: match.metadata.channel_id,
                created_at: match.metadata.created_at,
                user_id: match.metadata.user_id
            });
        });

        return results;

    } catch (error) {
        console.error('❌ Error searching messages:', error);
        throw error;
    }
}

// Test with some sample queries if run directly
if (require.main === module) {
    const testQueries = [
        "What was discussed about RAG implementation?",
        "Any mentions of fruits?",
        "Any unusual activities or anyone we should be concern about?"
    ];

    // Run test queries sequentially
    (async () => {
        for (const query of testQueries) {
            console.log('\n' + '='.repeat(50));
            await searchMessages(query);
        }
    })();
}

module.exports = { searchMessages }; 