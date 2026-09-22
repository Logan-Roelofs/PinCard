# PinCard

A small browser-based tool for designing and printing pinball price/instruction cards — the small cards you tape to the coin door or backbox showing "75¢ per play / $2 for 3 games" plus a QR code people can scan to report a problem with the machine.

Everything runs client-side (no backend, no build step) so it can be hosted for free on GitHub Pages.

## Features

- Accurate real-world card sizing in millimeters, with presets for common manufacturers:
  - Stern Pinball (Modern) — 75×140 mm
  - Bally (WPC) / Williams (WPC) — 82×152 mm
  - Bally (SS Series) — 83×140 mm
  - Data East / GamePlan — 76×140 mm
  - Gottlieb — Instruction (108×154 mm) and Score (57×154 mm) cards
  - Williams (Standard) — 83×154 mm
  - Custom width/height for anything else
- Upload a logo image per card
- Add multiple pricing lines (e.g. "75¢ — 3 Balls (1 Game)", "$2.00 — 3 Games")
- Generates a QR code (client-side, no external service) that links to whatever URL you provide — point it at your own reporting/contact page
- Keeps a saved list of your machines in the browser (localStorage), so you can build up a whole sheet
- Lays cards out on a Letter or A4 sheet with cut lines, ready to print and trim
- Export/Import your card list as JSON for backup or moving between browsers

## Using it

Just open `index.html`, or visit the published GitHub Pages site. No installation needed.

1. Click **+ New Card**, pick a size preset (or enter custom mm dimensions)
2. Fill in the game title, upload a logo, add your pricing lines
3. Paste in the URL you want the QR code to open (e.g. a report/contact page on your own site)
4. Repeat for each machine, setting **Copies to print** for how many of each you need
5. Pick your paper size and click **Print Sheet** — each card shows a dashed cut line

Your card list is saved automatically in the browser. Use **Export JSON** to keep a backup, and **Import JSON** to restore it or move it to another computer/browser.

## Hosting on GitHub Pages

This repo needs no build step — GitHub can serve it as-is:

1. Push this repo to `https://github.com/Logan-Roelofs/PinCard`
2. On GitHub, go to **Settings → Pages**
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`
4. Set **Branch** to `main` and folder to `/ (root)`, then **Save**
5. After a minute, your site will be live at `https://logan-roelofs.github.io/PinCard/`

## Project structure

```
index.html        Main app shell
css/style.css      App styling + print layout
js/app.js          App logic (cards, editor, sheet layout, QR rendering)
js/qrcode.js        Vendored QR code generator (MIT licensed, github.com/kazuhikoarase/qrcode-generator)
```

## Credits

QR code generation uses [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) by Kazuhiko Arase (MIT license), vendored locally in `js/qrcode.js` so the app works fully offline.
