# Yantrika Feedback Portal — v3 Upgrade Notes

Implements the flow from the Excalidraw sketch (`Drawing 2026-09-09`):

```
Intro page (index.html)
   └─▶ botfeed.html — 10 bot stations, one rating each (batch transmit)
           └─▶ finalfeed.html — final overall feedback
                   └─▶ thankyou.html — thank-you page
```

Backend (Code.gs):
- **Sheet 1 · `bot feedback`** ← one row per bot station (`ID | Name | Branch | Bot | Rating | Feedback | Date`)
- **Sheet 2 · `General feedback`** ← final overall feedback + the quick form on index.html (`ID | Name | Branch | Rating | Feedback | Date`)

Both tabs are **created automatically** on first write (or run `setup()` once).

---

## Files to copy into your project

| File | Status | What changed |
|---|---|---|
| `index.html` | **updated** | Intro page now leads into the bot journey: new “THE FLEET” lineup section (10 chips → bot stations), hero CTA → `botfeed.html`, nav gains “BOT FEEDBACK”, quick form now tags posts as `type=general` (Sheet 2). **Also fixed a pre-existing markup bug:** a stray `</div>` after EVE's `</svg>` closed `.eve` early, pushing her bubble and the stickers/ground-shadow out of `.hero-stage` and leaving the rest of the hero mis-nested. All animations/sections preserved. |
| `botfeed.html` | **new** | Intro header + identity (name/branch) + 10 station cards (Line Follower, Soccer Bot, Fire Bird, Yasaka, Duckietown, Maze Solver, RC Bot, Dex Arms 3-Piece, Robotic Arm, Self-Balancing Bot). Stars required per station, field notes optional. Live “FLEET_CHARGE” progress rail (x/10). One batch POST (`type=botbatch`) writes all 10 rows to Sheet 1. On success reveals **PROCEED TO FINAL FEEDBACK**. |
| `finalfeed.html` | **new** | Final overall verdict (name/branch prefilled from the journey via localStorage, stars, feedback) → Sheet 2 (`type=general`). On success auto-routes to `thankyou.html` (~1.6 s). |
| `thankyou.html` | **new** | Celebratory thank-you page: WALL-E + EVE stage, star confetti, bubbles, CTAs back home / reviews / rate again. |
| `reviews.html` | **updated** | New **SOURCE** filter (General feedback / Bot feedback) + **BOT** filter when bot source is active; bot reviews show a cyan bot badge. Stats recompute per source. (Also fixed the demo-password hint to match `script.js`: `123`.) |
| `style.css` | **updated** | Original 1830 lines untouched; a clearly-marked “v3 UPGRADE” block appended (fleet chips, stations, progress rail, thank-you stage, responsive rules for 1024/700/480 px). |
| `script.js` | **updated** | Same CONFIG at top. Now powers all pages: shared star-rating binder, batch bot submit, journey localStorage hand-off, demo mode (URL not pasted → simulated submits + sample review data with the demo banner), reviews source/bot filters. |
| `Code.gs` | **updated** | `doPost` branches on `type` (`botbatch` → Sheet 1 with one row per bot, `general` → Sheet 2). `doGet?sheet=bot|general`. `LockService` guard, auto-created tabs, `setup()` writes both header rows. Optional `SPREADSHEET_ID` for standalone (unbound) scripts, where `getActiveSpreadsheet()` returns null. |
| `theme.js` | **unchanged** | Preloader, cursor, scramble, charge bar, parallax, confetti hook all reused as-is by the new pages. |
| `fonts.css` | **unchanged** | — |

---

## Deploy checklist

1. Copy the 8 frontend files next to your existing ones (keep your `images/` folder).
2. In Google Sheets → Extensions → Apps Script: replace code with the new `Code.gs`.
3. **Deploy → Manage deployments → pencil → Version: New version → Deploy** (required after any backend edit).
4. Optional: run `setup()` once to pre-create the `bot feedback` and `General feedback` tabs.
5. Paste your Web App URL into `APPS_SCRIPT_URL` in `script.js` (same as before). Until you do, the site runs in **demo mode**: submits succeed locally with a toast, and reviews show sample data.
6. Change `REVIEWS_PASSWORD` in `script.js`.

## Renaming bots / fixing spellings

The sketch read “Yasaka” and “Dex arms 3 piece”. If your official names differ, edit them in **three places** (keep the strings identical):
1. `botfeed.html` — each `data-bot` attribute + the visible `st-name` text,
2. `botfeed.html` — the matching `<li data-bot="…">` in `#fleetList`,
3. `reviews.html` — the `#botFilter` `<option>` values,
4. `index.html` — the fleet chip labels (cosmetic only).

Existing rows in Sheet 1 keep whatever `Bot` string was sent when they were written.

## Verified

- `node --check` on `script.js` and `Code.gs` — clean; HTML tag-balance check clean on all 5 pages; CSS brace balance clean.
- `Code.gs` executed against faithful Apps Script stubs (real `doPost`/`doGet`/`setup`): 22/22 pass — tab auto-creation + headers, general row, 10-row batch with ids 1–10 then continuing 11…, name/branch/bot/date columns, malformed & empty payload → error JSON with no rows added, missing `type` defaults to general, `doGet` bot/general/bare, lock held==released, standalone `SPREADSHEET_ID` path via `openById`.
- Demo-mode double-submit window closed (buttons stay disabled until the simulated transmit finishes).
- jsdom smoke suite (executes the real `script.js` + `theme.js` per page): 24/24 pass —
  station rendering, fleet charge 3/10 → 10/10, validation listing 7 unrated bots,
  batch success + proceed link + localStorage hand-off, final-feed prefill + success +
  redirect to thankyou, reviews gate (password `123`), general/bot stats + filters + bot badges,
  index quick form success, thankyou confetti.
