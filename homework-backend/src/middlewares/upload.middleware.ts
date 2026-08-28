import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { BadRequestError } from '../utils/errors';

// Allowed MIME types for whiteboard uploads
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        `Invalid file type: ${file.mimetype}. Only image files (JPEG, PNG, WebP, HEIC) are accepted.`
      )
    );
  }
};

export const whiteboardUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5,                   // Up to 5 whiteboard images per request
    fields: 10,
  },
  fileFilter,
});
