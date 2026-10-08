# CODLOCK — demo film

A **separate, self-contained** demo built for screen recording. It does not touch
`../repo` and it does not call any of the real agents — every number and response
is scripted so nothing can fail mid-take.

One file: `index.html`. No build, no npm, no CDN except the fonts (it falls back
to system fonts cleanly if you're offline).

## Record it

```bash
cd demo
python -m http.server 5199
# open http://127.0.0.1:5199
```

Or just double-click `index.html` — it works from disk too.

Then:

1. Press **F** for fullscreen, wait for the title card.
2. Start your screen recorder.
3. Click **▶ Play the full workflow**.
4. Don't touch anything. It runs about **1 minute 40** end to end and stops on
   the closing card.

## Keys

| Key | Does |
|---|---|
| `Space` | pause / resume — use this to hold a frame while you talk over it |
| `→` / `←` | jump to next / previous act |
| `R` | restart from the top |
| `F` | fullscreen |

Pause is the important one: if you're narrating live, hit Space on the risk dial
or the settlement split and talk, then Space again to continue.

## The nine acts

| # | Act | What lands |
|---|---|---|
| 0 | Problem | Two causes of refusal, financial and visual |
| 1 | Chat ingest | Darja conversation arrives in Instagram Direct, CODLOCK intercepts |
| 2 | AI extraction | Free-form Darja → six structured order fields, 96% confidence |
| 3 | Vision matching | "el robe beige" resolves to `LIN-BEIGE-M`, 97.4% |
| 4 | Virtual try-on | Scan-line reveal of the customer wearing the SKU; she reacts in chat |
| 5 | Risk scoring | Factors stack in, dial sweeps to 32, deposit lands at 20% |
| 6 | Gravv deposit | Collection created, checkout link into the thread, captured |
| 7 | Settlement | Refused delivery: −8.000 TND without, **0.000 TND** with |
| 8 | Close | The two mechanisms, restated |

The agent bus along the bottom lights up as each agent takes the order —
Orchestrator → Extraction → Vision → Fitting → Risk → Payment → Orders. It's the
architecture diagram, animated, so a judge sees the system and not just a page.

## Honesty, kept

- Try-on figures are **stylised illustrations, not photographs**, and the page
  says so on screen with the reason (no image-gen quota on the free tier).
- Act 7 shows the loss going to **zero**, not to profit. The remainder of the
  deposit returns to the customer — the page states that too. Don't pitch it as
  profit; that invites the question you don't want.
- Nothing here claims to be a live Gravv call. If you want a *real* sandbox
  collection on stage, that's the `repo/frontend` console with the payment agent
  running — this file is the safe take.

## Changing the story

All copy is inline in the HTML. The numbers you'd most likely want to move —
149.000 TND order, 20% deposit, 29.800 TND, 8.000 TND courier, risk 32 — appear
in the act 5/6/7 sections and in the `ACT[5]`/`ACT[6]` functions. Timings are the
`wait(ms, id)` calls inside each act; the rail bar length is the `fillBar(i, ms)`
at the top of each act, so if you change one, change both.
