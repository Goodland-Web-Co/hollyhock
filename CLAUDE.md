# Hollyhock

Fictional florist in Santa Barbara. Astro static site with several pages, deploys to Vercel with no adapter.

- `npm run dev` to work, `npm run build` to build into `dist/`, `npm run preview` to serve the build.
- Every page uses `src/layouts/Shell.astro`: fixed side column (bag icon, logo, menu, Contact Us with social icons, search), the "Lately at the shop" photo slider, the footer and the order slip.
- Shop content lives in `src/data/shop.js` (flowers, arrangements, gifts). Each item gets a tile and a page at `/shop/<id>/`.
- Shared pieces: `src/components/Tile.astro` (product tile), `Hero.astro` (split page opener), `Divider.astro` (flower divider).
- Styles are in `src/styles/global.css`. It was built up in passes, so later rules override earlier ones; check the end of the file first.
- Interactions are in `src/scripts/app.js`: order slip, bunch maker on the home page, slider, Flowers filter, search, contact note.
- Photographs are in `src/assets/`. All are CC0 or Unsplash License; sources are in `SOURCES.md`. Record the source and license of any photo added.

## Design direction

By the owner's direction the layout follows a reference shop site (Twig & Arrow): white fixed side column, a full-height photo on the home page with the caption at the bottom right, white pages.

- Never use another site's photos, logo or wording.
- Logo and titles: Barlow Condensed, thin capitals with wide letter spacing. All other text: Jost, light.
- Colors: white, Ink #20301F, Madder #A13C2C for hover and focus, Mist #F1F1EE for tinted bands.
- Buttons and controls are small spaced capitals on a hairline with the logo's flower, no filled boxes. Selected states (months, filters, menu) are underlines.
- The owner dislikes anything that reads as a generic AI template: boxed buttons, centered text blocks under a wide photo, grey panels.
- Each menu page has its own layout; keep that variety.
- Respect `prefers-reduced-motion`.

`plates/` holds botanical scans from an earlier version of this demo. Nothing in the site uses them.
