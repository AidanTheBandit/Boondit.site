# boondit.site

Personal site. Astro, static output, no framework integrations — the whole thing is HTML plus one canvas.

## run

```sh
npm install
npm run dev      # localhost:4321
npm run build    # -> dist/
npm run preview  # serve dist/
```

## what's where

```
src/
  data/projects.ts    the work index: one entry per project, sorted by `start`
  data/marks.ts       the icon set. one SVG path group per project, 40x40 viewBox
  data/stack.ts       the stack list on /projects
  content/posts/      blog posts as markdown
  components/Rays.astro      the dithered light field
  components/Mark.astro      renders a mark from marks.ts
  layouts/Base.astro         page shell, nav, footer
  pages/
    index.astro              home: portrait, tagline, grid of doors
    projects/index.astro     work list + stack
    projects/[slug].astro    one page per project
    blog/index.astro         post list
    blog/[slug].astro        post
    tools.astro              R1 tools + creations
    r1-generator.astro       creation generator (info.json + QR)
  styles/global.css          all of it
public/
  portrait.png        1-bit dithered portrait (ink on paper)
  favicon.svg
```

## adding a project

1. add an entry to `src/data/projects.ts` — `id`, `name`, `mark`, `kicker`, `years`, `start`, `desc`, `links`
2. if it needs a new icon, add one to `src/data/marks.ts` keyed by the same name, drawn in a 40x40 box at 1.6px stroke
3. rebuild. the page appears at `/projects/<id>/` and sorts itself into the work list by `start`

## adding a post

Drop a markdown file in `src/content/posts/` with frontmatter:

```md
---
title: "..."
date: 2026-02-05
desc: "one line"
---
```

## design rules

- three colours only: `#ff0080` pink, `#995cd6` purple, `#333333` charcoal, on `#0a0a0a`
- no smooth gradients anywhere. the light field is quantised through an 8x8 Bayer matrix
- copy states what a thing is and does. no reflection, no personality asides
- one gesture per icon on hover, transform/opacity only
- `prefers-reduced-motion` disables all of it, including the canvas (single static frame)

## deploy

`dist/` is a static directory. it currently runs on the LAN preview host via `boondit-site-preview.service`; the apex (`boondit.site`) is still on Vercel. not wired to a remote yet.
