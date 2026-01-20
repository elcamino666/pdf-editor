import type { PageThumbnail } from '../hooks/usePDFDocument';

interface ThumbnailCardProps {
  thumbnail: PageThumbnail;
  displayIndex: number;
  isDragging?: boolean;
  onDelete?: (pageNumber: number) => void;
}

export function ThumbnailCard({ thumbnail, displayIndex, isDragging, onDelete }: ThumbnailCardProps) {
  return (
    <div
      className={`
        group relative bg-white rounded-lg shadow-lg overflow-hidden
        transition-all duration-200
        ${isDragging ? 'ring-2 ring-blue-500 shadow-2xl scale-105' : 'hover:shadow-xl'}
      `}
    >
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(thumbnail.pageNumber);
          }}
          className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center
            rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100
            hover:bg-red-600 transition-all duration-150 text-sm font-medium"
          title="Delete page"
        >
          ✕
        </button>
      )}
      <img
        src={thumbnail.dataUrl}
        alt={`Page ${thumbnail.pageNumber}`}
        className="w-full h-auto"
        draggable={false}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <span className="text-white text-sm font-medium">
          Page {displayIndex + 1}
        </span>
        {thumbnail.pageNumber !== displayIndex + 1 && (
          <span className="text-slate-300 text-xs ml-2">
            (was {thumbnail.pageNumber})
          </span>
        )}
      </div>
    </div>
  );
}
