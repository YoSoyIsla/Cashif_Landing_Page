# Framer Landing Page Copy

Exact clone and replica of the Framer landing page:
**Original URL:** [https://humble-presentation-759960.framer.app/](https://humble-presentation-759960.framer.app/)

---

## 🚀 How to Run & Build Locally

### 1. Run the Development Server (Recommended)
```bash
npm start
# or
npm run dev
# or
node server.js
```
Then open [http://localhost:3000](http://localhost:3000) in your web browser.

### 2. Build for Production
To create a standalone production bundle in `dist/`:
```bash
npm run build
```
This produces a self-contained, 100% offline-capable distribution folder in `dist/`.

### 3. Direct browser access
Open `index.html` or `dist/index.html` directly in any modern web browser or live server.

---

## 📁 Project Structure

```text
├── index.html           # Clean, semantic HTML5 structure with 6-column grid layout
├── style.css            # Modular vanilla CSS design system & 6-column desktop architecture
├── main.js              # Lightweight vanilla JS for mobile menu & 6-col grid overlay
├── build.js             # Standalone production builder script (outputs to dist/)
├── package.json         # Package configuration with start/dev/build scripts
├── server.js            # Zero-dependency local dev server
├── README.md            # Documentation and instructions
├── dist/                # Production distribution output
└── assets/
    ├── images/          # All 23 original high-res SVG logos, cards, and UI images
    ├── fonts/           # Google Figtree and Inter WOFF2 fonts self-hosted locally
    └── media/           # Hero MP4 background video and poster image
```

---

## 🎨 Content & Features Included

- **Header / Navigation:** Sticky glassmorphism nav with Cashif logo, navigation links (*Şirket*, *Uyguluma*, *İletişim*, *Kayıt Ol*), and CTA button (*Uygulamayı İndir*).
- **Hero Section:** *"Finansta kaybolma, cashif’le keşfet."* with CTA buttons and interactive hero card media.
- **Partners / Ecosystem Logos:** Biruni Teknopark, İstanbul Büyükşehir Belediyesi (İBB), Bilgiyi Ticarileştirme Merkezi (BTM), Tech İstanbul.
- **Platform Features & Overviews:** Interactive card showcase, micro-interactions, responsive variants.
- **Customer Stories:** Coinbase story, Qatar Airways, Alibaba.com, and Bilt Card.
- **Responsive Layout:** Tailored layouts for Desktop, Tablet, and Mobile devices.
