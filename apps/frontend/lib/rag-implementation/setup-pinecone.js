require('dotenv').config({ path: '.env.local' });
const { Pinecone } = require('@pinecone-database/pinecone');

const INDEX_NAME = 'chat-embeddings';

async function setupPineconeIndex() {
    try {
        console.log('Initializing Pinecone...');
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });

        // Check if index exists
        const { indexes } = await pinecone.listIndexes();
        const existingIndex = indexes.find(index => index.name === INDEX_NAME);
        
        if (!existingIndex) {
            console.log(`Creating new index: ${INDEX_NAME}`);
            await pinecone.createIndex({
                name: INDEX_NAME,
                dimension: 3072,  // dimension for text-embedding-3-large
                metric: 'cosine',
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1'
                    }
                }
            });
            console.log('Waiting for index to be ready...');
            await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s for index initialization
        } else {
            console.log(`Using existing index: ${INDEX_NAME}`);
        }

        const index = pinecone.Index(INDEX_NAME);
        console.log('✅ Pinecone index ready');
        
        return index;
    } catch (error) {
        console.error('❌ Error setting up Pinecone:', error);
        throw error;
    }
}

function cleanMetadata(metadata) {
    const cleaned = {};
    for (const [key, value] of Object.entries(metadata)) {
        // Only include non-null values, convert arrays to string arrays if needed
        if (value != null) {
            if (Array.isArray(value)) {
                cleaned[key] = value.map(String);
            } else {
                cleaned[key] = value;
            }
        }
    }
    return cleaned;
}

async function upsertEmbeddings() {
    try {
        const { generateEmbeddings } = require('./generate-embeddings');
        const embeddedChunks = await generateEmbeddings();
        
        const index = await setupPineconeIndex();
        console.log('Starting vector upsert...');

        // Prepare vectors in Pinecone format with cleaned metadata
        const vectors = embeddedChunks.map(chunk => ({
            id: `${chunk.metadata.id}-${chunk.metadata.chunk_index}`,
            values: chunk.embedding,
            metadata: {
                text: chunk.text,
                ...cleanMetadata(chunk.metadata)
            }
        }));

        // Delete old vectors before upserting new ones
        const currentIds = vectors.map(v => v.id);
        await deleteOldVectors(index, currentIds);

        // Upsert in batches of 100
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            console.log(`Upserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);
            
            await index.upsert(batch);
        }

        console.log(`✅ Successfully upserted ${vectors.length} vectors to Pinecone`);
        
        // Test query to verify insertion
        const testQuery = await index.query({
            vector: vectors[0].values,
            topK: 1,
            includeMetadata: true
        });
        
        console.log('Sample query result:', testQuery);

    } catch (error) {
        console.error('❌ Error upserting to Pinecone:', error);
        throw error;
    }
}

async function deleteOldVectors(index, currentIds) {
    // Get all vectors in the index
    const queryResponse = await index.query({
        vector: new Array(3072).fill(0),  // dummy vector
        topK: 10000,
        includeMetadata: true
    });
    
    // Find vectors that are no longer in our database
    const existingIds = queryResponse.matches.map(match => match.id);
    const idsToDelete = existingIds.filter(id => !currentIds.includes(id));
    
    if (idsToDelete.length > 0) {
        console.log(`Deleting ${idsToDelete.length} old vectors...`);
        await index.deleteMany(idsToDelete);
    }
}

// Run the upsert process
if (require.main === module) {
    upsertEmbeddings()
        .catch(console.error);
}

module.exports = { setupPineconeIndex, upsertEmbeddings }; 