# PinCard

A small browser-based tool for designing and printing pinball price/instruction cards — the small cards you tape to the coin door or backbox showing "75¢ per play / $2 for 3 games" plus a QR code people can scan to report a problem with the machine.

Everything runs client-side (no backend, no build step) so it can be hosted for free on GitHub Pages.

## Features

- Accurate real-world card sizing in millimeters (landscape, matching real cards), with presets for common manufacturers:
  - Stern Pinball (Modern) — 140×75 mm
  - Bally (WPC) / Williams (WPC) — 152×82 mm
  - Bally (SS Series) — 140×83 mm
  - Data East / GamePlan — 140×76 mm
  - Gottlieb — Instruction (154×108 mm) and Score (154×57 mm) cards
  - Williams (Standard) — 154×83 mm
  - Custom width/height for anything else
- Upload a logo image per card
- Add multiple pricing lines (e.g. "75¢ — 3 Balls (1 Game)", "$2.00 — 3 Games")
- Generates a QR code (client-side, no external service) that links to whatever URL you provide — point it at your own reporting/contact page
- Keeps a saved list of your machines in the browser (localStorage), so you can build up a whole sheet
- Lays cards out on a Letter or A4 sheet with cut lines, ready to print and trim
- Export/Import your card list as JSON for backup or moving between browsers
- A public **Community Card Library**, published from JSON files in this repo, that visitors can browse and copy cards from into their own list

## Using it

Just open `index.html`, or visit the published GitHub Pages site. No installation needed.

1. Click **+ New Card**, pick a size preset (or enter custom mm dimensions)
2. Fill in the game title, upload a logo, add your pricing lines
3. Paste in the URL you want the QR code to open (e.g. a report/contact page on your own site)
4. Repeat for each machine, setting **Copies to print** for how many of each you need
5. Pick your paper size and click **Print Sheet** — each card shows a dashed cut line

Your card list is saved automatically in the browser. Use **Export JSON** to keep a backup, and **Import JSON** to restore it or move it to another computer/browser.

## Publishing cards to the Community Card Library

Because GitHub Pages is static hosting with no database, "uploading" cards means committing a JSON file to this repo. Any card in `data/` that's listed in `data/manifest.json` shows up on the live site for every visitor to browse and add to their own list — your data never touches their browser until they click **+ Add to My Games**.

To publish cards:

1. In the app, build the cards you want to share, then click **Export JSON** to download `pincard-export.json`
2. Move that file into the `data/` folder in this repo (rename it to something descriptive, e.g. `data/my-games.json`)
3. Add its filename to the list in `data/manifest.json`, e.g.:
   ```json
   [
     "shared-cards.json",
     "my-games.json"
   ]
   ```
4. Commit and push — the live site will pick it up on next load

You can split cards across as many files as you like (e.g. one per arcade location); `manifest.json` just needs to list every filename you want loaded. Each file can either be a plain array of cards (`[ {...}, {...} ]`) or the full export shape (`{ "cards": [...], "settings": {...} }`) — both are accepted.

Note: the Community Card Library loads via `fetch()`, so it only works when the site is served over `http(s)://` — it won't load if you double-click `index.html` and open it as a `file://` URL locally. To test locally, run a simple static server from this folder, e.g.:

```bash
python -m http.server 8765
```

then open `http://localhost:8765`.

## Hosting on GitHub Pages

This repo needs no build step — GitHub can serve it as-is:

1. Push this repo to `https://github.com/Logan-Roelofs/PinCard`
2. On GitHub, go to **Settings → Pages**
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`
4. Set **Branch** to `main` and folder to `/ (root)`, then **Save**
5. After a minute, your site will be live at `https://logan-roelofs.github.io/PinCard/`

## Project structure

```
index.html              Main app shell
css/style.css           App styling + print layout
js/app.js               App logic (cards, editor, sheet layout, QR rendering)
js/qrcode.js            Vendored QR code generator (MIT licensed, github.com/kazuhikoarase/qrcode-generator)
data/manifest.json      List of JSON filenames (in data/) to publish in the Community Card Library
data/shared-cards.json  A published set of cards — add your own, or add more files alongside it
```

## Credits

QR code generation uses [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) by Kazuhiko Arase (MIT license), vendored locally in `js/qrcode.js` so the app works fully offline.
