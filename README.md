# Yantrika Feedback Portal — WALL·E Edition (v3)

A cinematic student-feedback website for **Yantrika**, a robotics community
in VCET college. Students rate **10 robot stations**, give one **final overall
verdict**, land on a **thank-you page** — and everything is stored in
**Google Sheets** through a tiny **Google Apps Script** backend.

**No frameworks. No server. No accounts. No paid services.**
Just HTML + CSS + JavaScript + Google Apps Script + Google Sheets.

---

## 1. The user journey

```
 index.html        intro page — hero, "THE FLEET" lineup, quick general feedback
      │  "RATE THE FLEET"
      ▼
 botfeed.html      10 bot stations (name + branch once, stars per bot,
      │            optional field notes) → batch transmit
      ▼            writes one row PER BOT into  Sheet 1 · "bot feedback"
 finalfeed.html    final overall feedback (name/branch prefilled)
      │            writes one row into          Sheet 2 · "General feedback"
      ▼  (auto-redirect ~1.6 s after success)
 thankyou.html     thank-you page — confetti, WALL-E + EVE celebration

 reviews.html      password gate → statistics + review cards,
                   switchable between Sheet 2 (general) and Sheet 1 (bot)
```

The 10 stations: **Line Follower · Soccer Bot · Fire Bird · Yasaka ·
Duckietown · Maze Solver · RC Bot · Dex Arms 3-Piece · Robotic Arm ·
Self-Balancing Bot.**

---

## 2. How it works (30-second architecture)

```
 botfeed / finalfeed / index
      │  POST (form-data: type=botbatch | general, name, branch, …)
      ▼
 Google Apps Script (Code.gs)  ──append rows──▶  Google Sheet (private)
      ▲                                                │
      │  GET ?sheet=bot | general (JSON) ◀──read rows──┘
      │
 reviews.html (after password check)
```

- `doPost(e)` — `type=botbatch` appends one row per bot to **Sheet 1**;
  `type=general` appends one row to **Sheet 2**.
- `doGet(e)` — returns either sheet as JSON for `reviews.html`.
- Both sheet tabs are **created automatically** the first time they are
  written to (or run `setup()` once to create them up front).

---

## 3. What you need

- A Google account (for Sheets + Apps Script).
- This folder's files: `index.html`, `botfeed.html`, `finalfeed.html`,
  `thankyou.html`, `reviews.html`, `style.css`, `fonts.css`, `script.js`,
  `theme.js`, plus your `images/` folder used by the index gallery.
- Any free static host for the frontend (GitHub Pages / Netlify — see §7).

---

## 4. Folder structure

```
yantrika-feedback/
├── index.html        ← intro page (public)
├── botfeed.html      ← 10 bot stations (public)
├── finalfeed.html    ← final overall feedback (public)
├── thankyou.html     ← thank-you page (public)
├── reviews.html      ← password gate + reviews (public URL, gated UI)
├── style.css         ← all styling (original theme + "v3 UPGRADE" block)
├── fonts.css         ← embedded fonts (no network needed)
├── script.js         ← all frontend logic (CONFIG at the top)
├── theme.js          ← animations layer (preloader, cursor, robots, confetti)
├── Code.gs           ← the tiny backend (goes into Google Apps Script)
├── README.md         ← this file
└── images/           ← your gallery photos (archive-*.jpg)
```

Keep all frontend files **in the same folder** — they link by filename.

---

## 5. Step-by-step: deploy from scratch

### Step 1 — Create the Google Sheet (the database)

1. Go to [sheets.new](https://sheets.new) → a blank spreadsheet opens.
2. Rename it (top-left) to e.g. `Yantrika Feedback DB`.
3. **You do NOT need to type any headers or tabs** — the backend creates the
   two tabs (`bot feedback`, `General feedback`) with headers automatically.
   (Optional: run `setup()` in Step 2.4 to create them immediately.)

The resulting schema:

| Tab `bot feedback` (Sheet 1) |||||||
|---|---|---|---|---|---|---|
| ID | Name | Branch | Bot | Rating | Feedback | Date |

| Tab `General feedback` (Sheet 2) ||||||
|---|---|---|---|---|---|
| ID | Name | Branch | Rating | Feedback | Date |

### Step 2 — Create the Apps Script backend

1. In the sheet: **Extensions → Apps Script** (recommended — the script stays
   *bound* to the sheet).
2. Delete the starter code, paste the entire contents of **`Code.gs`**, save (💾).
3. *(Only if you created a **standalone** script at script.google.com instead:)*
   paste your sheet's ID (the long string between `/d/` and `/edit` in the sheet
   URL) into `const SPREADSHEET_ID = ""` at the top of `Code.gs`.
4. Optional: in the function dropdown select **`setup`** → click **Run** once
   (authorise when asked) → both tabs appear with header rows.

### Step 3 — Deploy as a Web App

1. **Deploy → New deployment** → gear icon → **Web app**.
2. Description: `Yantrika feedback backend`.
3. **Execute as: Me** · **Who has access: Anyone** ← required, otherwise the
   website can't reach it.
4. Click **Deploy** → authorise (if you see *"Google hasn't verified this
   app"*: **Advanced → Go to … (unsafe) → Allow** — normal for your own script).
5. Copy the **Web app URL** ending in `/exec`.

### Step 4 — Configure the frontend

Open `script.js` and edit the two lines at the top:

```js
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR-ID/exec";
const REVIEWS_PASSWORD = "123";   // ← change this!
```

> **Demo mode:** while `APPS_SCRIPT_URL` is not a real `http(s)` URL, the site
> runs without a backend — submissions succeed locally with a toast, and
> `reviews.html` shows sample data behind a demo banner. Perfect for trying
> the UI before you deploy.

### Step 5 — Test the whole journey (see §8 checklist)

Open `index.html` in a browser and click through:
**RATE THE FLEET → rate 10 stations → TRANSMIT → PROCEED TO FINAL FEEDBACK →
TRANSMIT → thank-you page**, then check both sheet tabs for new rows.

### Step 6 — Put the site online (pick one)

**Option A — GitHub Pages (free, recommended)**
1. [github.com](https://github.com) → **New repository** `yantrika-feedback` (Public).
2. **Add file → Upload files** → drag in all frontend files (+ `images/`) → **Commit**.
3. **Settings → Pages** → Source: *Deploy from a branch* → `main` + `/ (root)` → **Save**.
4. ~1 minute later the site is live at `https://<you>.github.io/yantrika-feedback/`.

**Option B — Netlify Drop (fastest)**
1. [app.netlify.com/drop](https://app.netlify.com/drop) → drag the folder in → instant URL.

> Upload only the frontend files. `Code.gs` lives inside Google Apps Script —
> it *is* the deployed backend.

---

## 6. Data flow details

**Bot batch submit (botfeed.html)**
1. `script.js` validates name, branch and all 10 star ratings.
2. One POST: `type=botbatch`, `name`, `branch`, `payload` = JSON array of
   `{bot, rating, feedback}` × 10.
3. `Code.gs` appends 10 rows to `bot feedback` (IDs continue across batches).
4. Page shows success + reveals **PROCEED TO FINAL FEEDBACK**.

**Final submit (finalfeed.html / index quick form)**
1. POST `type=general` with name, branch, rating, feedback.
2. `Code.gs` appends one row to `General feedback`.
3. `finalfeed.html` auto-redirects to `thankyou.html`.

**Reviews (reviews.html)**
1. Password check (basic protection — see §9).
2. GET `?sheet=general` or `?sheet=bot` → stats, star breakdown, cards.
3. Filters: SOURCE, BOT (bot source only), BRANCH, RATING.

---

## 7. After you edit `Code.gs`

Google keeps serving the OLD version until you publish a new one:
**Deploy → Manage deployments → pencil icon → Version: *New version* → Deploy.**
(The `/exec` URL stays the same.)

---

## 8. Testing checklist

- [ ] Submit botfeed with unrated stations → each missing station is listed
- [ ] Fleet-charge rail counts 3/10 … 10/10 as you rate
- [ ] Full batch → success message + proceed button; 10 new rows in `bot feedback`
- [ ] finalfeed prefills name/branch from the journey
- [ ] Final submit → success → auto-redirect to `thankyou.html`; row in `General feedback`
- [ ] thankyou shows star confetti and robot bubbles
- [ ] index quick form also lands in `General feedback`
- [ ] reviews: wrong password → error; right password → stats + cards
- [ ] reviews SOURCE toggle switches general/bot; BOT filter narrows; bot cards show a cyan bot badge
- [ ] Site looks good on a phone (resize the browser)

---

## 9. Security warning — please read honestly

- The reviews password lives in frontend JavaScript — anyone can read it with
  DevTools. It is **basic access protection, NOT authentication**.
- Anyone determined enough can call the Apps Script URL directly.
- Perfect for a college demo — **not suitable for sensitive data**.
- Only collect the harmless fields this project uses: name, branch, rating,
  feedback, bot. No emails/phones.

---

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| Form says nothing is sent, toast mentions demo mode | Paste your `/exec` URL into `script.js` (§5 Step 4) |
| Reviews never load | Deployment access must be **Anyone**; URL must end in `/exec` |
| "Script function not found" | Functions must be named exactly `doGet` / `doPost` |
| Changed `Code.gs` but nothing changed | Deploy → New version (§7) |
| `TypeError: Cannot read properties of null (getActiveSpreadsheet)` | Script is standalone — set `SPREADSHEET_ID` in `Code.gs` (or recreate it via Extensions → Apps Script) |
| Data lands in wrong columns | Don't edit/reorder header rows; delete a tab and let `setup()` rebuild it |
| Password rejected | `REVIEWS_PASSWORD` in `script.js` is case-sensitive (default `123`) |
| Gallery images missing on index | Keep your `images/` folder next to `index.html` (`archive-hero.jpg`, `archive-poster.jpg`, `archive-01…04.jpg`) |

---

## 11. Customizing

- **Rename / add / remove bot stations** — keep these strings identical:
  1. `botfeed.html`: each station's `data-bot` + visible name (+ its `<li data-bot="…">` in `#fleetList`),
  2. `reviews.html`: the `#botFilter` `<option>` values,
  3. `index.html`: the fleet chip labels (cosmetic).
  Rows already stored keep the old name.
- **Colors** — `:root` variables at the top of `style.css`.
- **College / community text** — hero sections in the HTML files.
- **Password** — `REVIEWS_PASSWORD` in `script.js`.
- **Sheet tab names** — `SHEET_BOT` / `SHEET_GENERAL` at the top of `Code.gs`.

---

## 12. Credits & theme notes

Theme: WALL·E / Axiom cinematic design system — rust/cyan/gold on dark blues,
Bricolage Grotesque + Chakra Petch + Space Grotesk (embedded in `fonts.css`),
preloader boot sequence, custom cursor, scroll charge bar, text scramble,
WALL-E/EVE/M-O animations, star confetti. `theme.js` is pure visual sugar and
never talks to the backend.