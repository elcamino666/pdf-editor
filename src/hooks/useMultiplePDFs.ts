import { useState, useCallback } from 'react';
import { pdfjs } from '../lib/pdfWorker';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { generateFileId } from '../utils/pageId';
import type { FileId, PDFFileData, PageThumbnail } from '../types/pdf';

const THUMBNAIL_SCALE = 0.3;

/**
 * Renders a single PDF page to a data URL for thumbnail display
 */
async function renderPageToDataUrl(
  pdfDoc: PDFDocumentProxy,
  pageNumber: number
): Promise<PageThumbnail> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: THUMBNAIL_SCALE });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport,
    canvas,
  }).promise;

  return {
    pageNumber,
    dataUrl: canvas.toDataURL('image/png'),
    width: viewport.width,
    height: viewport.height,
  };
}

interface UseMultiplePDFsResult {
  files: Map<FileId, PDFFileData>;
  addFiles: (files: File[]) => Promise<void>;
  removeFile: (fileId: FileId) => void;
  isAnyLoading: boolean;
}

export function useMultiplePDFs(): UseMultiplePDFsResult {
  const [files, setFiles] = useState<Map<FileId, PDFFileData>>(new Map());

  const addFiles = useCallback(async (newFiles: File[]) => {
    // Process each file
    for (const file of newFiles) {
      const fileId = generateFileId();

      // Initialize file entry with loading state
      setFiles((prev) => {
        const next = new Map(prev);
        next.set(fileId, {
          id: fileId,
          name: file.name,
          arrayBuffer: new ArrayBuffer(0), // Placeholder
          pageCount: 0,
          thumbnails: [],
          isLoading: true,
          error: null,
        });
        return next;
      });

      try {
        const arrayBuffer = await file.arrayBuffer();

        // Load PDF document
        const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer.slice(0) }).promise;

        // Update with page count and arrayBuffer
        setFiles((prev) => {
          const next = new Map(prev);
          const existing = next.get(fileId);
          if (existing) {
            next.set(fileId, {
              ...existing,
              arrayBuffer,
              pageCount: pdfDoc.numPages,
            });
          }
          return next;
        });

        // Render thumbnails progressively
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const thumbnail = await renderPageToDataUrl(pdfDoc, i);

          setFiles((prev) => {
            const next = new Map(prev);
            const existing = next.get(fileId);
            if (existing) {
              next.set(fileId, {
                ...existing,
                thumbnails: [...existing.thumbnails, thumbnail],
              });
            }
            return next;
          });
        }

        // Mark loading complete
        setFiles((prev) => {
          const next = new Map(prev);
          const existing = next.get(fileId);
          if (existing) {
            next.set(fileId, {
              ...existing,
              isLoading: false,
            });
          }
          return next;
        });
      } catch (err) {
        setFiles((prev) => {
          const next = new Map(prev);
          const existing = next.get(fileId);
          if (existing) {
            next.set(fileId, {
              ...existing,
              isLoading: false,
              error: err instanceof Error ? err.message : 'Failed to load PDF',
            });
          }
          return next;
        });
      }
    }
  }, []);

  const removeFile = useCallback((fileId: FileId) => {
    setFiles((prev) => {
      const next = new Map(prev);
      next.delete(fileId);
      return next;
    });
  }, []);

  const isAnyLoading = Array.from(files.values()).some((f) => f.isLoading);

  return {
    files,
    addFiles,
    removeFile,
    isAnyLoading,
  };
}
