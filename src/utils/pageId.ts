import type { FileId, PageIdentifier } from '../types/pdf';

/**
 * Generates a unique file ID using crypto.randomUUID
 */
export function generateFileId(): FileId {
  return crypto.randomUUID();
}

/**
 * Creates a draggable ID string for use with @hello-pangea/dnd
 * Format: "source:{fileId}:{pageNumber}" for source panel items
 *         "result:{index}" for result panel items
 */
export function createSourceDraggableId(fileId: FileId, pageNumber: number): string {
  return `source:${fileId}:${pageNumber}`;
}

export function createResultDraggableId(index: number): string {
  return `result:${index}`;
}

/**
 * Parses a source draggable ID back to a PageIdentifier
 */
export function parseSourceDraggableId(id: string): PageIdentifier | null {
  const parts = id.split(':');
  if (parts.length !== 3 || parts[0] !== 'source') {
    return null;
  }
  return {
    fileId: parts[1],
    pageNumber: parseInt(parts[2], 10),
  };
}

/**
 * Parses a result draggable ID to get the index
 */
export function parseResultDraggableId(id: string): number | null {
  const parts = id.split(':');
  if (parts.length !== 2 || parts[0] !== 'result') {
    return null;
  }
  return parseInt(parts[1], 10);
}

/**
 * Droppable IDs for the two panels
 */
export const DROPPABLE_SOURCE_PREFIX = 'source-file-';
export const DROPPABLE_RESULT = 'result-panel';

export function createSourceDroppableId(fileId: FileId): string {
  return `${DROPPABLE_SOURCE_PREFIX}${fileId}`;
}

export function parseSourceDroppableId(droppableId: string): FileId | null {
  if (!droppableId.startsWith(DROPPABLE_SOURCE_PREFIX)) {
    return null;
  }
  return droppableId.slice(DROPPABLE_SOURCE_PREFIX.length);
}
