# 🔥 TubeBurner

**TubeBurner** is an ultra-minimal, 100% stateless React Native (Expo) utility designed to help you burn through your YouTube backlog and reach **Playlist Zero** by New Year's Eve (December 31st).

Instead of storing daily streaks, databases, or historical logs, TubeBurner uses **pure calendar-phase math**. Given only two inputs—your **current video count** and **the number of days left in the year**—it calculates a clean, bite-sized target ceiling to hit by midnight tonight.

---

## ✨ Features

* **🧠 Zero-Memory / Stateless Architecture:** No `AsyncStorage`, no databases, no sign-ups, and no tracking. Your target is a pure mathematical function of `(currentCount, daysAfterTonight)`.
* **🎯 Clean Multiples-of-5 Checkpoints:** Targets are snapped to clean multiples of `5` (when above 10 videos) and single-digit steps (for the final 10 videos) so your nightly goal always feels structured and achievable.
* **🔄 Live YouTube Data API v3 Sync:** Connect any Public or Unlisted YouTube playlist to pull your real-time video count with a single tap.
* **🎛️ Interactive Simulator Mode:** Test and use the tracker manually without an API key, complete with an optional **Advanced Day Simulator** to time-travel and preview how your targets shift as December 31st approaches.
* **🌑 Minimalist Dark UI:** High-contrast, distraction-free interface built for quick nightly check-ins on iOS, Android, and Web.

---

## 🧮 How the Math Works

Most habit or backlog trackers break if you miss a day or forget to log progress. TubeBurner solves this by constructing a dynamic **checkpoint ladder** every time you look at the screen:

1. **Final Countdown (`count <= 10`):** Exact 1-by-1 integer checkpoints anchored to the remaining days in the year.
2. **Gentle Pace (`count <= 5 × daysLeft`):** Rungs are spaced every `5` videos up to `5 × D`, allowing you to clear your backlog in clean 5-video sessions.
3. **High-Pace Phase-Shifted Bands (`count > 5 × daysLeft`):**
   * When your backlog requires watching more than 5 videos per day (e.g., `535` videos with `65` days left $\approx 8.2\text{ videos/day}$), you enter a higher pace band (`m = 2`, `3`, etc.) where the stride is `5 × m`.
   * Rungs inside each band are phase-shifted by `(daysLeft * 5) % stride`. As the calendar ticks down by 1 day, the entire checkpoint ladder shifts downward automatically—ensuring you never get stuck on yesterday's number, even with zero stored state.

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (LTS recommended)
* [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/tubeburner.git
   cd tubeburner
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   npx expo install lucide-react-native react-native-svg expo-status-bar
   ```

3. **Start the Expo development server:**
   ```bash
   npx expo start
   ```

4. **Run the app:**
   * Press `i` to open in the **iOS Simulator**
   * Press `a` to open in the **Android Emulator**
   * Press `w` to open in the **Web Browser**
   * Or scan the QR code using the **Expo Go** app on your phone.

---

## 🔑 Using the YouTube Data API v3 (Optional)

You can use TubeBurner immediately in **Simulator** mode. If you want live syncing with a YouTube playlist:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the **YouTube Data API v3**.
3. Generate an **API Key** under *Credentials*.
4. Create a **Public** or **Unlisted** playlist on YouTube for your backlog.
   > **Note:** YouTube's built-in `Watch Later (WL)` playlist is strictly private and inaccessible via public API keys. Move your backlog into a dedicated Unlisted or Public playlist to sync automatically.
5. In TubeBurner, tap **Source** → **YouTube API**, paste your API Key and Playlist URL/ID, and tap **Apply Source**.

---

## 🛠️ Tech Stack

* **[React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)** — Cross-platform native & web runtime
* **[TypeScript](https://www.typescriptlang.org/)** — Type-safe stateless calculations and UI
* **[Lucide React Native](https://lucide.dev/)** — Crisp minimalist iconography
* **YouTube Data API v3** — Live playlist item count fetching

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Because TubeBurner is designed around **strict minimalism and zero state**, please keep PRs focused on clarity, math refinements, or UI polish.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-improvement`)
3. Commit your changes (`git commit -m 'Add amazing improvement'`)
4. Push to the branch (`git push origin feature/amazing-improvement`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information
