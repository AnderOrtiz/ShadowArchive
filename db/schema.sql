-- Shadow Archive: datos del usuario (el catálogo de cartas NO vive aquí).
-- Cada fila pertenece a un usuario (owner_id = auth.user_id()) y RLS lo aplica.
-- Sincronización last-write-wins: updated_at (ms) decide; deleted = borrado lógico.

create table if not exists decks (
  id uuid not null,
  owner_id text not null default auth.user_id(),
  name text not null,
  created_at bigint not null,
  updated_at bigint not null,
  deleted boolean not null default false,
  primary key (owner_id, id)
);

create table if not exists deck_cards (
  owner_id text not null default auth.user_id(),
  deck_id uuid not null,
  card_id integer not null,
  zone text not null check (zone in ('main','extra','side')),
  qty integer not null check (qty >= 0),
  updated_at bigint not null,
  deleted boolean not null default false,
  primary key (owner_id, deck_id, card_id, zone)
);

create table if not exists tags (
  id uuid not null,
  owner_id text not null default auth.user_id(),
  name text not null,
  color text not null,
  updated_at bigint not null,
  deleted boolean not null default false,
  primary key (owner_id, id)
);

create table if not exists card_tags (
  owner_id text not null default auth.user_id(),
  card_id integer not null,
  tag_id uuid not null,
  updated_at bigint not null,
  deleted boolean not null default false,
  primary key (owner_id, card_id, tag_id)
);

create table if not exists lists (
  owner_id text not null default auth.user_id(),
  card_id integer not null,
  list text not null check (list in ('favorite','wishlist')),
  updated_at bigint not null,
  deleted boolean not null default false,
  primary key (owner_id, card_id, list)
);

create table if not exists card_notes (
  owner_id text not null default auth.user_id(),
  card_id integer not null,
  content text not null,
  updated_at bigint not null,
  deleted boolean not null default false,
  primary key (owner_id, card_id)
);

do $$
declare t text;
begin
  foreach t in array array['decks','deck_cards','tags','card_tags','lists','card_notes'] loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on %I from anonymous', t);
    execute format('grant select, insert, update, delete on %I to authenticated', t);
    execute format('drop policy if exists owner_all on %I', t);
    execute format(
      'create policy owner_all on %I as permissive for all to authenticated
         using ((select auth.user_id()) = owner_id)
         with check ((select auth.user_id()) = owner_id)', t);
  end loop;
end $$;
