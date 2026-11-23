# AI Music Ops 0.01 — RouteNote Operations Dashboard

This is the recovered standalone website from the earlier AI Music Ops & RouteNote Platform conversation bundle.

## Run locally
Open `index.html` in a modern browser. The standalone page includes sample activity data, simulated live telemetry, filtering, search, copy, and JSON/CSV export.

## Publish with GitHub Pages
1. Upload `index.html`, this README, and `.github/workflows/pages.yml` to the root of `inecloud313-prog/ai-music-ops`.
2. In GitHub, open Settings → Pages and select GitHub Actions as the build/deployment source if prompted.
3. Open Actions and wait for **Deploy AI Music Ops 0.01 website** to finish successfully.
4. The site URL will be `https://inecloud313-prog.github.io/ai-music-ops/`.

## Scope
This is the static dashboard recovered from the prior export. Its telemetry stream is simulated in-browser. It does not deploy the FastAPI backend, database, worker, or the separate Replicate MusicGen API. Those services require a backend host and server-side secrets. Never put API tokens in this static website or commit them to Git.
