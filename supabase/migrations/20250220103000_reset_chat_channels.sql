-- Reset chat channels to enforce the new private/role-based structure
begin;

delete from public.chat_messages;
delete from public.chat_channels;

insert into public.chat_channels (id, name, slug, description, is_private)
values
  ('11111111-2222-4333-8444-aaaaaaaaaaa0', 'Geral', 'geral', 'Canal aberto para toda a equipa', false),
  ('11111111-2222-4333-8444-aaaaaaaaaaa1', 'CEOs', 'ceos', 'Canal exclusivo para Luís Nicolau e João Milhazes', true),
  ('11111111-2222-4333-8444-aaaaaaaaaaa2', 'C-Level', 'c-level', 'Alinhamento estratégico (Luís, João, Afonso)', true);

commit;

