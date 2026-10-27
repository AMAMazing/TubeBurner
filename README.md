# TubeBurner 🔥

> **Tame your massive YouTube backlog with absolute minimalism.**

TubeBurner is an open-source, mobile-first web app that tracks and burns down runaway YouTube playlists using clean pacing algorithms. Designed with a sleek, 2026-era glassmorphic interface, it stays out of your way while keeping you on target.

**Live Web App:** [https://tubeburner.vercel.app/](https://tubeburner.vercel.app/)

---

## ⚡ Core Philosophy & Architecture

1. **Sleek & Minimalist Design:**
   Inspired by modern ultra-minimal UI guidelines. Deep blacks, subtle transparency, and absolutely no unnecessary bloat. Just you and your progress.
2. **Zero Database / Zero Backend Lock-in:**  
   TubeBurner has no database or external servers. All user configurations and API keys are stored strictly on your local device via client-side storage.
3. **Official YouTube API v3 Integration:**  
   Queries playlist sizes in milliseconds using a single quota unit. Features an automatic 60-second client-side cache to protect your daily quota.
4. **Dual Pacing Engine:**  
   Choose between daily habits or batch weekend triaging, backed by real-time target year feasibility projections.

---

## 🎯 The Dual Pacing Engine

TubeBurner normalizes time to your **local midnight** (`12:00 AM local time`) so pacing ceilings roll over cleanly every day.

### Mode 1: Daily Burn (e.g., 10 videos/day)
- Calculates a steady daily descending threshold:  
  `targetCount = Math.max(0, startCount - ((daysElapsed + 1) * burnRate))`
- At midnight, the required playlist ceiling drops by your daily burn rate.

### Mode 2: Weekly Sprint (e.g., 50 videos/week)
- Perfect for weekend batchers and triagers:  
  `targetCount = Math.max(0, startCount - ((weeksElapsed + 1) * burnRate))`
- Includes a **Daily Mid-Week Pacing Guide** showing where you should be today to maintain an even cadence throughout the 7-day sprint.

### Target Year Feasibility Check
- TubeBurner projects your exact finish date based on current velocity.
- If you are on track to finish before December 31 of your target year, you'll see a green celebration badge.
- If you fall behind, TubeBurner calculates the exact adjusted burn rate required to finish on time.

---

## ⚠️ Important: YouTube Watch Later (`WL`) Limitation

> **Why you cannot use your default 'Watch Later' playlist directly:**

Google's official YouTube Data API strictly blocks access to the special `WL` (Watch Later) playlist for third-party privacy reasons.

### 💡 10-Second Workaround:
1. Open YouTube on your browser or mobile app.
2. Create a new playlist (e.g., **"Burn Queue"** or **"Watch Next"**).
3. Set visibility to **Unlisted** or **Public**.
4. In your Watch Later playlist, tap the three dots (`⋮`) or select all videos and choose **"Add all to..." -> "Burn Queue"**.
5. Paste your playlist link or ID (`PL...`) into TubeBurner's Configuration screen.

---

## 🔑 Getting a Free YouTube Data API v3 Key (2 Minutes)

TubeBurner runs directly in your browser and talks directly to Google's API:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "TubeBurner Personal").
3. In the sidebar, navigate to **APIs & Services > Library**.
4. Search for **YouTube Data API v3** and click **Enable**.
5. Navigate to **APIs & Services > Credentials** and click **+ Create Credentials > API Key**.
6. *(Optional but recommended)* Restrict the key to the YouTube Data API v3.
7. Copy the key and paste it into TubeBurner's **Settings** screen.

*Note: YouTube provides 10,000 free quota units per day. TubeBurner only uses 1 unit per playlist check and caches responses for 60 seconds.*

---

## 💻 Local Development

TubeBurner is built using **Expo SDK 52**, **Expo Router**, **React Native for Web**, and **lucide-react-native**.

### 1. Clone & Install
```bash
git clone https://github.com/AMAMazing/TubeBurner.git
cd TubeBurner
npm install
```

### 2. Run Locally in Web Mode
```bash
npx expo start --web
```
Open your browser at `http://localhost:8081`.

### 3. Build Static Web Distribution
```bash
npm run build
```
Compiles the static export into the `dist/` directory.

---

## 🚀 1-Click Deployment to Vercel

TubeBurner includes a native `vercel.json` configured for Expo Web static routing.

1. Push your repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Vercel will automatically detect `vercel.json`:
   - **Build Command:** `npx expo export -p web`
   - **Output Directory:** `dist`
4. Click **Deploy**.

---

## 📄 License

MIT © TubeBurner Contributors.
