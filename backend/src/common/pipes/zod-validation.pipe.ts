import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    const rawBody =
      value && typeof value === 'object' && !Array.isArray(value) ? value : {};

    const result = this.schema.safeParse(value);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message || 'Invalid value',
      }));
      throw new BadRequestException({ message: 'Validation failed', errors });
    }

    // Log dropped fields (zod strip protection)
    const parsed: unknown = result.data;
    const dropped =
      parsed && typeof parsed === 'object'
        ? Object.keys(rawBody as object).filter((key) => !(key in (parsed as object)))
        : [];
    if (dropped.length > 0) {
      console.warn(
        `[ZodValidationPipe] schema đã XOÁ ${dropped.length} field: ${dropped.join(', ')}`
      );
    }

    return result.data;
  }
}
