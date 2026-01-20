import * as pdfjs from 'pdfjs-dist';

// Configure pdf.js worker - Vite handles the worker bundling
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export { pdfjs };
