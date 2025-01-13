create or replace function increment_reply_count(message_id uuid)
returns void as $$
begin
  update chat
  set total_replies = total_replies + 1
  where id = message_id;
end;
$$ language plpgsql; 