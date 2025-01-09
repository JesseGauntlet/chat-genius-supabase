# Current list of applied SQL commands to our supabase database

# Creation of the database

-- Create a users table that extends auth.users
create table public.users (
    id uuid references auth.users on delete cascade primary key,
    name text,
    email text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    last_login timestamp with time zone,
    
    constraint users_email_key unique (email)
);

-- Create workspaces table
create table public.workspaces (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    owner_id uuid references public.users(id) on delete set null
);

-- Create channels table
create table public.channels (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    is_private boolean default false,
    workspace_id uuid references public.workspaces(id) on delete cascade
);

-- Create members table (for both workspace and channel membership)
create table public.members (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade,
    workspace_id uuid references public.workspaces(id) on delete cascade,
    channel_id uuid references public.channels(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    constraint members_unique_workspace unique (user_id, workspace_id),
    constraint members_unique_channel unique (user_id, channel_id)
);

-- Create shared_channels table
create table public.shared_channels (
    channel_id uuid references public.channels(id) on delete cascade,
    workspace_id uuid references public.workspaces(id) on delete cascade,
    target_workspace_id uuid references public.workspaces(id) on delete cascade,
    origin_workspace_id uuid references public.workspaces(id) on delete cascade,
    name text not null,
    topic text,
    is_private boolean default false,
    
    primary key (channel_id, workspace_id, target_workspace_id)
);

-- Create chat table
create table public.chat (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete set null,
    channel_id uuid references public.channels(id) on delete cascade,
    message jsonb not null,
    total_replies integer default 0,
    is_deleted boolean default false,
    modified_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    parent_id uuid references public.chat(id) on delete cascade,
    
    constraint valid_message check (jsonb_typeof(message) = 'object')
);

-- Create emojis table
create table public.emojis (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.users(id) on delete cascade,
    chat_id uuid references public.chat(id) on delete cascade,
    emoji_uni_code text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    constraint emoji_unique unique (user_id, chat_id, emoji_uni_code)
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.workspaces enable row level security;
alter table public.channels enable row level security;
alter table public.members enable row level security;
alter table public.shared_channels enable row level security;
alter table public.chat enable row level security;
alter table public.emojis enable row level security;

-- Create policies for users
create policy "Users can view their own profile"
    on public.users for select
    using ( auth.uid() = id );

create policy "Users can update their own profile"
    on public.users for update
    using ( auth.uid() = id );

-- Create policies for workspaces
create policy "Workspace members can view workspaces"
    on public.workspaces for select
    using ( 
        exists (
            select 1 from public.members
            where workspace_id = id
            and user_id = auth.uid()
        )
    );

create policy "Workspace owners can update workspaces"
    on public.workspaces for update
    using ( owner_id = auth.uid() );

-- Create policies for channels
create policy "Channel members can view channels"
    on public.channels for select
    using (
        exists (
            select 1 from public.members
            where channel_id = id
            and user_id = auth.uid()
        )
    );

-- Create policies for chat
create policy "Channel members can view messages"
    on public.chat for select
    using (
        exists (
            select 1 from public.members
            where channel_id = chat.channel_id
            and user_id = auth.uid()
        )
    );

create policy "Users can create messages"
    on public.chat for insert
    with check ( auth.uid() = user_id );

create policy "Message authors can update their messages"
    on public.chat for update
    using ( auth.uid() = user_id );

-- Create trigger for user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, email, name)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name');
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Enable realtime for relevant tables
alter publication supabase_realtime add table public.chat;
alter publication supabase_realtime add table public.emojis;

# Policy and roles

-- Create an enum for user roles
create type user_role as enum ('admin', 'member', 'guest');

-- Add role columns to relevant tables
alter table public.members add column role user_role default 'member'::user_role;

-- Add policies for role-based access
create policy "Workspace admins can manage workspace"
    on public.workspaces
    for all
    using (
        exists (
            select 1 from public.members
            where workspace_id = workspaces.id
            and user_id = auth.uid()
            and role = 'admin'
        )
    );

create policy "Channel admins can manage channel"
    on public.channels
    for all
    using (
        exists (
            select 1 from public.members
            where channel_id = channels.id
            and user_id = auth.uid()
            and role = 'admin'
        )
    );

# Workspace policy

-- Enable read access for workspace members
CREATE POLICY "Enable read access for workspace members" ON public.workspaces
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM members 
    WHERE user_id = auth.uid() 
    AND workspace_id = id
  )
);

-- Enable insert for authenticated users
CREATE POLICY "Enable insert for authenticated users" ON public.workspaces
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Enable update for workspace admins
CREATE POLICY "Enable update for workspace admins" ON public.workspaces
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM members 
    WHERE user_id = auth.uid() 
    AND workspace_id = id 
    AND role = 'admin'
  )
);