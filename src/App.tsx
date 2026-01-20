import { useState, useCallback } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { PDFDocument } from '@cantoo/pdf-lib';
import { useMultiplePDFs } from './hooks/useMultiplePDFs';
import { SourcePanel } from './components/SourcePanel';
import { ResultPanel } from './components/ResultPanel';
import type { PageIdentifier, FileId } from './types/pdf';
import {
  parseSourceDraggableId,
  parseResultDraggableId,
  DROPPABLE_RESULT,
} from './utils/pageId';

function App() {
  const { files, addFiles, removeFile, isAnyLoading } = useMultiplePDFs();
  const [resultPages, setResultPages] = useState<PageIdentifier[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [activePanel, setActivePanel] = useState<'source' | 'result'>('source');

  // Handle removing a source file - also remove its pages from result
  const handleRemoveFile = useCallback(
    (fileId: FileId) => {
      removeFile(fileId);
      setResultPages((prev) => prev.filter((p) => p.fileId !== fileId));
    },
    [removeFile]
  );

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside any droppable
    if (!destination) {
      // If dragged from result and dropped outside, remove from result
      if (source.droppableId === DROPPABLE_RESULT) {
        const resultIndex = parseResultDraggableId(draggableId);
        if (resultIndex !== null) {
          setResultPages((prev) => prev.filter((_, i) => i !== resultIndex));
        }
      }
      return;
    }

    const isFromSource = source.droppableId.startsWith('source-file-');
    const isFromResult = source.droppableId === DROPPABLE_RESULT;
    const isToResult = destination.droppableId === DROPPABLE_RESULT;
    const isToSource = destination.droppableId.startsWith('source-file-');

    // Source -> Result: Copy page to result
    if (isFromSource && isToResult) {
      const pageId = parseSourceDraggableId(draggableId);
      if (pageId) {
        setResultPages((prev) => {
          const newPages = [...prev];
          newPages.splice(destination.index, 0, pageId);
          return newPages;
        });
      }
    }

    // Result -> Result: Reorder within result
    else if (isFromResult && isToResult) {
      if (source.index === destination.index) return;

      setResultPages((prev) => {
        const newPages = [...prev];
        const [removed] = newPages.splice(source.index, 1);
        newPages.splice(destination.index, 0, removed);
        return newPages;
      });
    }

    // Result -> Source: Remove from result
    else if (isFromResult && isToSource) {
      const resultIndex = parseResultDraggableId(draggableId);
      if (resultIndex !== null) {
        setResultPages((prev) => prev.filter((_, i) => i !== resultIndex));
      }
    }

    // Source -> Source (same or different file): No-op, pages stay in source
  };

  const handleClearResult = () => {
    setResultPages([]);
  };

  const handleRemoveResultPage = (index: number) => {
    setResultPages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPagesFromDialog = (pages: PageIdentifier[]) => {
    setResultPages((prev) => [...prev, ...pages]);
  };

  const handleExport = async () => {
    if (resultPages.length === 0) return;

    setIsExporting(true);

    try {
      // Load all source PDFs that are used in result
      const usedFileIds = new Set(resultPages.map((p) => p.fileId));
      const loadedPdfs = new Map<FileId, Awaited<ReturnType<typeof PDFDocument.load>>>();

      for (const fileId of usedFileIds) {
        const fileData = files.get(fileId);
        if (fileData) {
          const pdf = await PDFDocument.load(fileData.arrayBuffer);
          loadedPdfs.set(fileId, pdf);
        }
      }

      // Create new PDF with pages in result order
      const newPdf = await PDFDocument.create();

      // Determine target dimensions from the first page
      let targetWidth: number | null = null;
      let targetHeight: number | null = null;

      for (const page of resultPages) {
        const sourcePdf = loadedPdfs.get(page.fileId);
        if (!sourcePdf) continue;

        const sourcePage = sourcePdf.getPage(page.pageNumber - 1);
        const { width: sourceWidth, height: sourceHeight } = sourcePage.getSize();

        // Use first page dimensions as target
        if (targetWidth === null || targetHeight === null) {
          targetWidth = sourceWidth;
          targetHeight = sourceHeight;
        }

        // Check if page needs scaling
        const needsScaling =
          Math.abs(sourceWidth - targetWidth) > 1 ||
          Math.abs(sourceHeight - targetHeight) > 1;

        if (!needsScaling) {
          // Page matches target dimensions, copy directly
          const [copiedPage] = await newPdf.copyPages(sourcePdf, [page.pageNumber - 1]);
          newPdf.addPage(copiedPage);
        } else {
          // Page has different dimensions - embed and scale to fit
          const [embeddedPage] = await newPdf.embedPages([sourcePage]);

          // Calculate scale to fit within target dimensions (maintain aspect ratio)
          const scaleX = targetWidth / sourceWidth;
          const scaleY = targetHeight / sourceHeight;
          const scale = Math.min(scaleX, scaleY);

          const scaledWidth = sourceWidth * scale;
          const scaledHeight = sourceHeight * scale;

          // Center the scaled page
          const offsetX = (targetWidth - scaledWidth) / 2;
          const offsetY = (targetHeight - scaledHeight) / 2;

          // Create new page with target dimensions
          const newPage = newPdf.addPage([targetWidth, targetHeight]);

          // Draw the embedded page scaled and centered
          newPage.drawPage(embeddedPage, {
            x: offsetX,
            y: offsetY,
            width: scaledWidth,
            height: scaledHeight,
          });
        }
      }

      // Generate and download
      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'combined.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="flex-none px-4 md:px-6 py-3 md:py-4 border-b border-slate-700">
        <h1 className="text-xl md:text-2xl font-bold text-white">PDF Page Rearranger</h1>
        <p className="text-slate-400 text-xs md:text-sm">
          Upload PDFs, drag pages to build your document, and export
        </p>
      </header>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden flex border-b border-slate-700">
        <button
          onClick={() => setActivePanel('source')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activePanel === 'source'
              ? 'text-white border-b-2 border-blue-500 bg-slate-800/50'
              : 'text-slate-400'
          }`}
        >
          Source Files
        </button>
        <button
          onClick={() => setActivePanel('result')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activePanel === 'result'
              ? 'text-white border-b-2 border-blue-500 bg-slate-800/50'
              : 'text-slate-400'
          }`}
        >
          Result ({resultPages.length})
        </button>
      </div>

      {/* Main two-panel layout */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 flex min-h-0">
          {/* Source Panel - Left */}
          <div className={`
            ${activePanel === 'source' ? 'flex' : 'hidden'} md:flex
            flex-col w-full md:w-80 flex-none
            md:border-r border-slate-700 bg-slate-800/30
          `}>
            <SourcePanel
              files={files}
              onAddFiles={addFiles}
              onRemoveFile={handleRemoveFile}
            />
          </div>

          {/* Result Panel - Right */}
          <div className={`
            ${activePanel === 'result' ? 'flex' : 'hidden'} md:flex
            flex-col flex-1 min-w-0
          `}>
            <ResultPanel
              resultPages={resultPages}
              files={files}
              onClear={handleClearResult}
              onRemovePage={handleRemoveResultPage}
              onExport={handleExport}
              isExporting={isExporting}
              onAddPages={handleAddPagesFromDialog}
            />
          </div>
        </div>
      </DragDropContext>

      {/* Loading indicator */}
      {isAnyLoading && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-slate-300 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading pages...
        </div>
      )}
    </div>
  );
}

export default App;
