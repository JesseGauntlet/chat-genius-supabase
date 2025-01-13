create or replace function create_channel_with_members(
  p_workspace_id uuid,
  p_member_id uuid,
  p_channel_name text,
  p_current_user_id uuid,
  p_is_private boolean
) returns json language plpgsql security definer as $$
declare
  v_channel_id uuid;
begin
  -- Create the channel with workspace_id
  insert into channels (name, is_private, workspace_id)
  values (p_channel_name, p_is_private, p_workspace_id)
  returning id into v_channel_id;

  -- Insert the current user as member
  insert into members (user_id, channel_id, role)
  values (p_current_user_id, v_channel_id, 'admin');

  -- Insert the other member
  insert into members (user_id, channel_id, role)
  values (p_member_id, v_channel_id, 'admin');

  -- Return the channel data
  return json_build_object(
    'id', v_channel_id,
    'name', p_channel_name,
    'is_private', p_is_private,
    'workspace_id', p_workspace_id
  );
end;
$$; 