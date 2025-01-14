require('dotenv').config({ path: '.env.local' });

function processMessage(message) {
    // Extract text from JSONB message
    const text = typeof message.message === 'object' 
        ? message.message.text || ''
        : message.message || '';

    return {
        text,
        metadata: {
            id: message.id,
            channel_id: message.channel_id,
            user_id: message.user_id,
            user_name: message.user_name,
            created_at: message.created_at,
            parent_id: message.parent_id
        }
    };
}

function chunkText(text, maxChunkSize = 500) {
    // Split into sentences (basic implementation)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length <= maxChunkSize) {
            currentChunk += sentence;
        } else {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = sentence;
        }
    }
    if (currentChunk) chunks.push(currentChunk.trim());

    return chunks;
}

async function chunkMessages() {
    try {
        // Import fetchMessages dynamically
        const { fetchMessages } = require('./fetch-messages');
        const messages = await fetchMessages();
        
        const processedChunks = [];

        for (const message of messages) {
            const processed = processMessage(message);
            const chunks = chunkText(processed.text);
            
            chunks.forEach((chunk, index) => {
                processedChunks.push({
                    text: chunk,
                    metadata: {
                        ...processed.metadata,
                        chunk_index: index,
                        total_chunks: chunks.length
                    }
                });
            });
        }

        console.log(`✅ Processed ${messages.length} messages into ${processedChunks.length} chunks`);
        console.log('Sample chunk:', processedChunks[0]);

        return processedChunks;

    } catch (error) {
        console.error('❌ Error processing messages:', error);
        throw error;
    }
}

// Run the chunking process
if (require.main === module) {
    chunkMessages()
        .catch(console.error);
}

module.exports = { chunkMessages, processMessage, chunkText }; 