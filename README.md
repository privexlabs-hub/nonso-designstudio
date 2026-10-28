# Nonso Stitches — Brand Studio

The brand design system, identity playbook, voice reference, asset library, template library (96 templates) and visual editor for Nonso Stitches, built with Next.js (App Router), React and TypeScript. It is a rebuild of the original Claude Design `*.dc.html` studio, with the same features. Everything runs in the browser, edits are saved in `localStorage`, and the site ships as a static export.

## Run it
```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static site in out/
npm start            # serve out/ locally
```
`predev` and `prebuild` copy the pinned Lucide icon set (lucide-static 0.460.0) into `public/icons/`. The design-system `Icon` component masks these icons, so they work offline.

## Checks
```bash
npm run typecheck    # tsc --noEmit (strict)
npm run lint
npm test             # Vitest unit tests
NS_SRC=/path/to/original npm test   # also checks output against the original lib/*.js
npm run test:e2e     # Playwright against out/ (run `npm run build` first; desktop + Pixel 7)
```
The parity test loads the original `lib/ns-*.js` and compares the output of the TypeScript engine with it. It covers every graphic template at every size and colour variation, and every document and email template. Both the document JSON and the rendered HTML must match.

## Pages
| Route | Purpose |
|---|---|
| `/` | Studio home, area cards, recently edited (`ns:index`) |
| `/design-system` | 12 sections; click any value to copy it; live design-system components, slide and UI-kit previews |
| `/playbook` | Identity guide in 13 chapters, with correct and incorrect usage |
| `/voice` | AI-ready brand knowledge: filter by status, copy everything or one section, download .md or .txt |
| `/assets` | Every asset with a preview; download one file, a group or everything (ZIP) |
| `/templates` | 96 templates with filter and search, article banner generator, bulk ZIP export, reset |
| `/editor#t=<template-id>` | Visual editor for graphics and multi-page documents |

## Architecture
- **Shared engine** (`src/lib/`), ported from the original:
  - `core.ts`: brand tokens, storage, clipboard, colour maths.
  - `theme.ts`: light and dark theme. The setting is remembered, follows the system by default and syncs across tabs.
  - `voice.ts`: brand voice and knowledge content.
  - `graphics.ts`: the layout engine (18 layouts) and 81 graphic templates.
  - `docs.ts`: 31 block types, page libraries, and 9 document and 6 email templates.
  - `render.ts`: one HTML renderer for the editor, previews and every export.
  - `export.ts`: PNG, JPEG, SVG, PDF (exact and print), PPTX, DOCX (hand-built OOXML), EPUB 3, HTML, email HTML, Markdown, TXT and ZIP.
  - `catalog.ts`: the unified list of templates.
- **Export libraries** (html-to-image 1.11.11, JSZip, jsPDF, PptxGenJS) are npm packages, imported dynamically on first use.
- **Design system**: `src/styles/ds/*.css` holds the design-system tokens and component CSS unchanged. `src/components/ds/` has all 30 components as typed React components (props follow the adherence rules) behind an `index.ts` barrel.
- **Saved edits**: `localStorage["ns:doc:<id>"]`. A reset keeps the previous version in `ns:trash:<id>`. Template definitions are never changed.

## Mobile and touch
Tested at 320–1920 px, with no horizontal page scroll at any width.
- **Studio pages:**
  - The header nav becomes a scrolling strip.
  - The design system and playbook section navs become sticky chip bars.
  - The template bulk-export bar docks to the bottom of the screen, clear of the safe area.
  - Touch targets are at least 44 px.
- **Editor below 900 px:** it switches to Pages / Canvas / Edit tabs. Touch support:
  - Drag elements with a finger, using the larger resize handle.
  - Double-tap text to edit it.
  - Pinch to zoom.
  - Reorder pages and blocks with pointer-based dragging, or with the arrow keys on the grip.

## Known limitations (carried over from the original brief)
- Brand facts that weren't supplied (location, prices, contact details, client stories) appear as `[placeholders]`.
- **Logo:** raster only. There are no vector, mono or reversed versions and no 16–32 px favicon.
- **Photography:** none supplied; templates use labelled placeholders.
- **SVG export:** wraps HTML in `foreignObject`. "Exact" PDF rasterises pages; use Print / Save as PDF for selectable text.
- **DOCX and EPUB:** dark page backgrounds are dropped, and EPUB reflows pages into chapters.
- **Storage:** edits live in this browser only (localStorage, about 5–10 MB).
