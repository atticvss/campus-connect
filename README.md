# Campus Connect

Campus Connect is a browser-based campus networking app for students, clubs, projects, hackathons, teams, and profiles. The frontend is plain HTML/CSS/JavaScript, and the live app uses Supabase for authentication, profiles, and activity data.

## What It Does

- Email/password signup and login with Supabase
- Profile setup with role, registration number, department, skills, and bio
- Join and leave clubs
- Register and unregister for hackathons and projects
- Create teams and join teams
- Show hackathon cards with recruiting teams and open member slots
- Role-based management for clubs, projects, and hackathons

## Project Structure

```text
campus-connect/
├── index.html
├── README.md
├── IMPROVEMENTS.md
├── SUPABASE_SETUP.md
├── js/
│   ├── api.js
│   ├── app.supabase.js
│   ├── config.example.js
│   ├── config.js
│   └── supabaseClient.js
└── supabase/
    └── schema.sql
```

## Run Locally

### Option 1: Python

```bash
cd campus-connect
python3 -m http.server 3000
```

Open [http://localhost:3000](http://localhost:3000)

### Option 2: VS Code Live Server

1. Open the folder in VS Code
2. Start Live Server on `index.html`
3. Open the served URL in your browser

## Authentication

This project is intended to run with Supabase auth.

- Use your real Supabase account to sign in
- Use **Create Account** to register a new account
- If an email already exists, the app now tells the user to sign in instead

Fallback demo login is still available only for static/admin testing:

| Username | Password |
|----------|----------|
| `admin` | `password` |
| `club.admin` | `password` |

## Supabase Setup

1. Create a Supabase project
2. Run `supabase/schema.sql` in the Supabase SQL Editor
3. In Supabase Auth, enable Email provider
4. For easier testing, keep email auto-confirm enabled or disable email confirmation
5. Put your project URL and anon key in `js/config.js`

Example:

```js
window.CAMPUS_CONNECT_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

For full setup details, see [SUPABASE_SETUP.md](/Users/avibhargava/Desktop/FullStacks/campus-connect/SUPABASE_SETUP.md).

## Roles

Supported profile roles:

- `student`
- `faculty`
- `club_admin`

Admin-only hackathon management uses Supabase auth metadata:

```json
{
  "role": "admin"
}
```

## Team and Hackathon Flow

- Teams can be created with a hackathon tag, max member count, and skill tags
- Team cards show current member count and whether the team still needs members
- Hackathon cards surface recruiting teams so students can directly join them
- Registration and duplicate handling are wired for Supabase-backed data

## Main Files

- [index.html](/Users/avibhargava/Desktop/FullStacks/campus-connect/index.html): base UI, layout, shared styles, and fallback logic
- [js/app.supabase.js](/Users/avibhargava/Desktop/FullStacks/campus-connect/js/app.supabase.js): live Supabase auth and UI rendering
- [js/api.js](/Users/avibhargava/Desktop/FullStacks/campus-connect/js/api.js): Supabase API calls and error handling
- [supabase/schema.sql](/Users/avibhargava/Desktop/FullStacks/campus-connect/supabase/schema.sql): database schema, indexes, and RLS policies

## Notes

- No build step is required
- Fonts and some assets load from CDNs
- Never put a Supabase `service_role` key in frontend code
- If the schema is missing, run `supabase/schema.sql` and refresh
