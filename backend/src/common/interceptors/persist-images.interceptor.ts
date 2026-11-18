import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { Request } from 'express';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function isSupportedImage(buffer: Buffer): boolean {
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp =
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP';
  return isJpeg || isPng || isWebp;
}

@Injectable()
export class PersistImagesInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const files = request.files;

    if (!Array.isArray(files) || files.length === 0) {
      return next.handle();
    }

    if (files.some((file) => !file.buffer || !isSupportedImage(file.buffer))) {
      throw new BadRequestException('Uploaded file content is not a supported image.');
    }

    const writtenPaths: string[] = [];
    try {
      for (const file of files) {
        const extension =
          file.mimetype === 'image/jpeg' ? '.jpg' : file.mimetype === 'image/png' ? '.png' : '.webp';
        file.filename = `${file.fieldname}-${randomUUID()}${extension}`;
        const filePath = path.join(uploadDir, file.filename);
        await fs.promises.writeFile(filePath, file.buffer, { flag: 'wx' });
        writtenPaths.push(filePath);
      }
    } catch (error) {
      await Promise.all(writtenPaths.map((p) => fs.promises.unlink(p).catch(() => undefined)));
      throw error;
    }

    return next.handle();
  }
}
