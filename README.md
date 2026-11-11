# Luna's World — Author Website

An immersive, 3D-enhanced static author website for **G Daffini Shiyalin (Luna)** featuring a glowing Three.js crescent moon & starfield, smooth Lenis scrolling, GSAP ScrollTrigger choreography, and interactive poetry & works showcases. Built with plain HTML, CSS, and modular JavaScript—no build step or server required, ready for GitHub Pages.

## File Structure

```text
.
├── index.html                 # Main landing page (#home, #poetry, #works, #contact)
├── css/
│   └── style.css              # Modular stylesheet (variables, layout, 3D tilt, responsive rules)
├── js/
│   ├── three-scene.js         # Three.js hero crescent moon, starfield, & poetry background 3D
│   ├── animations.js          # Lenis smooth scroll, GSAP ScrollTrigger timelines, 3D cover tilt
│   └── main.js                # Preloader, navbar & scroll progress, mailto form, Astra chat, sparkle trail
├── theme.js                   # Light/dark theme switcher & persistence
├── theme.css                  # Dark theme color overrides
├── poem-01.html               # Entry 01 — Do You Hate the Rain, Too?
├── poem-02.html               # Entry 02 — A Love That Was Never Heard
├── poem-03.html               # Entry 03 — Eighteen
├── poem-04.html               # Entry 04 — Mellow Glow From Within
├── warmth-that-burned.html    # Entry 05 — Warmth that burned
├── whispers-of-earth.html     # Entry 06 — Whispers of Earth
├── poem-07.html               # Entry 07 — Scars That Shine
└── README.md
```

## Adjusting Animation Speeds & Styles

1. **CSS Durations, Easing & Colors** (`css/style.css`):
   Edit the `:root` custom properties at the top of `css/style.css`:
   - `--bg-cream`: `#f2f1e8` (main cream background)
   - `--dur-fast`, `--dur-med`, `--dur-slow`: UI hover, reveal, and transition durations
   - `--dur-float`, `--dur-ken-burns`: floating hero accent & poem image drift speed
   - `--ease-dreamy`: cubic-bezier curve for calm, floaty entrances

2. **Scroll & Timeline Pacing** (`js/animations.js`):
   Edit `MOTION_CONFIG` at the top of `js/animations.js`:
   - `lenisDuration`: smooth scroll inertia duration (default `1.25`)
   - `heroStagger`, `heroDuration`: hero text reveal timing
   - `noteWordStagger`: word-by-word reveal speed in "A note from Luna"
   - `cardDuration`: Poetry & Works card entrance duration
   - `tiltMaxDeg`: maximum 3D tilt angle on "The Hidden Bloodline" cover

## Adjusting the 3D Scene

Edit `SCENE_CONFIG` at the top of `js/three-scene.js`:
- `desktopStarCount` / `mobileStarCount`: particle counts (default `1200` desktop / `450` mobile)
- `maxPixelRatio`: capped at `2` for crisp performance
- `moonFloatAmp` / `moonFloatSpeed`: vertical bobbing amplitude and speed of the 3D crescent moon
- `moonSpinSpeed`: slow rotation speed of the crescent moon
- `mouseParallaxStrength`: camera sway responsiveness to cursor movement
- `poetryElementOpacity`: subtlety of the background 3D book/pages/quill in `#poetry`

## Local Preview & Deployment (GitHub Pages)

- **Local preview**: Run any static server in the project folder:
  ```bash
  python3 -m http.server 8000
  ```
  Then open `http://localhost:8000`.

- **Deploy to GitHub Pages**:
  1. Commit and push all files to your `luna-website` GitHub repository (`main` branch).
  2. In GitHub **Settings → Pages**, set **Source** to **Deploy from a branch**, select `main` / `/ (root)`, and save.
  3. Your site will be live at `https://<username>.github.io/luna-website/` with zero build steps.

