# Kayak to *I landing page

Marketing site and live sandbox for the Kayak to *I Chrome extension. GitHub Pages publishes from the `docs/` directory.

## Local preview

No build step is required. Serve the `docs/` directory with any static server:

```bash
python3 -m http.server --directory docs 4173
```

Then visit [http://localhost:4173](http://localhost:4173).

## Analytics configuration

Edit `docs/analytics.js` to choose your provider:

- `ANALYTICS_PROVIDER = 'plausible'` (default) loads Plausible’s manual script and uses `ANALYTICS_SITE_DOMAIN` for the site ID.
- `ANALYTICS_PROVIDER = 'ga4'` loads Google Analytics 4; set `GA4_ID` to your property ID (e.g. `G-XXXXXXX`).
- `ANALYTICS_PROVIDER = 'none'` disables all tracking calls.

Attribution values for `utm_source`, `utm_campaign`, and `ref` are stored in `localStorage` and automatically appended to every tracked event.

## Demo data and formatter

- `docs/demo-data.js` contains the three curated scenarios. Update or add segments to adjust the sandbox.
- `docs/demo-formatter.js` provides `formatSegmentsToI(segments, options)`—a pure function mirroring the extension formatter.
- `docs/demo.js` binds the UI, toggles, analytics events, and clipboard behaviour.
- `docs/assets/og.svg` is the Open Graph preview (1200×630). Edit the SVG text directly or replace the file with your own artwork.

## Deploying to GitHub Pages

1. Commit changes to the main branch.
2. Push to GitHub.
3. Ensure the repository is configured to publish from the `docs/` folder (Settings → Pages).

Updates will appear at <https://vtoool.github.io/ktflanding/> once Pages finishes the deploy.
