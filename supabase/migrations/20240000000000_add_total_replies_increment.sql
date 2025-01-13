-- Create or replace the function to increment total_replies
CREATE OR REPLACE FUNCTION increment_total_replies(message_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE chat
    SET total_replies = COALESCE(total_replies, 0) + 1
    WHERE id = message_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_total_replies(UUID) TO authenticated; 