require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testUserChat(username, customQuery = null) {
    try {
        if (!username) {
            throw new Error('Username parameter is required');
        }

        // Get the specific user from the database
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const { data: users, error } = await supabase
            .from('users')
            .select('id, name')
            .ilike('name', username)
            .limit(1);

        if (error || !users.length) {
            throw new Error('Failed to get user: ' + (error?.message || `No user found with name: ${username}`));
        }

        const testUser = users[0];
        console.log(`Testing with user: ${testUser.name} (${testUser.id})`);

        // Use custom query if provided, otherwise use default test queries
        const queries = customQuery ? [customQuery] : [
            "What's your opinion on AI?",
            "How would you explain blockchain?",
            "What's your favorite programming language?"
        ];

        // Make API calls
        for (const query of queries) {
            console.log('\n' + '='.repeat(50));
            console.log(`Query: ${query}`);

            const response = await fetch('http://localhost:3000/api/user-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    userId: testUser.id,
                    maxResults: 10
                })
            });

            if (!response.ok) {
                console.log('Server responded with:', response.status);
                console.log('Response body:', await response.text());
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('\nAI Response:', data.answer);
            console.log('\nBased on context from:', data.context.length, 'messages');
            console.log('Sample context:', data.context[0]?.text || 'No context available');
        }

    } catch (error) {
        console.error('Error testing user chat:', error);
    }
}

// Get username and optional query from command line arguments
const username = process.argv[2];
const customQuery = process.argv[3];

if (!username) {
    console.error('Please provide a username as an argument. Examples:');
    console.error('node test-user-chat.js "John Doe"');
    console.error('node test-user-chat.js "John Doe" "What is your opinion on climate change?"');
    process.exit(1);
}

// Make sure the frontend dev server is running on port 3000
console.log('Testing user-chat API endpoint at http://localhost:3000/api/user-chat');
console.log('Make sure the frontend development server is running!');

testUserChat(username, customQuery); 