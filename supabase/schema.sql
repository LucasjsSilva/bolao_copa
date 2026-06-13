create extension if not exists pgcrypto;

create table if not exists public.boloes (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(trim(nome)) > 0),
  codigo text not null unique check (char_length(trim(codigo)) >= 4),
  criado_por uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.jogos (
  id uuid primary key default gen_random_uuid(),
  bolao_id uuid not null references public.boloes (id) on delete cascade,
  time_a text not null check (char_length(trim(time_a)) > 0),
  time_b text not null check (char_length(trim(time_b)) > 0),
  data_jogo timestamptz not null,
  fase text not null,
  placar_a integer,
  placar_b integer,
  encerrado boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.participantes (
  id uuid primary key default gen_random_uuid(),
  bolao_id uuid not null references public.boloes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nome_exibicao text not null check (char_length(trim(nome_exibicao)) > 0),
  created_at timestamptz not null default timezone('utc', now()),
  constraint participantes_bolao_user_unique unique (bolao_id, user_id)
);

create table if not exists public.palpites (
  id uuid primary key default gen_random_uuid(),
  jogo_id uuid not null references public.jogos (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  bolao_id uuid not null references public.boloes (id) on delete cascade,
  palpite_a integer not null check (palpite_a >= 0),
  palpite_b integer not null check (palpite_b >= 0),
  pontos_ganhos double precision not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint palpites_jogo_user_unique unique (jogo_id, user_id),
  constraint palpites_participante_fk foreign key (bolao_id, user_id)
    references public.participantes (bolao_id, user_id) on delete cascade
);

create index if not exists idx_boloes_codigo on public.boloes (codigo);
create index if not exists idx_boloes_criado_por on public.boloes (criado_por);
create index if not exists idx_jogos_bolao_data on public.jogos (bolao_id, data_jogo);
create index if not exists idx_participantes_bolao on public.participantes (bolao_id);
create index if not exists idx_participantes_user on public.participantes (user_id);
create index if not exists idx_palpites_bolao on public.palpites (bolao_id);
create index if not exists idx_palpites_jogo on public.palpites (jogo_id);
create index if not exists idx_palpites_user on public.palpites (user_id);

create table if not exists public.times (
  id serial primary key,
  nome text not null,
  grupo text not null,
  bandeira_emoji text,
  created_at timestamptz default now()
);

create index if not exists idx_times_grupo on public.times (grupo);

insert into public.times (nome, grupo, bandeira_emoji) values
  ('Argentina', 'A', '🇦🇷'),
  ('Canadá', 'A', '🇨🇦'),
  ('Chile', 'A', '🇨🇱'),
  ('Peru', 'A', '🇵🇪'),
  ('México', 'B', '🇲🇽'),
  ('EUA', 'B', '🇺🇸'),
  ('Panamá', 'B', '🇵🇦'),
  ('Venezuela', 'B', '🇻🇪'),
  ('Brasil', 'C', '🇧🇷'),
  ('Noruega', 'C', '🇳🇴'),
  ('Sérvia', 'C', '🇷🇸'),
  ('Marrocos', 'C', '🇲🇦'),
  ('França', 'D', '🇫🇷'),
  ('Bélgica', 'D', '🇧🇪'),
  ('Ucrânia', 'D', '🇺🇦'),
  ('Tunísia', 'D', '🇹🇳'),
  ('Espanha', 'E', '🇪🇸'),
  ('Holanda', 'E', '🇳🇱'),
  ('Portugal', 'E', '🇵🇹'),
  ('Gana', 'E', '🇬🇭'),
  ('Inglaterra', 'F', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'),
  ('Alemanha', 'F', '🇩🇪'),
  ('Dinamarca', 'F', '🇩🇰'),
  ('Irlanda', 'F', '🇮🇪'),
  ('Austrália', 'G', '🇦🇺'),
  ('Japão', 'G', '🇯🇵'),
  ('Coreia do Sul', 'G', '🇰🇷'),
  ('Iraque', 'G', '🇮🇶'),
  ('Uruguai', 'H', '🇺🇾'),
  ('Colômbia', 'H', '🇨🇴'),
  ('Equador', 'H', '🇪🇨'),
  ('Bolívia', 'H', '🇧🇴')
on conflict do nothing;

create or replace view public.ranking_bolao as
select
  participantes.bolao_id,
  participantes.user_id,
  participantes.nome_exibicao,
  coalesce(sum(palpites.pontos_ganhos), 0)::double precision as total_pontos,
  count(*) filter (where palpites.pontos_ganhos > 0)::integer as acertos
from public.participantes
left join public.palpites
  on palpites.bolao_id = participantes.bolao_id
 and palpites.user_id = participantes.user_id
group by participantes.bolao_id, participantes.user_id, participantes.nome_exibicao;

alter table public.boloes enable row level security;
alter table public.jogos enable row level security;
alter table public.participantes enable row level security;
alter table public.palpites enable row level security;

drop policy if exists "Boloes são públicos para leitura" on public.boloes;
create policy "Boloes são públicos para leitura"
  on public.boloes for select
  using (true);

drop policy if exists "Criadores autenticados podem criar bolões" on public.boloes;
create policy "Criadores autenticados podem criar bolões"
  on public.boloes for insert
  to authenticated
  with check (auth.uid() = criado_por);

drop policy if exists "Criadores podem atualizar seus bolões" on public.boloes;
create policy "Criadores podem atualizar seus bolões"
  on public.boloes for update
  to authenticated
  using (auth.uid() = criado_por)
  with check (auth.uid() = criado_por);

drop policy if exists "Criadores podem excluir seus bolões" on public.boloes;
create policy "Criadores podem excluir seus bolões"
  on public.boloes for delete
  to authenticated
  using (auth.uid() = criado_por);

drop policy if exists "Jogos são públicos para leitura" on public.jogos;
create policy "Jogos são públicos para leitura"
  on public.jogos for select
  using (true);

drop policy if exists "Criadores podem inserir jogos" on public.jogos;
create policy "Criadores podem inserir jogos"
  on public.jogos for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.boloes
      where boloes.id = jogos.bolao_id
        and boloes.criado_por = auth.uid()
    )
  );

drop policy if exists "Criadores podem atualizar jogos" on public.jogos;
create policy "Criadores podem atualizar jogos"
  on public.jogos for update
  to authenticated
  using (
    exists (
      select 1
      from public.boloes
      where boloes.id = jogos.bolao_id
        and boloes.criado_por = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.boloes
      where boloes.id = jogos.bolao_id
        and boloes.criado_por = auth.uid()
    )
  );

drop policy if exists "Criadores podem excluir jogos" on public.jogos;
create policy "Criadores podem excluir jogos"
  on public.jogos for delete
  to authenticated
  using (
    exists (
      select 1
      from public.boloes
      where boloes.id = jogos.bolao_id
        and boloes.criado_por = auth.uid()
    )
  );

drop policy if exists "Participantes são públicos para leitura" on public.participantes;
create policy "Participantes são públicos para leitura"
  on public.participantes for select
  using (true);

drop policy if exists "Usuários entram em bolões com o próprio id" on public.participantes;
create policy "Usuários entram em bolões com o próprio id"
  on public.participantes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Participantes podem atualizar seu nome" on public.participantes;
create policy "Participantes podem atualizar seu nome"
  on public.participantes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Usuários podem ler seus próprios palpites" on public.palpites;
create policy "Usuários podem ler seus próprios palpites"
  on public.palpites for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Usuários podem criar palpites antes do jogo" on public.palpites;
create policy "Usuários podem criar palpites antes do jogo"
  on public.palpites for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.participantes
      where participantes.bolao_id = palpites.bolao_id
        and participantes.user_id = palpites.user_id
    )
    and exists (
      select 1
      from public.jogos
      where jogos.id = palpites.jogo_id
        and jogos.encerrado = false
        and jogos.data_jogo > timezone('utc', now())
    )
  );

drop policy if exists "Usuários podem editar palpites antes do jogo" on public.palpites;
create policy "Usuários podem editar palpites antes do jogo"
  on public.palpites for update
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.jogos
      where jogos.id = palpites.jogo_id
        and jogos.encerrado = false
        and jogos.data_jogo > timezone('utc', now())
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.jogos
      where jogos.id = palpites.jogo_id
        and jogos.encerrado = false
        and jogos.data_jogo > timezone('utc', now())
    )
  );

create table if not exists public.times (
  id serial primary key,
  nome text not null,
  grupo text not null,
  bandeira_emoji text,
  created_at timestamptz default now()
);

alter table public.times enable row level security;

drop policy if exists "Times são públicos para leitura" on public.times;
create policy "Times são públicos para leitura" on public.times for select using (true);

truncate public.times restart identity;

insert into public.times (nome, grupo, bandeira_emoji) values
  ('México', 'A', '🇲🇽'),
  ('Coreia do Sul', 'A', '🇰🇷'),
  ('República Tcheca', 'A', '🇨🇿'),
  ('África do Sul', 'A', '🇿🇦'),
  ('Canadá', 'B', '🇨🇦'),
  ('Suíça', 'B', '🇨🇭'),
  ('Bósnia-Herzegóvina', 'B', '🇧🇦'),
  ('Catar', 'B', '🇶🇦'),
  ('Brasil', 'C', '🇧🇷'),
  ('Marrocos', 'C', '🇲🇦'),
  ('Escócia', 'C', '🏴'),
  ('Haiti', 'C', '🇭🇹'),
  ('Estados Unidos', 'D', '🇺🇸'),
  ('Turquia', 'D', '🇹🇷'),
  ('Austrália', 'D', '🇦🇺'),
  ('Paraguai', 'D', '🇵🇾'),
  ('Alemanha', 'E', '🇩🇪'),
  ('Equador', 'E', '🇪🇨'),
  ('Costa do Marfim', 'E', '🇨🇮'),
  ('Curaçau', 'E', '🇨🇼'),
  ('Holanda', 'F', '🇳🇱'),
  ('Japão', 'F', '🇯🇵'),
  ('Suécia', 'F', '🇸🇪'),
  ('Tunísia', 'F', '🇹🇳'),
  ('Bélgica', 'G', '🇧🇪'),
  ('Egito', 'G', '🇪🇬'),
  ('Irã', 'G', '🇮🇷'),
  ('Nova Zelândia', 'G', '🇳🇿'),
  ('Espanha', 'H', '🇪🇸'),
  ('Uruguai', 'H', '🇺🇾'),
  ('Arábia Saudita', 'H', '🇸🇦'),
  ('Cabo Verde', 'H', '🇨🇻'),
  ('França', 'I', '🇫🇷'),
  ('Noruega', 'I', '🇳🇴'),
  ('Senegal', 'I', '🇸🇳'),
  ('Iraque', 'I', '🇮🇶'),
  ('Argentina', 'J', '🇦🇷'),
  ('Áustria', 'J', '🇦🇹'),
  ('Argélia', 'J', '🇩🇿'),
  ('Jordânia', 'J', '🇯🇴'),
  ('Portugal', 'K', '🇵🇹'),
  ('Colômbia', 'K', '🇨🇴'),
  ('Uzbequistão', 'K', '🇺🇿'),
  ('República Democrática do Congo', 'K', '🇨🇩'),
  ('Inglaterra', 'L', '🏴'),
  ('Croácia', 'L', '🇭🇷'),
  ('Gana', 'L', '🇬🇭'),
  ('Panamá', 'L', '🇵🇦');

grant usage on schema public to anon, authenticated;
grant select on public.boloes to anon, authenticated;
grant select on public.jogos to anon, authenticated;
grant select on public.participantes to anon, authenticated;
grant select on public.ranking_bolao to anon, authenticated;
grant select on public.times to anon, authenticated;
grant insert, update, delete on public.boloes to authenticated;
grant insert, update, delete on public.jogos to authenticated;
grant insert, update on public.participantes to authenticated;
grant select, insert, update on public.palpites to authenticated;
