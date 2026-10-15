# LinkPulse: URL Shortener & Analytics Platform
> **An Integrated Link Management, Redirection, and Analytics Platform**  
> *Built for Hackathon 2026*

---

## 🌟 Executive Overview

**LinkPulse** is an enterprise-grade URL shortening, routing, and analytics platform designed to solve the real-world operational challenges of marketing, growth, and security teams. Unlike traditional "paste a URL, get a short code" tools, LinkPulse places the **Link Record as the central hub** of an interconnected ecosystem:
- **Campaigns & Workspaces**: Structured organization by team, folder, and marketing initiative.
- **Intelligent Redirect Rules**: Strict evaluation of active status, expiration dates, click limit caps, password challenges, and device-specific routing (Mobile & Tablet).
- **Non-Blocking Telemetry**: Asynchronous click logging that captures timestamp, country, city, IP, device, browser, OS, referrer, and QR scans while filtering bot crawlers.
- **QR Code Studio & Bulk CSV Import**: Customized QR generation with scan tagging, alongside CSV bulk import featuring dry-run pre-validation.
- **Link-in-Bio Social Pages**: Mobile-first landing pages with real-time interactive iPhone mockup preview.
- **Abuse Monitoring & Platform Governance**: Domain safety blocklist with auto-quarantine and 1-click administrative link takedowns.

LinkPulse is built with an **Express 5 & MongoDB (Mongoose ODM)** backend and a **React SPA (Vite, Lucide Icons, Glassmorphism)** frontend, serving live data on `http://localhost:5000`.

---

## 🚀 Complete Feature Specification

### 1. ⚡ High-Speed Redirection Engine (`/:code`, `/r/:code`, `/s/:code`)
Redirects execute via HTTP `302`/`307`, while click events are logged asynchronously via `setImmediate` so redirect latency remains instantaneous. The engine enforces the following rule precedence:
1. **Link Existence Check**: 404 Not Found if link does not exist.
2. **Abuse & Security Check**: 410 Link Suspended if flagged by admin or mapped to a blocked domain.
3. **Link Status Check**: 403 Link Paused if temporarily deactivated by creator.
4. **Expiration Date Check**: 410 Link Expired if current timestamp exceeds `expires_at`.
5. **Visit Cap / Click Limit**: 410 Click Cap Reached if total visits reach `click_limit`.
6. **Password Gate**: 401 Protected with an HTML/CSS unlock screen (unlocks via SHA-256 hash & sets an HTTP-only session cookie).
7. **Smart Device Routing**: Inspects client User-Agent; routes mobile visitors to `mobile_url` (e.g. App Store), tablets to `tablet_url`, or falls back to `original_url`.
8. **UTM Parameter Forwarding**: Preserves or automatically injects configured campaign UTM parameters.

### 2. 📊 Live Telemetry & Analytics Dashboard
- **Period Filtering**: View metrics across `Today (24h)`, `Last 7 Days`, `Last 30 Days`, or `All Time`.
- **Campaign & Workspace Scoping**: Isolate telemetry by specific campaigns or workspaces.
- **Key Metrics**: Total Tracked Visits, Human Visits, Filtered Bots, Unique Visitors, QR Scans, and Active Links.
- **Link Alerts & Health Center**: Real-time diagnostic alerts for links near visit caps, expiring within 72 hours, suspended links, and bot traffic spikes.
- **Interactive Visualizations**:
  - **Click Trajectory**: Smooth SVG line chart with date/hour tooltips.
  - **Device Breakdown**: Donut meters for Desktop vs. Mobile vs. Tablet distribution.
  - **Traffic Sources & Referrers**: Ranked origins (Direct, Search, Social, Email).
  - **Geographic Distribution**: Top countries with regional flag emojis and city breakdowns.
  - **Browser & OS Matrix**: Distribution across Chrome, Safari, Firefox, Edge, Windows, macOS, iOS, Android.
  - **Live Click Stream Feed**: Chronological feed with animated live ping dots.

### 3. 🪄 2-Step Link Creation Wizard
- **Step 1: Destination & Alias Validation**:
  - Live debounce validation checking RFC protocol compliance (`http://` / `https://`).
  - Redirect loop protection (cannot point back to self).
  - Unsafe domain check against platform safety blocklist.
  - Custom alias uniqueness check with real-time feedback (or 1-click collision-free auto-generation).
- **Step 2: Intelligent Redirection Rules**:
  - Expiry schedule date/time picker.
  - Visit cap / click limit configuration.
  - Password protection toggle with key entry.
  - Device routing override URLs (Mobile & Tablet).
  - Campaign assignment and removable tag chips.
  - Celebratory confetti animation upon creation.

### 4. 📱 Dynamic QR Code Studio
- Generate downloadable vector (`SVG`) or raster (`PNG`) QR codes.
- Customizable foreground/background color palettes (Indigo Pulse, Cyber Violet, Dark Mode Invert, etc.).
- Configurable error correction levels (`L`, `M`, `Q`, `H`).
- **Automated Scan Telemetry**: Automatically appends `?qr=1` so physical scans are differentiated from direct browser visits in analytics.

### 5. 📥 Bulk CSV Import with Dry-Run Validation
- Supports file upload (`.csv`) or raw spreadsheet text pasting.
- **Pre-Validation Engine**: Evaluates each row without modifying the database.
- Diagnostics identify and isolate:
  - Malformed URLs
  - Domain blocklist matches
  - Duplicate aliases within the file
  - Alias collisions with existing links in the database
- **One-Click Batch Execution**: Commits all valid links in a single database transaction.

### 6. 🌟 Link-in-Bio Landing Page Builder (`/bio/:slug`)
- Multi-link social landing page builder (e.g. `/bio/alex-growth`).
- Visual profile editor for avatar, display name, bio, links with subtitles, and social channels.
- **Live Mobile Mockup Preview**: Side-by-side interactive smartphone mockup updating in real time.
- Standalone responsive public landing page accessible to any visitor.

### 7. 🛡️ Abuse Monitoring & Platform Governance (`Admin`)
- **Domain Safety Blocklist**: Add malicious domains with rationale (e.g. phishing, fraud).
- **Automatic Quarantine**: Adding a blocked domain immediately disables all existing active links pointing to it.
- **Immediate Link Takedown**: Admins can suspend any suspicious short link platform-wide with an audit reason.
- **Link Restoration**: 1-click restore for false positives.
- **User Governance**: Inspect platform user accounts, email addresses, roles, and link volumes.
- **Preserved Analytics**: Expired or disabled links maintain full historical analytics for reporting.

### 8. ⚙️ Workspaces, Folders & Settings
- **Workspaces & Folders**: Organize links by department, team, or client.
- **Platform Configuration**: Manage rate limits, safe browsing rules, and database engine telemetry.

### 9. 👥 Multi-Persona Role Switcher
Header toggle allows switching between:
- **`[👤 User]`**: Creator view managing personal links, campaigns, bio, and analytics.
- **`[🛡️ Admin]`**: Full platform view, abuse monitoring, blocklist governance, user accounts, and system-wide audits.
- **`[🌐 Visitor]`**: Anonymous portal for testing password verification screens, scenario cards, and public bio pages.

---

## 🏃 Quick Start & Running Locally

The full stack runs on **port 5000** (Express serves both APIs, redirection routes, and the built React frontend).

### Start the Server:
```bash
# In the repository root:
node server/server.js
```
Open your browser to: **`http://localhost:5000`**

### (Optional) Development Mode with Vite Hot-Reload:
```bash
# Terminal 1: Backend API
node server/server.js

# Terminal 2: Vite Dev Server with proxy to port 5000
cd client
npm run dev
```

---

## 🎬 5-Minute Walkthrough Demo Scenarios

Click the **"⚡ Walkthrough"** button in the header for interactive guidance:

### Scenario 1: Link Creation to Real-Time Analytics
1. Navigate to `http://localhost:5000`.
2. Click **"+ New Link"** in the top navigation.
3. Enter destination URL: `https://news.ycombinator.com`.
4. Uncheck *"Auto-generate unique code"* and enter custom alias: `hn-tech`. Notice the real-time green availability checkmark.
5. Click **"Next: Set Rules"**.
6. Toggle **"Visit Cap / Click Limit"** on and enter `100`. Add tag `news`.
7. Click **"Create & Publish Link"** (Confetti fires and success toast appears).
8. In the **Links Hub**, click the **Test Redirect** button next to `/hn-tech`. The engine immediately redirects you to Hacker News.
9. Return to the **Analytics** tab or click **"Simulate"** in the navbar: trigger a mobile visit from Germany. Observe the live click stream and KPI counters increment in real time!

### Scenario 2: Bulk CSV Import to Administrative Link Disable
1. In the top navigation, click **"Bulk Import"**.
2. Click **"Load Test CSV Sample"**.
3. Click **"Run Dry-Run Pre-Validation"**.
4. Observe the validation table:
   - Valid rows receive green `Ready to Import` badges.
   - `phish-link` is rejected because it matches a blocked domain.
   - `summer26` is rejected because it collides with an existing alias.
5. Click **"Import Valid Links"** to batch import.
6. In the header role switcher, select **`[🛡️ Admin]`**.
7. Click the **"Abuse & Safety"** tab.
8. Under **"Domain Safety Blocklist"**, enter `bad-domain.xyz` and click **"Block Domain & Quarantine Links"**.
9. Notice the immediate quarantine confirmation and updated security audit metrics.

---

## 📚 Seed Data Pre-Loaded Links

| Short Code | Link Title | Characteristics |
|---|---|---|
| `/summer26` | Summer 2026 Product Showcase | Popular active link with 140+ historical clicks, UTM tracking |
| `/vip-deck` | VIP Investor Pitch Deck | **Password protected** (Password: `pulse2026`) |
| `/get-app` | LinkPulse Mobile App | **Device-targeted** (iOS/Android $\to$ App Store; Desktop $\to$ Web) |
| `/early50` | Limited Beta Access | **Click capped** at 50 visits (Cap exhausted $\to$ 410 Notice) |
| `/summit-early` | Early Bird Conference Tickets | **Expired link** (Expired 2 days ago $\to$ 410 Notice) |
| `/free-eth` | Crypto Giveaway | **Admin suspended** for abuse / phishing match |
| `/keynote` | Tech Keynote Live Stream | 115+ visits across global regions |
| `/bio/alex-growth` | Alex Rivera Bio Page | Public multi-link landing page with social channels |

---

## 🔮 Future Roadmap

- [ ] **Custom Branded Domains (CNAME / SSL)**: Support for custom domain mapping (e.g. `go.company.com`) with automated Let's Encrypt certificates.
- [ ] **Geo-Fencing & Localization**: Route visitors to language-specific destinations based on ISO country codes.
- [ ] **Public Developer API & Webhooks**: OpenAPI/Swagger documentation with HMAC-authenticated webhooks on click events.
- [ ] **A/B Destination Split Testing**: Dynamic traffic percentage splits across multiple URLs to measure conversion efficacy.
- [ ] **Team Workspaces & RBAC**: Fine-grained team member invitations with Role-Based Access Control per workspace.
