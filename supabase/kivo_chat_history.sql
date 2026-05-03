-- Kivo Chat History Schema

create table if not exists kivo_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text,
  is_favorite boolean default false,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists kivo_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references kivo_conversations(id) on delete cascade,
  user_id uuid not null,
  role text not null,
  content text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Enable RLS
alter table kivo_conversations enable row level security;
alter table kivo_messages enable row level security;

-- Policies
create policy "Users can access their conversations"
  on kivo_conversations for all
  using (auth.uid() = user_id);

create policy "Users can access their messages"
  on kivo_messages for all
  using (auth.uid() = user_id);
