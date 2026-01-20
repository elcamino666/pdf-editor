import type { FileId, PDFFileData } from '../types/pdf';
import { SourceFileSection } from './SourceFileSection';

interface SourcePanelProps {
  files: Map<FileId, PDFFileData>;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (fileId: FileId) => void;
}

export function SourcePanel({ files, onAddFiles, onRemoveFile }: SourcePanelProps) {
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      onAddFiles(Array.from(selectedFiles));
    }
    // Reset input to allow selecting same file again
    e.target.value = '';
  };

  const filesArray = Array.from(files.values());

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white">Source Files</h2>
        <label className="flex items-center gap-2 px-4 py-2.5 md:px-3 md:py-1.5 min-h-[44px] md:min-h-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors">
          <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add PDF
          <input
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
        {filesArray.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <svg
              className="w-12 h-12 mx-auto mb-3 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>No PDF files added yet</p>
            <p className="text-sm mt-1">Click "Add PDF" to get started</p>
          </div>
        ) : (
          filesArray.map((file) => (
            <SourceFileSection
              key={file.id}
              file={file}
              onRemove={() => onRemoveFile(file.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
