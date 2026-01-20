import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { ThumbnailCard } from './ThumbnailCard';
import type { PageThumbnail } from '../hooks/usePDFDocument';

interface ThumbnailGridProps {
  thumbnails: PageThumbnail[];
  pageOrder: number[];
  onReorder: (newOrder: number[]) => void;
  onDelete: (pageNumber: number) => void;
}

export function ThumbnailGrid({ thumbnails, pageOrder, onReorder, onDelete }: ThumbnailGridProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    const newOrder = [...pageOrder];
    const [removed] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(destIndex, 0, removed);
    onReorder(newOrder);
  };

  // Create ordered thumbnails based on pageOrder
  const orderedThumbnails = pageOrder.map((pageNum) =>
    thumbnails.find((t) => t.pageNumber === pageNum)!
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="thumbnails" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          >
            {orderedThumbnails.map((thumbnail, index) => (
              <Draggable
                key={thumbnail.pageNumber}
                draggableId={`page-${thumbnail.pageNumber}`}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <ThumbnailCard
                      thumbnail={thumbnail}
                      displayIndex={index}
                      isDragging={snapshot.isDragging}
                      onDelete={onDelete}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
