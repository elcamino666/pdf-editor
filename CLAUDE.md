# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Vite)
npm run build    # Type-check with tsc, then build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Architecture

This is a client-side PDF page rearranger built with React + TypeScript + Vite + Tailwind CSS v4.

### PDF Processing Strategy

The app uses **two different PDF libraries** for distinct purposes:

1. **pdfjs-dist** (Mozilla's PDF.js) - For rendering PDF pages as canvas images for thumbnails. Configured in `src/lib/pdfWorker.ts` with a web worker for non-blocking rendering.

2. **@cantoo/pdf-lib** - For PDF manipulation (reordering/removing pages) and export. Used only at export time in `ExportButton.tsx`.

### Key Data Flow

1. User uploads PDF → `usePDFDocument` hook loads it via pdfjs-dist
2. Hook renders thumbnails **progressively** (one page at a time, updating state after each)
3. User reorders via drag-and-drop → `pageOrder` state tracks new sequence (array of original page numbers)
4. User deletes pages → page numbers removed from `pageOrder`
5. Export → pdf-lib creates new PDF by copying pages in `pageOrder` sequence

### State Model

- `pageOrder: number[]` - Array of original page numbers in desired order. Length may be less than total pages (deleted pages excluded).
- `thumbnails: PageThumbnail[]` - Rendered page images with original page numbers, loaded progressively.

### Components

- `ThumbnailGrid` - Drag-and-drop container using @hello-pangea/dnd (React 18+ fork of react-beautiful-dnd)
- `ThumbnailCard` - Individual page preview with delete button
- `ExportButton` - Handles PDF reconstruction and download
