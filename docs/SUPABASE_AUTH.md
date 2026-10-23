# Supabase authentication and user storage

## What is connected

The workspace includes `.vscode/mcp.json` with an HTTP Supabase MCP server entry
for the configured project. That file provides the editor/MCP connection details;
it does not itself apply database migrations or change application behavior.

This CLI session can inspect the repository configuration, but it does not expose a
live Supabase MCP tool, so a successful MCP handshake and the current production row
count must be verified from the connected editor or Supabase dashboard.

## Authentication flow

1. `frontend/src/context/AuthContext.tsx` calls `supabase.auth.signUp()` with the
   user's email, password, phone, name, and terms metadata.
2. Supabase Auth stores the account in the protected `auth.users` table. Supabase
   owns password hashing, sessions, access tokens, and refresh tokens.
3. The `sync_auth_user_profile` trigger in
   `supabase/migrations/20261023000000_auth_profile_sync.sql` creates or updates one
   `public.profiles` row for the Auth user.
4. On a successful sign-in, Supabase updates `auth.users.last_sign_in_at`; the same
   trigger mirrors that timestamp to `public.profiles.last_login_at`.
5. The frontend reads the signed-in user's own profile through RLS. Backend/admin
   operations use the service-role client only on the server.

## What is stored

`public.profiles` stores non-secret account metadata:

- Auth user ID
- email (or a non-contact placeholder for phone-only accounts)
- phone/mobile number when supplied
- name and preferred currency
- terms acceptance metadata
- phone verification state
- latest login timestamp

Passwords, password hashes, access tokens, refresh tokens, and service-role keys are
never copied into `public` tables or frontend storage.

The profile RLS policy allows a user to read or manage only their own profile. To
review every account, use the Supabase dashboard/SQL editor or a server-side
service-role query; do not loosen the browser policy to expose all users.

## Apply and verify

Apply the migration through the connected Supabase MCP workflow or the normal
Supabase migration process. Do not use `supabase db reset` against a shared/production
project.

After applying it, an administrator can verify the setup in the SQL editor with:

```sql
select id, email, phone, full_name, terms_accepted, last_login_at
from public.profiles
order by created_at desc;

select id, email, phone, created_at, last_sign_in_at
from auth.users
order by created_at desc;
```

If the frontend has no real `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, it
intentionally runs in demo mode and does not write accounts to Supabase. Real user
storage requires those environment variables plus the applied migration.
