import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { FileId, PDFFileData, PageIdentifier } from '../types/pdf';
import { createResultDraggableId, DROPPABLE_RESULT } from '../utils/pageId';

interface ResultPanelProps {
  resultPages: PageIdentifier[];
  files: Map<FileId, PDFFileData>;
  onClear: () => void;
  onRemovePage: (index: number) => void;
  onExport: () => void;
  isExporting: boolean;
}

export function ResultPanel({
  resultPages,
  files,
  onClear,
  onRemovePage,
  onExport,
  isExporting,
}: ResultPanelProps) {
  const canExport = resultPages.length > 0 && !isExporting;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white">
          Result
          {resultPages.length > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-400">
              ({resultPages.length} {resultPages.length === 1 ? 'page' : 'pages'})
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {resultPages.length > 0 && (
            <button
              onClick={onClear}
              className="px-3 py-1.5 text-slate-400 hover:text-white text-sm transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={onExport}
            disabled={!canExport}
            className={`
              flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium text-sm
              transition-all duration-200
              ${
                canExport
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-slate-600 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            {isExporting ? (
              <>
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
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </div>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={DROPPABLE_RESULT} direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 overflow-y-auto p-4
              ${snapshot.isDraggingOver ? 'bg-blue-500/10' : ''}
            `}
          >
            {resultPages.length === 0 ? (
              <div
                className={`
                  h-full flex flex-col items-center justify-center
                  border-2 border-dashed rounded-xl
                  ${snapshot.isDraggingOver ? 'border-blue-500 bg-blue-500/5' : 'border-slate-600'}
                `}
              >
                <svg
                  className={`w-16 h-16 mb-4 ${snapshot.isDraggingOver ? 'text-blue-500' : 'text-slate-500'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                <p className="text-slate-400 text-center">
                  Drag pages here to build your PDF
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  Pages can be added multiple times
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {resultPages.map((page, index) => {
                  const file = files.get(page.fileId);
                  const thumbnail = file?.thumbnails.find(
                    (t) => t.pageNumber === page.pageNumber
                  );

                  if (!thumbnail || !file) return null;

                  // Get short filename for badge
                  const shortName = file.name.length > 12
                    ? file.name.slice(0, 10) + '...'
                    : file.name.replace(/\.pdf$/i, '');

                  return (
                    <Draggable
                      key={`result-${index}`}
                      draggableId={createResultDraggableId(index)}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`
                            group relative bg-white rounded-lg shadow-lg overflow-hidden
                            cursor-grab active:cursor-grabbing
                            transition-all duration-200
                            ${snapshot.isDragging ? 'ring-2 ring-blue-500 shadow-2xl scale-105' : 'hover:shadow-xl'}
                          `}
                        >
                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemovePage(index);
                            }}
                            className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center
                              rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100
                              hover:bg-red-600 transition-all duration-150 text-sm font-medium"
                            title="Remove from result"
                          >
                            ✕
                          </button>

                          <img
                            src={thumbnail.dataUrl}
                            alt={`Page ${page.pageNumber} from ${file.name}`}
                            className="w-full h-auto"
                            draggable={false}
                          />

                          {/* Page info overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <span className="text-white text-sm font-medium">
                              Page {index + 1}
                            </span>
                            {/* Source badge */}
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/80 text-white">
                                {shortName}
                              </span>
                              <span className="text-slate-300 text-xs">
                                p{page.pageNumber}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
