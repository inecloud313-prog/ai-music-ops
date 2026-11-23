# AI Music Ops 0.01 — Music Studio addition

The existing RouteNote dashboard stays at `index.html`. The Music Studio is `music-studio.html`.

## Deploy the static website
The GitHub Actions workflow `.github/workflows/pages.yml` publishes the static site. In GitHub, open Settings → Pages and choose GitHub Actions.

After deployment:
- Dashboard: `https://inecloud313-prog.github.io/ai-music-ops/`
- Music Studio: `https://inecloud313-prog.github.io/ai-music-ops/music-studio.html`

## Deploy the backend separately
GitHub Pages cannot run Python/FastAPI. Deploy the `backend/` directory to a Python/Docker host. Set `REPLICATE_API_TOKEN` as a secret/environment variable on that host. Set `ALLOWED_ORIGINS=https://inecloud313-prog.github.io`.

The backend exposes `/api/health`, `POST /api/generations`, and `GET /api/generations/{job_id}`. In the Music Studio, enter the backend base URL. Never put your Replicate token in browser code or commit it to Git.

This first generation backend uses an in-memory job index, so its job list is not durable across restarts. Existing RouteNote dashboard telemetry remains demo data; this release does not publish releases to RouteNote.
