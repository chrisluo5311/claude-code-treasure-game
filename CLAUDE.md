# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:3000 (auto-opens browser)
npm run build     # Build to ./build/ directory
```

There is no lint or test script configured.

## Architecture

This is a single-page React + TypeScript app built with Vite (SWC). All game logic lives in `src/App.tsx` — there are no separate state management files, hooks, or services.

**Game mechanics:** 3 treasure boxes are rendered; one randomly contains treasure. Clicking a box opens it (+$100 for treasure, -$50 for skeleton). The game ends when the treasure is found or all boxes are opened.

**Key state in `App.tsx`:**
- `boxes: Box[]` — each box tracks `id`, `isOpen`, `hasTreasure`
- `score: number` — updated on each open
- `gameEnded: boolean` — triggers the Game Over overlay

**Assets:**
- `src/assets/` — chest images (`treasure_closed.png`, `treasure_opened.png`, `treasure_opened_skeleton.png`, `key.png`)
- `src/audios/` — sound effects (`chest_open.mp3`, `chest_open_with_evil_laugh.mp3`)
- `src/results/` — additional UI images

**UI components:** `src/components/ui/` contains shadcn/ui components (Radix UI + Tailwind). Use these primitives when adding new UI elements rather than building from scratch.

**Path alias:** `@` resolves to `src/` (configured in `vite.config.ts`).

**Styling:** Tailwind CSS with an amber/treasure theme. Animations use the `motion` package (`motion/react`).

## Guidelines

`src/guidelines/Guidelines.md` is an editable file for project-specific AI guidelines. Add design system rules or coding conventions there when needed.
