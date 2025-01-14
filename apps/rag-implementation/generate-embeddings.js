require('dotenv').config({ path: '.env.local' });
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function generateEmbeddings(chunks, batchSize = 100) {
    try {
        const { processAndCleanChunks } = require('./clean-messages');
        const cleanedChunks = await processAndCleanChunks();
        
        console.log('Starting embedding generation...');
        const embeddedChunks = [];
        
        // Process in batches to avoid rate limits
        for (let i = 0; i < cleanedChunks.length; i += batchSize) {
            const batch = cleanedChunks.slice(i, i + batchSize);
            console.log(`Processing batch ${i / batchSize + 1}/${Math.ceil(cleanedChunks.length / batchSize)}`);
            
            const embeddings = await Promise.all(
                batch.map(async (chunk) => {
                    const response = await openai.embeddings.create({
                        input: chunk.text,
                        model: "text-embedding-3-large"
                    });
                    
                    return {
                        ...chunk,
                        embedding: response.data[0].embedding,
                        embedding_model: "text-embedding-3-large"
                    };
                })
            );
            
            embeddedChunks.push(...embeddings);
        }

        console.log(`✅ Generated embeddings for ${embeddedChunks.length} chunks`);
        
        // Show sample embedding
        if (embeddedChunks.length > 0) {
            console.log('Sample embedding:', {
                text: embeddedChunks[0].text.substring(0, 50) + '...',
                embedding_length: embeddedChunks[0].embedding.length,
                metadata: embeddedChunks[0].metadata
            });
        }

        return embeddedChunks;

    } catch (error) {
        console.error('❌ Error generating embeddings:', error);
        throw error;
    }
}

// Run the embedding process
if (require.main === module) {
    generateEmbeddings()
        .catch(console.error);
}

module.exports = { generateEmbeddings }; 