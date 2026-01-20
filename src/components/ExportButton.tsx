import { useState } from 'react';
import { PDFDocument } from '@cantoo/pdf-lib';

interface ExportButtonProps {
  pdfArrayBuffer: ArrayBuffer;
  pageOrder: number[];
  disabled?: boolean;
}

export function ExportButton({ pdfArrayBuffer, pageOrder, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Load the original PDF
      const originalPdf = await PDFDocument.load(pdfArrayBuffer);

      // Create a new PDF with pages in the new order
      const newPdf = await PDFDocument.create();

      // Copy pages in the specified order
      for (const pageNum of pageOrder) {
        const [copiedPage] = await newPdf.copyPages(originalPdf, [pageNum - 1]);
        newPdf.addPage(copiedPage);
      }

      // Generate the new PDF bytes
      const pdfBytes = await newPdf.save();

      // Create download link
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'rearranged.pdf';
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
    <button
      onClick={handleExport}
      disabled={disabled || isExporting}
      className={`
        flex items-center gap-2 px-6 py-3 rounded-lg font-semibold
        transition-all duration-200
        ${
          disabled || isExporting
            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
        }
      `}
    >
      {isExporting ? (
        <>
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
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
          Exporting...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export PDF
        </>
      )}
    </button>
  );
}
