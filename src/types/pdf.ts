/**
 * Core types for multi-file PDF page rearranger
 */

/** Unique identifier for each uploaded PDF file */
export type FileId = string;

/** Identifies a specific page from a specific source file */
export interface PageIdentifier {
  fileId: FileId;
  pageNumber: number;
}

/** Thumbnail data for a single page */
export interface PageThumbnail {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

/** Complete state for a single uploaded PDF file */
export interface PDFFileData {
  id: FileId;
  name: string;
  arrayBuffer: ArrayBuffer;
  pageCount: number;
  thumbnails: PageThumbnail[];
  isLoading: boolean;
  error: string | null;
}
