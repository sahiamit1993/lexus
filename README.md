# 🌌 LEXIS — Type to Defend the Galaxy

A fast-paced **typing shooter game** built with pure HTML, CSS, and Canvas 2D — no frameworks, no dependencies.

**[▶ Play Live](https://YOUR-USERNAME.github.io/lexis)**

---

## 🎮 How to Play

- Enemy ships descend toward your base — type their words to destroy them
- **Each correct keystroke fires an instant fire beam** — the letter is deleted on hit
- Miss too many ships and you lose a shield
- You have **3 shields** — lose them all and it's game over

### Controls
| Key | Action |
|-----|--------|
| Any letter | Fire at matching enemy |
| `Backspace` | Cancel current target |

---

## 🚀 Game Features

### Level System
Every **3 waves** = new level. Speed increases **+20% per level**.

| Level | Rank | Speed | Word Length |
|-------|------|-------|-------------|
| 1 | RECRUIT | 1.0× | 2–3 letters |
| 2 | CADET | 1.2× | 3–4 letters |
| 3 | PILOT | 1.4× | 4–5 letters |
| 4 | ACE | 1.6× | 5–6 letters |
| 5 | VETERAN | 1.8× | 6–7 letters |
| 6 | ELITE | 2.0× | 7–8 letters |
| 7 | COMMANDER | 2.2× | 8–9 letters |
| 8 | WARLORD | 2.4× | 9–10 letters |
| 9 | LEGEND | 2.6× | 10–12 letters |
| 10 | MYTHIC | 2.8× | 12+ letters |

### Word Pool
- **1000+ unique words** — no repeats within a single game
- Words scale from short (2-letter) to long (12+ letters) as you level up

### Scoring
- Base: `word_length × 12 × current_level`
- Combo bonus: `combo × 8` (activates after 2+ consecutive kills)

### Progress Tracking
- All runs saved to **localStorage** (browser on same device)
- **Progress chart** shown after every game — score trend, best score line, dots per game
- Stats tracked: Score · Wave · Rank · Words destroyed · Accuracy · Time

---

## 📁 File Structure

```
lexis/
├── index.html        # Game shell + HTML/CSS
├── game.js           # Core game engine
├── words.js          # Word pools by difficulty level
├── README.md         # This file
└── .github/
    └── workflows/
        └── deploy.yml  # Auto-deploy to GitHub Pages
```

---

## 🛠 Local Development

No build step needed. Just open `index.html` in a browser:

```bash
# Clone the repo
git clone https://github.com/YOUR-USERNAME/lexis.git
cd lexis

# Open directly
open index.html

# Or use a local server (recommended)
npx serve .
# or
python3 -m http.server 8080
```

---

## 🚀 Deploy to GitHub Pages

### Option A — Automatic (via GitHub Actions)

This repo includes a GitHub Actions workflow that auto-deploys on every push to `main`.

1. Push your code to GitHub
2. Go to **Settings → Pages**
3. Set source to **GitHub Actions**
4. Done — your game is live at `https://YOUR-USERNAME.github.io/lexis`

### Option B — Manual (one-time)

```bash
# Go to Settings → Pages → Source
# Select "Deploy from a branch"
# Choose: Branch = main, Folder = / (root)
# Save → live in ~60 seconds
```

---

## 🧠 Tech Stack

| Layer | Tech |
|-------|------|
| Rendering | HTML5 Canvas 2D |
| Logic | Vanilla JavaScript (ES6+) |
| Styling | Pure CSS |
| Storage | localStorage |
| Deploy | GitHub Pages + GitHub Actions |
| Dependencies | **None** |

---

## 📊 Progress Graph

After each game, LEXIS shows your full score history as a line chart:
- 📈 Green line = score per game
- 🟡 Gold dashed line = your all-time best
- 🔵 Last game dot highlighted
- Stored in browser localStorage — persists across sessions on the same device

---

## 📜 License

MIT — free to use, modify, and distribute.

---

*Built with ❤️ and keyboard fury.*
