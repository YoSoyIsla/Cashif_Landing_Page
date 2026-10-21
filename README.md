# cashif Landing Page

Pre-launch landing page and waitlist for cashif. Zero-dependency vanilla HTML, CSS and JS.

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
Then open [http://localhost:3000](http://localhost:3000) in your web browser. Edits to `index.html`, `style.css` and `main.js` reload the page and sync to `dist/`.

### 2. Build for Production
To create a standalone production bundle in `dist/`:
```bash
npm run build
```

---

## 📁 Project Structure

```text
├── index.html             # Page markup on a 12-column grid
├── kvkk.html              # KVKK notice (also shown in an in-page dialog)
├── style.css              # Design tokens, components & responsive rules
├── main.js                # Smooth scroll, sticky showcase, menu, waitlist form, FAQ & KVKK dialog
├── manifest.webmanifest   # App icons & theme colors
├── build.js               # Production builder (outputs to dist/)
├── server.js              # Zero-dependency local dev server with live-reload
├── google-apps-script/    # Waitlist → Google Sheets web app (see its README)
├── dist/                  # Production distribution output
└── assets/
    ├── images/            # Logo, partner logos, icons, social share image
    │   └── 3d/            # 3D card compositions (2x resolution WebP)
    └── fonts/             # Self-hosted Figtree (400, 500, 600, 700)
```

---

## 🎨 Content & Features Included

- **Header / Navigation:** cashif logo, *Nasıl çalışır?*, *Özellikler*, *İletişim* and the *Bekleme listesine katıl* CTA.
- **Hero:** *"Finansta kaybolma, cashif’le keşfet."* with the 3D discovery-path visual.
- **Partners:** Bilgiyi Ticarileştirme Merkezi (BTM), Tech İstanbul.
- **How it works:** Topics, simulation, certificate & perks with a sticky card on desktop.
- **Features:** Streaks & Mint, weekly leagues & community.
- **Waitlist:** Email form with explicit consent; entries are written to Google Sheets via `google-apps-script/`.
- **FAQ:** Animated accordion on native `<details>`.
- **Footer:** Contact, social links, FAQ and KVKK notice.

## 📝 Notes

- The waitlist form `action` is the Google Apps Script web app URL. Setup and redeploy steps: `google-apps-script/README.md`.
- `kvkk.html` names a natural person (Emre Kuzgun) as data controller until the company is founded; update that section afterwards.
