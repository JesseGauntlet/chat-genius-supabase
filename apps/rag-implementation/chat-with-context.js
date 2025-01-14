require('dotenv').config({ path: '.env.local' });
const { OpenAI } = require('openai');
const { searchMessages } = require('./test-retrieval');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function chatWithContext(userQuery, maxContext = 5) {
    try {
        // First, get relevant context from our vector store
        const searchResults = await searchMessages(userQuery, maxContext);
        
        // Prepare context from search results
        const context = searchResults.matches
            .map(match => match.metadata.text)
            .join('\n\n');

        // Create system message with context
        const systemMessage = `You are a helpful AI assistant with access to chat history. 
Use the following relevant chat messages as context to answer the user's question.
Only use information from the provided context. If you can't find relevant information, say so.
When referring to messages, include the user's name if available.

Context:
${searchResults.matches.map(match => 
    `[${match.metadata.user_name}]: ${match.metadata.text}`
).join('\n\n')}`;

        // Generate response using chat completion
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: userQuery }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        return {
            answer: response.choices[0].message.content,
            context: searchResults.matches
        };

    } catch (error) {
        console.error('❌ Error in chat with context:', error);
        throw error;
    }
}

// Test the chat function if run directly
if (require.main === module) {
    const testQueries = [
        "Best joke or pun?",
        "Any mentions of fruits?",
        "Any unusual activities or anyone we should be concern about?",
        "Report any flirting or inappropriate messages."
    ];

    (async () => {
        for (const query of testQueries) {
            console.log('\n' + '='.repeat(50));
            console.log(`Query: ${query}`);
            const result = await chatWithContext(query);
            console.log('\nAnswer:', result.answer);
            console.log('\nBased on context from:', result.context.length, 'messages');
        }
    })();
}

module.exports = { chatWithContext }; 