# Nikufra CRM – Security Overview (Dev Snapshot)

This repository currently runs in a dev-friendly mode (anonymous Supabase access + local profile switcher). The following guardrails are now in place:

## What is implemented

- **Profile gate + per-user passwords** — every collaborator must select a profile and unlock it before accessing the app.
- **Private chat membership** — sensitive channels (CEOs, C-Level, custom private channels) are now backed by a `chat_channel_members` table. Only the selected members can fetch and join those conversations.
- **Task deletion audit** — users can remove their own calendar tasks directly in the UI, reducing dangling data.

## Immediate next steps

1. **Supabase Auth for collaborators** – replace the local profile gate with real Supabase authentication so RLS can protect data server-side.
2. **Row Level Security** – once Auth is active, enable per-table RLS policies (leads, tasks, activities, chat tables). Each policy should tie `created_by` / `owner_id` to `auth.uid()`.
3. **Secrets management** – keep all API keys in `.env` + `.cursor/mcp.json` and rotate regularly. Never commit service role keys.
4. **Edge Function hardening** – validate payloads, add structured logging, and deploy the automation function behind Supabase secrets instead of local environment variables.
5. **Vulnerability monitoring** – run `npm audit` (or a Dependabot-equivalent) weekly and patch critical findings immediately.

Track these tasks in the backlog so the CRM can move from prototype mode to a hardened production tier. Let me know when you're ready to implement each step and I'll help wire it up.***


