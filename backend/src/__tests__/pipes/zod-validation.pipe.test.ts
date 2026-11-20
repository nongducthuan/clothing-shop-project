import { BadRequestException } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { loginSchema } from '../../types/schemas';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(loginSchema);

  it('returns the parsed payload for valid input', () => {
    expect(pipe.transform({ identifier: 'user@example.com', password: 'password123' })).toEqual({
      identifier: 'user@example.com',
      password: 'password123',
    });
  });

  it('throws a Nest BadRequestException with the existing validation response shape', () => {
    try {
      pipe.transform({ identifier: '', password: '' });
      throw new Error('Expected validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({ field: 'identifier' }),
          expect.objectContaining({ field: 'password' }),
        ]),
      });
    }
  });
});
