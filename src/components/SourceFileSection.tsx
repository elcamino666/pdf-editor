import { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { PDFFileData } from '../types/pdf';
import { createSourceDraggableId, createSourceDroppableId } from '../utils/pageId';

interface SourceFileSectionProps {
  file: PDFFileData;
  onRemove: () => void;
}

export function SourceFileSection({ file, onRemove }: SourceFileSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-slate-800/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-slate-700/50">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-left flex-1 min-w-0"
        >
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium text-white truncate">{file.name}</span>
          <span className="text-slate-400 text-sm whitespace-nowrap">
            ({file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'})
          </span>
        </button>
        <button
          onClick={onRemove}
          className="ml-2 p-1 text-slate-400 hover:text-red-400 transition-colors"
          title="Remove file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Error state */}
      {file.error && (
        <div className="p-3 text-red-400 text-sm bg-red-500/10">
          {file.error}
        </div>
      )}

      {/* Thumbnail grid */}
      {!isCollapsed && (
        <Droppable
          droppableId={createSourceDroppableId(file.id)}
          direction="horizontal"
          isDropDisabled={false}
        >
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`
                p-3 grid grid-cols-3 gap-2 min-h-[80px]
                ${snapshot.isDraggingOver ? 'bg-slate-600/30' : ''}
              `}
            >
              {file.thumbnails.map((thumbnail, index) => (
                <Draggable
                  key={createSourceDraggableId(file.id, thumbnail.pageNumber)}
                  draggableId={createSourceDraggableId(file.id, thumbnail.pageNumber)}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`
                        relative bg-white rounded shadow overflow-hidden
                        cursor-grab active:cursor-grabbing
                        transition-transform
                        ${snapshot.isDragging ? 'ring-2 ring-blue-500 scale-105 z-10' : 'hover:ring-1 hover:ring-blue-400'}
                      `}
                    >
                      <img
                        src={thumbnail.dataUrl}
                        alt={`Page ${thumbnail.pageNumber}`}
                        className="w-full h-auto"
                        draggable={false}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1 py-0.5">
                        <span className="text-white text-xs">p{thumbnail.pageNumber}</span>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {/* Loading indicator */}
              {file.isLoading && (
                <div className="flex items-center justify-center p-2 text-slate-400">
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
                </div>
              )}
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
}
