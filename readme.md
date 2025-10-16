# FareSnap itinerary card demo

Static landing-page demo that reproduces Kayak-style multi-segment itinerary cards with a functioning `*I` formatter. GitHub Pages publishes from the `docs/` directory.

## Local preview

Serve the `docs/` directory with any static server:

```bash
python3 -m http.server --directory docs 4173
```

Visit [http://localhost:4173](http://localhost:4173).

## Customising the demo

- Update `docs/demo-data.js` to tweak carrier names, equipment, cabins, or times. Add or remove legs and layovers to extend the scenario.
- Adjust formatter behaviour inside `docs/demo-formatter.js`. The helper exposes `formatSegmentsToI(segments, options)` and includes a miniature booking-class lookup to mimic the production extension.
- Layout and styling live in `docs/styles.css`; tweak spacing tokens or colours there to adapt the card to another brand system.
- `docs/app.js` binds the itinerary data to the DOM, renders amenity icons, and wires clipboard behaviour for the floating `*I` pill.

To embed the card in another page, include the five core files (`index.html`, `styles.css`, `app.js`, `demo-data.js`, and `demo-formatter.js`) in your project, ensure the CSS variables are loaded, and call the default initialiser in `app.js` after the DOM is ready. The component is framework-agnostic and works with any static host.

## Deploying to GitHub Pages

1. Commit changes to the main branch.
2. Push to GitHub.
3. Ensure the repository is configured to publish from the `docs/` folder (Settings → Pages).

Updates will appear at <https://vtoool.github.io/ktflanding/> when the Pages build completes.
