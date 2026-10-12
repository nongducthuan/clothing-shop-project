import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(path.extname(file.originalname).toLowerCase())) {
      cb(new AppError('Only JPEG, PNG, and WebP images are allowed.', 400));
      return;
    }
    cb(null, true);
  },
});

function isSupportedImage(buffer: Buffer): boolean {
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return isJpeg || isPng || isWebp;
}

/** Validate file signatures before writing uploads to the publicly served directory. */
export async function persistUploadedImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  const files = req.files;
  if (!Array.isArray(files) || files.length === 0) {
    next();
    return;
  }

  if (files.some((file) => !file.buffer || !isSupportedImage(file.buffer))) {
    res.status(400).json({ message: 'Uploaded file content is not a supported image.' });
    return;
  }

  const writtenPaths: string[] = [];
  try {
    for (const file of files) {
      const extension = file.mimetype === 'image/jpeg' ? '.jpg' : file.mimetype === 'image/png' ? '.png' : '.webp';
      file.filename = `${file.fieldname}-${randomUUID()}${extension}`;
      const filePath = path.join(uploadDir, file.filename);
      await fs.promises.writeFile(filePath, file.buffer, { flag: 'wx' });
      writtenPaths.push(filePath);
    }
    next();
  } catch (error) {
    await Promise.all(writtenPaths.map((filePath) => fs.promises.unlink(filePath).catch(() => undefined)));
    next(error);
  }
}
