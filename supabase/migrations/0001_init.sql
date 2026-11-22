begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  xp integer not null default 0 check (xp >= 0),
  streak integer not null default 0 check (streak >= 0),
  last_study_date date,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  plan_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80));
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create table public.vocab (
  id serial primary key, word text not null, reading text not null,
  meaning_id text not null, meaning_en text,
  jlpt_level smallint not null check (jlpt_level between 1 and 5),
  tags text[] not null default '{}', is_premium boolean not null default false
);
create table public.kanji (
  id serial primary key, character text not null unique,
  onyomi text[] not null default '{}', kunyomi text[] not null default '{}',
  meaning_id text not null, meaning_en text, strokes smallint check (strokes > 0),
  jlpt_level smallint not null check (jlpt_level between 1 and 5),
  is_premium boolean not null default false
);
create table public.grammar (
  id serial primary key, slug text not null unique, title text not null,
  jlpt_level smallint not null check (jlpt_level between 1 and 5),
  explanation_md text not null,
  examples jsonb not null default '[]' check (jsonb_typeof(examples) = 'array'),
  is_premium boolean not null default false
);
create table public.cards (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('kana', 'vocab', 'kanji')),
  item_id text not null,
  ease real not null default 2.5 check (ease >= 1.3),
  interval_days integer not null default 0 check (interval_days >= 0),
  repetitions integer not null default 0 check (repetitions >= 0),
  lapses integer not null default 0 check (lapses >= 0),
  due_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);
create index cards_user_due_idx on public.cards (user_id, due_at);
create table public.review_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('kana', 'vocab', 'kanji')),
  item_id text not null, grade smallint not null check (grade between 0 and 5),
  reviewed_at timestamptz not null default now()
);
create table public.questions (
  id serial primary key,
  section text not null check (section in ('moji_goi', 'bunpou', 'dokkai', 'choukai')),
  jlpt_level smallint not null check (jlpt_level between 1 and 5),
  prompt text not null, passage text,
  choices jsonb not null check (jsonb_typeof(choices) = 'array' and jsonb_array_length(choices) >= 2),
  answer_index smallint not null check (answer_index >= 0 and answer_index < jsonb_array_length(choices)),
  explanation_id text not null, is_premium boolean not null default false
);
create table public.question_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id integer not null references public.questions(id),
  chosen_index smallint not null check (chosen_index >= 0), correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key (user_id, question_id, answered_at)
);
create table public.quiz_attempts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('practice', 'tryout')),
  jlpt_level smallint not null check (jlpt_level between 1 and 5),
  score integer not null check (score >= 0),
  total integer not null check (total >= 0 and score <= total),
  taken_at timestamptz not null default now()
);

-- Hak eksplisit: jangan bergantung pada default grants proyek Supabase.
revoke all on public.profiles, public.vocab, public.kanji, public.grammar,
  public.cards, public.review_logs, public.questions, public.question_attempts,
  public.quiz_attempts from public, anon, authenticated;
revoke all on sequence public.vocab_id_seq, public.kanji_id_seq,
  public.grammar_id_seq, public.review_logs_id_seq, public.questions_id_seq,
  public.quiz_attempts_id_seq from public, anon, authenticated;

grant select on public.profiles to authenticated;
-- Tidak ada INSERT/DELETE profil dari klien; hanya trigger yang membuat profil.
-- plan DAN plan_expires_at tidak mendapat hak UPDATE, termasuk dalam upsert.
grant update (display_name, xp, streak, last_study_date) on public.profiles to authenticated;
grant select on public.vocab, public.kanji, public.grammar, public.questions to authenticated;
grant select, insert, update, delete on public.cards, public.review_logs,
  public.question_attempts, public.quiz_attempts to authenticated;
grant usage, select on sequence public.review_logs_id_seq, public.quiz_attempts_id_seq to authenticated;
grant all on public.profiles, public.vocab, public.kanji, public.grammar,
  public.cards, public.review_logs, public.questions, public.question_attempts,
  public.quiz_attempts to service_role;
grant all on sequence public.vocab_id_seq, public.kanji_id_seq,
  public.grammar_id_seq, public.review_logs_id_seq, public.questions_id_seq,
  public.quiz_attempts_id_seq to service_role;

alter table public.profiles enable row level security;
alter table public.vocab enable row level security;
alter table public.kanji enable row level security;
alter table public.grammar enable row level security;
alter table public.cards enable row level security;
alter table public.review_logs enable row level security;
alter table public.questions enable row level security;
alter table public.question_attempts enable row level security;
alter table public.quiz_attempts enable row level security;

create policy profiles_read_own on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy cards_own on public.cards for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy review_logs_own on public.review_logs for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy question_attempts_own on public.question_attempts for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy quiz_attempts_own on public.quiz_attempts for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy vocab_read_authenticated on public.vocab for select to authenticated using (true);
create policy kanji_read_authenticated on public.kanji for select to authenticated using (true);
create policy grammar_read_authenticated on public.grammar for select to authenticated using (true);
create policy questions_read_authenticated on public.questions for select to authenticated using (true);

commit;
