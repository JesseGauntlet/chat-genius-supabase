import { SupabaseClient } from '@supabase/supabase-js'

interface ChatbotResponse {
  answer: string
  context: Array<{
    text: string
    created_at: string
    score: number
  }>
}

export const processChatbotCommand = (content: string): { targetUsername: string; query: string } | null => {
  console.log('🤖 Processing chatbot command:', content)
  const chatbotMatch = content.match(/^@chatbot\s+([^\s]+)\s+(.+)$/i)
  if (!chatbotMatch) {
    console.log('❌ No chatbot command match found')
    return null
  }
  
  const [_, targetUsername, query] = chatbotMatch
  console.log('✅ Chatbot command parsed:', { targetUsername, query })
  return { targetUsername, query }
}

export const getChatbotUser = async (supabase: SupabaseClient) => {
  console.log('🤖 Getting chatbot user')
  // Get the chatbot user (create if doesn't exist)
  const { data: chatbotUser, error: chatbotError } = await supabase
    .from('users')
    .select('id')
    .eq('name', 'Chatbot')
    .single()

  if (chatbotError) {
    console.log('⚠️ Chatbot user not found, creating new one')
    // Create chatbot user if it doesn't exist
    const { data: newChatbot, error: createError } = await supabase
      .from('users')
      .insert({ name: 'Chatbot' })
      .select('id')
      .single()

    if (createError) {
      console.error('❌ Failed to create chatbot user:', createError)
      throw createError
    }
    console.log('✅ Created new chatbot user:', newChatbot.id)
    return newChatbot.id
  }

  console.log('✅ Found existing chatbot user:', chatbotUser.id)
  return chatbotUser.id
}

export const getTargetUser = async (supabase: SupabaseClient, username: string) => {
  console.log('🤖 Looking up target user:', username)
  const { data: targetUser, error: targetError } = await supabase
    .from('users')
    .select('id')
    .ilike('name', username)
    .single()

  if (targetError) {
    console.error('❌ Target user not found:', username)
    throw new Error(`User "${username}" not found.`)
  }
  console.log('✅ Found target user:', targetUser.id)
  return targetUser.id
}

export const sendChatbotMessage = async (
  supabase: SupabaseClient,
  channelId: string,
  chatbotId: string,
  message: {
    text: string,
    metadata?: {
      imitating_user?: string
    }
  }
) => {
  console.log('🤖 Sending chatbot message:', {
    channelId,
    chatbotId,
    message: message.text.substring(0, 100) + (message.text.length > 100 ? '...' : '')
  })

  const { error } = await supabase
    .from('chat')
    .insert({
      message: {
        text: message.text,
        metadata: message.metadata
      },
      user_id: chatbotId,
      channel_id: channelId,
    })

  if (error) {
    console.error('❌ Failed to send chatbot message:', error)
    throw error
  }
  console.log('✅ Chatbot message sent successfully')
}

export const getChatbotResponse = async (userId: string, query: string): Promise<ChatbotResponse> => {
  console.log('🤖 Getting chatbot response:', { userId, query })
  const response = await fetch('/api/user-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      userId,
      maxResults: 10
    })
  })

  if (!response.ok) {
    console.error('❌ Failed to get chatbot response:', {
      status: response.status,
      statusText: response.statusText
    })
    const errorText = await response.text()
    console.error('Error response body:', errorText)
    throw new Error(`Failed to get chatbot response: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  console.log('✅ Got chatbot response:', {
    answer: data.answer?.substring(0, 100) + (data.answer?.length > 100 ? '...' : ''),
    contextCount: data.context?.length
  })
  return data
}

export const handleChatbotMessage = async (
  supabase: SupabaseClient,
  channelId: string,
  targetUsername: string,
  query: string
) => {
  console.log('🤖 Starting chatbot message handler:', {
    channelId,
    targetUsername,
    query
  })
  
  try {
    // Get or create chatbot user
    const chatbotId = await getChatbotUser(supabase)
    console.log('✅ Got chatbot user:', chatbotId)

    try {
      // Get target user
      const targetUserId = await getTargetUser(supabase, targetUsername)
      console.log('✅ Got target user:', targetUserId)

      // Get response from chatbot API
      const data = await getChatbotResponse(targetUserId, query)
      console.log('✅ Got API response')

      // Send the response
      await sendChatbotMessage(
        supabase,
        channelId,
        chatbotId,
        {
          text: data.answer,
          metadata: {
            imitating_user: targetUsername
          }
        }
      )
      console.log('✅ Chatbot message flow completed successfully')
    } catch (error: any) {
      console.error('⚠️ Error in chatbot message flow:', error)
      // Send error message
      await sendChatbotMessage(
        supabase,
        channelId,
        chatbotId,
        {
          text: `Error: ${error.message || 'Unknown error occurred'}`
        }
      )
      console.log('✅ Error message sent to chat')
    }
  } catch (error) {
    console.error('❌ Fatal error in chatbot handler:', error)
    throw error
  }
} 