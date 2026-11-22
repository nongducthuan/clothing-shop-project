import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';
import { sendOtpEmail } from '../../utils/emailService';
import { formatOrderResponse } from '../../utils/formatOrder';

class TooManyRequestsException extends HttpException {
  constructor(response: string | object) {
    super(response, HttpStatus.TOO_MANY_REQUESTS);
  }
}

function hashOtp(code: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required to protect OTP data.');
  return createHmac('sha256', secret).update(code).digest('hex');
}

function otpMatches(storedHash: string, submittedCode: string): boolean {
  if (!/^\d{6}$/.test(submittedCode) || !/^[a-f\d]{64}$/i.test(storedHash)) return false;
  const expected = Buffer.from(storedHash, 'hex');
  const actual = Buffer.from(hashOtp(submittedCode), 'hex');
  return timingSafeEqual(expected, actual);
}

@Injectable()
export class StorefrontOrderLookupService {
  constructor(private readonly prisma: PrismaService) {}

  async sendOtp(email: string | undefined, bodyLanguage?: string, acceptLanguage?: string, languageHeader?: string) {
    if (!email) throw new BadRequestException({ message: 'Email is required' });
    const rawLang = String(bodyLanguage || acceptLanguage || languageHeader || 'vi').toLowerCase();
    const emailLang = rawLang.startsWith('en') ? 'en' : 'vi';

    try {
      const oneMinuteAgo = new Date(Date.now() - 60_000);
      const recentOtp = await this.prisma.otp.findFirst({ where: { email, created_at: { gte: oneMinuteAgo } } });
      if (recentOtp) {
        throw new TooManyRequestsException({ message: 'Please wait 1 minute before requesting a new OTP code.' });
      }

      const code = randomInt(100000, 1000000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60_000);
      await this.prisma.$transaction(async (tx) => {
        await tx.otp.deleteMany({ where: { email } });
        await tx.otp.create({ data: { email, code: hashOtp(code), expires_at: expiresAt } });
      });

      const emailResult = await sendOtpEmail(email, code, emailLang);
      if (!emailResult.success) {
        throw new InternalServerErrorException({ message: `Failed to send OTP email: ${emailResult.error}` });
      }
      return { message: 'OTP sent to your email successfully' };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof TooManyRequestsException || error instanceof InternalServerErrorException) throw error;
      console.error('Send OTP Error:', error);
      throw new InternalServerErrorException({ message: 'Server error while sending OTP' });
    }
  }

  async verifyOtp(email: string | undefined, code: string | undefined) {
    if (!email) throw new BadRequestException({ message: 'Invalid OTP code!' });
    try {
      const otpData = await this.prisma.otp.findFirst({ where: { email } });
      if (!otpData) throw new BadRequestException({ message: 'Invalid OTP code!' });

      const maxAttempts = 5;
      if (otpData.failed_attempts >= maxAttempts) {
        await this.prisma.otp.deleteMany({ where: { email } });
        throw new TooManyRequestsException({ message: 'Too many failed attempts. Please request a new OTP.' });
      }
      if (new Date() > new Date(otpData.expires_at)) {
        await this.prisma.otp.deleteMany({ where: { email } });
        throw new BadRequestException({ message: 'OTP code has expired!' });
      }
      if (!otpMatches(otpData.code, String(code ?? ''))) {
        await this.prisma.otp.update({ where: { id: otpData.id }, data: { failed_attempts: { increment: 1 } } });
        const remaining = maxAttempts - otpData.failed_attempts - 1;
        throw new BadRequestException({ message: `Invalid OTP code! ${remaining} attempt(s) remaining.` });
      }

      const orders = await this.prisma.order.findMany({
        where: { email },
        orderBy: { created_at: 'desc' },
        include: {
          return_request: { include: { items: { include: { order_item: { include: {
            product: { select: { name: true, name_vi: true, name_en: true, image_url: true } },
            color: { select: { color_name: true, color_name_vi: true, color_name_en: true, image_url: true } },
            size: { select: { size: true } },
          } } } } } },
          voucher: { select: { id: true, code: true, discount_percent: true, max_discount_amount: true } },
          items: { include: {
            promotion: { select: { id: true, buy_product_id: true, gift_product_id: true, buy_quantity: true, gift_quantity: true } },
            product: { select: { name: true, name_vi: true, name_en: true, image_url: true } },
            color: { select: { color_name: true, color_name_vi: true, color_name_en: true, image_url: true } },
            size: { select: { size: true } },
          } },
        },
      });

      const formattedOrders = orders.map(formatOrderResponse);
      await this.prisma.otp.deleteMany({ where: { email } });
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET is required to create guest order access.');
      const guestOrderAccessToken = jwt.sign(
        { purpose: 'guest-order-access', email: String(email).toLowerCase() },
        secret,
        { expiresIn: '15m' },
      );
      return { message: 'Verification successful', orders: formattedOrders, guestOrderAccessToken };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof TooManyRequestsException) throw error;
      console.error('Order verification error:', error);
      throw new InternalServerErrorException({ message: 'System error while fetching orders' });
    }
  }
}
