import { useState, useEffect } from 'react';
import { pdfjs } from '../lib/pdfWorker';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface PageThumbnail {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

interface UsePDFDocumentResult {
  thumbnails: PageThumbnail[];
  isLoading: boolean;
  error: string | null;
  pdfArrayBuffer: ArrayBuffer | null;
  pageCount: number;
}

const THUMBNAIL_SCALE = 0.3;

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

export function usePDFDocument(file: File | null): UsePDFDocumentResult {
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    if (!file) {
      setThumbnails([]);
      setPdfArrayBuffer(null);
      setPageCount(0);
      return;
    }

    let cancelled = false;

    async function loadPDF(pdfFile: File) {
      setIsLoading(true);
      setError(null);
      setThumbnails([]);

      try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        if (cancelled) return;

        setPdfArrayBuffer(arrayBuffer);

        // Load PDF document
        const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer.slice(0) }).promise;
        if (cancelled) return;

        setPageCount(pdfDoc.numPages);

        // Render thumbnails progressively
        const newThumbnails: PageThumbnail[] = [];
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          if (cancelled) return;
          const thumbnail = await renderPageToDataUrl(pdfDoc, i);
          newThumbnails.push(thumbnail);
          setThumbnails([...newThumbnails]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load PDF');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadPDF(file);

    return () => {
      cancelled = true;
    };
  }, [file]);

  return { thumbnails, isLoading, error, pdfArrayBuffer, pageCount };
}
