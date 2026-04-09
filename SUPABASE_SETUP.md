# Campus Connect + Supabase Integration

This project keeps your existing plain HTML/CSS/JS frontend and connects it to Supabase.

## 1. Files Added

- `supabase/schema.sql`: PostgreSQL schema + RLS policies
- `js/config.js`: Supabase URL + anon key (replace placeholders)
- `js/config.example.js`: Reference config template
- `js/supabaseClient.js`: Supabase client initialization
- `js/api.js`: Data/auth API functions
- `js/app.supabase.js`: UI wiring and page integration

## 2. Supabase Setup

1. Create a new Supabase project.
2. Go to SQL Editor and run `supabase/schema.sql`.
3. In Authentication:
   - Enable Email provider.
   - Disable "Confirm email" for easiest local testing (optional).
4. Copy Project URL + anon key from Project Settings > API.
5. Update `js/config.js`:

```js
window.CAMPUS_CONNECT_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

## 3. Role Notes

The `profiles.role` column supports:
- `student`
- `faculty`
- `club_admin`

Admin-only hackathon management uses Supabase Auth metadata:

```json
{
  "role": "admin"
}
```

Set this in a user's `raw_app_meta_data` from Supabase dashboard/admin APIs.

## 4. What the App Now Does

### Auth
- Signup with email/password (`supabase.auth.signUp`)
- Login with email/password (`supabase.auth.signInWithPassword`)
- Logout (`supabase.auth.signOut`)
- Session restore on reload (`supabase.auth.getSession`)

### Profile
After authentication, profile setup stores:
- `full_name`
- `dob`
- `role`
- `registration_number`

### Data Features
- View clubs/projects/hackathons
- Join/leave clubs (`memberships`)
- Register/unregister project/hackathon (`registrations`)
- Dashboard fetches joined clubs + registered events

### Role-Based Management
- `club_admin`: create/edit/delete clubs
- `faculty`: create/edit/delete projects
- `admin` metadata user: create/edit/delete hackathons

## 5. Example API Calls (Supabase JS)

### Signup
```js
await supabase.auth.signUp({
  email: 'user@campus.edu',
  password: 'StrongPass123!'
});
```

### Login
```js
await supabase.auth.signInWithPassword({
  email: 'user@campus.edu',
  password: 'StrongPass123!'
});
```

### Save Profile
```js
await supabase.from('profiles').upsert({
  id: user.id,
  full_name: 'Alex Johnson',
  dob: '2004-02-10',
  role: 'student',
  registration_number: '2024CS001'
}, { onConflict: 'id' });
```

### Join Club
```js
await supabase.from('memberships').upsert({
  user_id: user.id,
  club_id: 1
}, { onConflict: 'user_id,club_id' });
```

### Leave Club
```js
await supabase.from('memberships')
  .delete()
  .eq('user_id', user.id)
  .eq('club_id', 1);
```

### Register Hackathon
```js
await supabase.from('registrations').upsert({
  user_id: user.id,
  hackathon_id: 3,
  project_id: null
}, { onConflict: 'user_id,hackathon_id' });
```

### Register Project
```js
await supabase.from('registrations').upsert({
  user_id: user.id,
  project_id: 7,
  hackathon_id: null
}, { onConflict: 'user_id,project_id' });
```

### Fetch Dashboard Data
```js
const { data: joinedClubs } = await supabase
  .from('memberships')
  .select('club_id, clubs(id, name)')
  .eq('user_id', user.id);

const { data: registrations } = await supabase
  .from('registrations')
  .select('project_id, hackathon_id, projects(id, title), hackathons(id, title, date)')
  .eq('user_id', user.id);
```

## 6. Run Locally

From project root:

```bash
python3 -m http.server 3000
```

Open:

```text
http://localhost:3000
```

## 7. Important Security Reminder

- Use only the `anon` key in frontend.
- Never place Supabase `service_role` key in browser code.
- RLS policies in `supabase/schema.sql` are required for safe client-side access.
