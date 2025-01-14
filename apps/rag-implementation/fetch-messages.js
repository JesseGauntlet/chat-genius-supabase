require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function fetchMessages() {
    console.log('Starting message fetch...');
    
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        // Fetch messages with user information
        const { data: messages, error } = await supabase
            .from('chat')
            .select(`
                id,
                message,
                created_at,
                channel_id,
                user_id,
                parent_id,
                users (
                    name,
                    email
                )
            `)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Transform the response to flatten user info
        const processedMessages = messages.map(msg => ({
            ...msg,
            user_name: msg.users?.name || 'Unknown User',
            users: undefined  // Remove the nested users object
        }));

        console.log(`✅ Successfully fetched ${processedMessages.length} messages`);
        
        if (processedMessages.length > 0) {
            console.log('Sample message:', {
                ...processedMessages[0],
                message: typeof processedMessages[0].message === 'object' 
                    ? JSON.stringify(processedMessages[0].message).substring(0, 100) + '...'
                    : processedMessages[0].message.substring(0, 100) + '...'
            });
        }

        return processedMessages;

    } catch (error) {
        console.error('❌ Error fetching messages:', error);
        throw error;
    }
}

// Only run if this is the main module
if (require.main === module) {
    fetchMessages()
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { fetchMessages }; 