# 🎓 Campus Connect — Setup Guide

A student campus management web application with dashboards, hackathons, teams, profiles, and notifications.

---

## 📁 Project Structure

```
campus-connect/
├── index.html        # The entire application (single-file SPA)
└── README.md         # This setup guide
```

---

## 🚀 Quick Start (3 ways)

### Option 1 — Python (Recommended, zero install)

**macOS / Linux:**
```bash
cd campus-connect
python3 -m http.server 3000
```

**Windows:**
```cmd
cd campus-connect
python -m http.server 3000
```

Then open your browser and go to:
```
http://localhost:3000
```

---

### Option 2 — Node.js (`npx serve`)

Requires Node.js installed — https://nodejs.org

```bash
cd campus-connect
npx serve . -p 3000
```

Then open:
```
http://localhost:3000
```

---

### Option 3 — VS Code Live Server

1. Open the `campus-connect` folder in **VS Code**
2. Install the **Live Server** extension (by Ritwick Dey)
3. Right-click `index.html` → **"Open with Live Server"**
4. Browser opens automatically at `http://127.0.0.1:5500`

---

## 🔐 Login Credentials

| Username       | Password  |
|----------------|-----------|
| `admin`        | `password`|
| `alex.johnson` | `password`|
| `alex.johnson` | `123456`  |

> You can also click **Sign Up** to create a new profile.

---

## 📱 Pages & Features

| Page            | Description                                               |
|-----------------|-----------------------------------------------------------|
| **Login**       | Credential-based sign in / sign up flow                   |
| **Dashboard**   | Overview cards, live navigable calendar, project scores   |
| **Hackathons**  | Filterable hackathon grid with skill-based search & join  |
| **Profile**     | Skills, completed projects, hackathon experience          |
| **Team**        | Create/join teams, member list, discussion forum          |
| **Notifications** | Activity feed, per-category notification toggles        |
| **Projects**    | Project cards with progress bars and scores               |
| **Clubs**       | Joinable campus clubs                                     |
| **Preferences** | Account settings and notification preferences             |

---

## 🎨 Tech Stack

- **Pure HTML / CSS / JavaScript** — no frameworks, no build step
- **Google Fonts** — DM Sans + Fraunces (loaded via CDN)
- **Unsplash** — placeholder images (loaded via CDN)
- **No npm install required**

---

## 🛠 Customisation

### Change the default user
In `index.html`, find the `currentUser` object near the top of the `<script>` tag:
```js
let currentUser = { name: 'Alex Johnson', initials: 'AJ' };
```

### Add more hackathons
Find the `<div id="hack-grid">` section and copy an existing `.hack-card` block:
```html
<div class="hack-card purple" data-skills="python,ai">
  <h3>Your Hackathon Title</h3>
  <p>Required Skills: Python, AI</p>
  <p>Team Size: 2-4 members</p>
  <button class="btn-join" onclick="openJoinModal('Your Hackathon Title')">Join</button>
</div>
```

### Add calendar events
Find the `events` object in the `<script>` tag:
```js
const events = {
  '4':  [{ text: 'Hackathon 1', sub: 'Team A 1PM' }],
  '10': [{ text: 'Profile Setup', sub: 'Team B 5PM' }],
  // Add more: '22': [{ text: 'My Event', sub: 'Details here' }]
};
```

### Change the colour scheme
Edit the CSS variables at the top of the `<style>` tag:
```css
:root {
  --purple: #b97cf8;        /* Primary accent colour */
  --purple-dark: #7c3aed;   /* Hover / active state */
  --sidebar-bg: #1c1b2e;    /* Sidebar background */
}
```

---

## 🌐 Deploying Online (optional)

### Netlify Drop (easiest)
1. Go to https://app.netlify.com/drop
2. Drag and drop the `campus-connect` folder
3. Your app is live in seconds — no account needed

### GitHub Pages
1. Push the folder to a GitHub repository
2. Go to **Settings → Pages → Source → main branch / root**
3. Access at `https://<your-username>.github.io/<repo-name>`

---

## 📋 Requirements

| Method         | Requirement                        |
|----------------|------------------------------------|
| Python server  | Python 3.x (pre-installed on macOS/Linux) |
| Node server    | Node.js 14+                        |
| VS Code        | Live Server extension              |
| Direct open    | Any modern browser (Chrome, Firefox, Safari, Edge) |

> **Note:** You can also just double-click `index.html` to open it directly in a browser, though some features (fonts, images) require an internet connection since they load from CDNs.

---

## 💡 Troubleshooting

**Port already in use?**
```bash
python3 -m http.server 8080   # try a different port
```

**Fonts not loading?**
Make sure you have an active internet connection — fonts are loaded from Google Fonts CDN.

**Images not showing?**
Images use Unsplash CDN links and require internet access. For offline use, replace the `src` URLs with local image paths.

---

*Built with ❤️ — Campus Connect v1.0*
