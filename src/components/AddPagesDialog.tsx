import { useState } from 'react';
import type { FileId, PDFFileData, PageIdentifier } from '../types/pdf';

interface AddPagesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPages: (pages: PageIdentifier[]) => void;
  files: Map<FileId, PDFFileData>;
}

export function AddPagesDialog({
  isOpen,
  onClose,
  onAddPages,
  files,
}: AddPagesDialogProps) {
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [expandedFiles, setExpandedFiles] = useState<Set<FileId>>(new Set());

  if (!isOpen) return null;

  const filesArray = Array.from(files.values());

  // Create a unique key for selection tracking
  const createSelectionKey = (fileId: FileId, pageNumber: number) =>
    `${fileId}-${pageNumber}`;

  const togglePageSelection = (fileId: FileId, pageNumber: number) => {
    const key = createSelectionKey(fileId, pageNumber);
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleFileExpanded = (fileId: FileId) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const handleAddSelected = () => {
    const pages: PageIdentifier[] = [];

    // Convert selected keys back to PageIdentifiers in file order
    for (const file of filesArray) {
      for (const thumbnail of file.thumbnails) {
        const key = createSelectionKey(file.id, thumbnail.pageNumber);
        if (selectedPages.has(key)) {
          pages.push({ fileId: file.id, pageNumber: thumbnail.pageNumber });
        }
      }
    }

    onAddPages(pages);
    setSelectedPages(new Set());
  };

  const handleClose = () => {
    setSelectedPages(new Set());
    onClose();
  };

  const selectedCount = selectedPages.size;

  // Initialize first file as expanded by default
  const isFileExpanded = (fileId: FileId) => {
    if (expandedFiles.size === 0 && filesArray.length > 0 && filesArray[0].id === fileId) {
      return true;
    }
    return expandedFiles.has(fileId);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white">Select Pages</h2>
        <button
          onClick={handleClose}
          className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {filesArray.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>No source files available</p>
            <p className="text-sm mt-1">Add PDF files first to select pages</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filesArray.map((file) => {
              const isExpanded = isFileExpanded(file.id);
              const fileSelectedCount = file.thumbnails.filter(
                (t) => selectedPages.has(createSelectionKey(file.id, t.pageNumber))
              ).length;

              return (
                <div key={file.id} className="bg-slate-800/50 rounded-lg overflow-hidden">
                  {/* File header - collapsible */}
                  <button
                    onClick={() => toggleFileExpanded(file.id)}
                    className="w-full flex items-center justify-between px-4 py-3 min-h-[52px] text-left hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-white font-medium truncate max-w-[200px]">
                        {file.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {fileSelectedCount > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
                          {fileSelectedCount}
                        </span>
                      )}
                      <span className="text-slate-400 text-sm">
                        {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'}
                      </span>
                    </div>
                  </button>

                  {/* Thumbnail grid */}
                  {isExpanded && (
                    <div className="grid grid-cols-2 gap-3 p-4 pt-0">
                      {file.thumbnails.map((thumbnail) => {
                        const isSelected = selectedPages.has(
                          createSelectionKey(file.id, thumbnail.pageNumber)
                        );

                        return (
                          <button
                            key={thumbnail.pageNumber}
                            onClick={() => togglePageSelection(file.id, thumbnail.pageNumber)}
                            className={`
                              relative bg-white rounded-lg overflow-hidden
                              transition-all duration-150
                              ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''}
                            `}
                          >
                            <img
                              src={thumbnail.dataUrl}
                              alt={`Page ${thumbnail.pageNumber}`}
                              className="w-full h-auto"
                              draggable={false}
                            />

                            {/* Page number badge */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <span className="text-white text-sm font-medium">
                                Page {thumbnail.pageNumber}
                              </span>
                            </div>

                            {/* Selection checkmark */}
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 text-white">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-none flex items-center gap-3 px-4 py-4 border-t border-slate-700 bg-slate-900">
        <button
          onClick={handleClose}
          className="flex-1 px-4 py-3 min-h-[48px] text-slate-300 hover:text-white text-sm font-medium rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleAddSelected}
          disabled={selectedCount === 0}
          className={`
            flex-1 px-4 py-3 min-h-[48px] text-sm font-medium rounded-lg transition-colors
            ${
              selectedCount > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }
          `}
        >
          Add Selected{selectedCount > 0 ? ` (${selectedCount})` : ''}
        </button>
      </div>
    </div>
  );
}
