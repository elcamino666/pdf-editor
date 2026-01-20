import { useState, useEffect } from 'react';
import { PDFUploader } from './components/PDFUploader';
import { ThumbnailGrid } from './components/ThumbnailGrid';
import { ExportButton } from './components/ExportButton';
import { usePDFDocument } from './hooks/usePDFDocument';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [pageOrder, setPageOrder] = useState<number[]>([]);

  const { thumbnails, isLoading, error, pdfArrayBuffer, pageCount } = usePDFDocument(file);

  // Update page order as thumbnails load progressively
  useEffect(() => {
    if (thumbnails.length === 0) return;

    // Get page numbers from thumbnails that aren't in pageOrder yet
    const thumbnailPages = thumbnails.map((t) => t.pageNumber);
    const newPages = thumbnailPages.filter((p) => !pageOrder.includes(p));

    if (newPages.length > 0) {
      setPageOrder((prev) => [...prev, ...newPages]);
    }
  }, [thumbnails, pageOrder]);

  const handleReset = () => {
    setFile(null);
    setPageOrder([]);
  };

  const handleResetOrder = () => {
    setPageOrder(thumbnails.map((t) => t.pageNumber));
  };

  const handleDeletePage = (pageNumber: number) => {
    setPageOrder((prev) => prev.filter((p) => p !== pageNumber));
  };

  const hasModified =
    pageOrder.length !== thumbnails.length ||
    pageOrder.some((page, index) => page !== index + 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">PDF Page Rearranger</h1>
          <p className="text-slate-400">
            Upload a PDF, reorder or delete pages, and export your modified document
          </p>
        </header>

        {/* Main Content */}
        {!file ? (
          <div className="max-w-xl mx-auto">
            <PDFUploader onFileSelect={setFile} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="text-slate-300">
                  <span className="font-medium text-white">{file.name}</span>
                  <span className="text-slate-500 mx-2">•</span>
                  <span>{pageCount} pages</span>
                </div>
                {hasModified && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                    Modified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {hasModified && (
                  <button
                    onClick={handleResetOrder}
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Upload new PDF
                </button>
                {pdfArrayBuffer && (
                  <ExportButton
                    pdfArrayBuffer={pdfArrayBuffer}
                    pageOrder={pageOrder}
                    disabled={isLoading || pageOrder.length === 0}
                  />
                )}
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300">
                {error}
              </div>
            )}

            {/* Loading State */}
            {isLoading && thumbnails.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <svg
                    className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-4"
                    viewBox="0 0 24 24"
                  >
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
                  <p className="text-slate-400">Loading PDF...</p>
                </div>
              </div>
            )}

            {/* Thumbnail Grid */}
            {thumbnails.length > 0 && (
              <div>
                <p className="text-slate-400 text-sm mb-4">
                  Drag pages to reorder, hover to delete
                  {isLoading && ` (loading ${thumbnails.length}/${pageCount}...)`}
                </p>
                <ThumbnailGrid
                  thumbnails={thumbnails}
                  pageOrder={pageOrder}
                  onReorder={setPageOrder}
                  onDelete={handleDeletePage}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
