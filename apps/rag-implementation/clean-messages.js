require('dotenv').config({ path: '.env.local' });

function cleanText(text) {
    return text
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove markdown links
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        // Remove markdown formatting
        .replace(/[*_~`]+/g, '')
        // Remove multiple spaces and newlines
        .replace(/\s+/g, ' ')
        // Remove URLs
        .replace(/https?:\/\/[^\s]+/g, '')
        // Normalize whitespace
        .trim();
}

async function processAndCleanChunks() {
    try {
        const { chunkMessages } = require('./chunk-messages');
        const chunks = await chunkMessages();
        
        const cleanedChunks = chunks.map(chunk => ({
            ...chunk,
            text: cleanText(chunk.text)
        }));

        console.log(`✅ Cleaned ${cleanedChunks.length} chunks`);
        
        // Show a before/after comparison for the first chunk
        if (cleanedChunks.length > 0) {
            console.log('Sample cleaning result:');
            console.log('Before:', chunks[0].text.substring(0, 100) + '...');
            console.log('After:', cleanedChunks[0].text.substring(0, 100) + '...');
        }

        return cleanedChunks;

    } catch (error) {
        console.error('❌ Error cleaning chunks:', error);
        throw error;
    }
}

// Run the cleaning process
if (require.main === module) {
    processAndCleanChunks()
        .catch(console.error);
}

module.exports = { processAndCleanChunks, cleanText }; 