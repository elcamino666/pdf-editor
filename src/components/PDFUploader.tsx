import { useCallback, useState } from 'react';

interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
}

export function PDFUploader({ onFileSelect }: PDFUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/pdf') {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
        transition-all duration-200
        ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'
        }
      `}
    >
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        className="hidden"
        id="pdf-upload"
      />
      <label htmlFor="pdf-upload" className="cursor-pointer">
        <div className="flex flex-col items-center gap-4">
          <svg
            className={`w-16 h-16 ${isDragging ? 'text-blue-500' : 'text-slate-500'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div>
            <p className="text-lg font-medium text-slate-200">
              Drop your PDF here
            </p>
            <p className="text-sm text-slate-400 mt-1">
              or click to browse
            </p>
          </div>
        </div>
      </label>
    </div>
  );
}
