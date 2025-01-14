require('dotenv').config({ path: '.env.local' });
const { Pinecone } = require('@pinecone-database/pinecone');
const { OpenAI } = require('openai');

// Add environment check
console.log('Environment check:', {
    PINECONE_API_KEY: process.env.PINECONE_API_KEY ? 'Set' : 'Not set',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set' : 'Not set'
});

async function testConnections() {
    console.log('Starting connection tests...');
    
    try {
        // Test Pinecone
        console.log('Testing Pinecone connection...');
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
        // List indexes to verify connection
        const indexes = await pinecone.listIndexes();
        console.log('✅ Pinecone connection successful');

        // Test OpenAI
        console.log('Testing OpenAI connection...');
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "Hello!" }],
        });
        console.log('✅ OpenAI connection successful');

    } catch (error) {
        console.error('❌ Error testing connections:', error.message);
    }
}

// Properly handle the async function
testConnections()
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });

// Add this to prevent the script from exiting immediately
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
    process.exit(1);
}); 