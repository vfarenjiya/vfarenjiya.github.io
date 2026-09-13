# Habits PWA (v1.4)

Offline-first habit tracker. **No build step, no dependencies** — plain ES modules + a service worker.
Works fully offline once installed; data stays on the device.

---

## Run it locally

A service worker only registers over `http(s)` or `localhost` — opening `index.html` via `file://`
will **not** work (this is the single most common setup mistake).

```bash
cd habits-pwa
python3 -m http.server 8000      # or: npx serve .   or any static server