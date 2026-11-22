import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StorefrontAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(body: { name?: string; email?: string; phone?: string; password?: string }) {
    try {
      const { name, email, phone, password } = body;
      if (!name || !email || !phone || !password) throw new BadRequestException({ message: 'Please enter all required information' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException({ message: 'Invalid email format' });
      if (!/^0\d{9,10}$/.test(phone)) throw new BadRequestException({ message: 'Invalid phone number format. Must be 10-11 digits starting with 0.' });
      if (typeof password !== 'string' || password.length < 8) throw new BadRequestException({ message: 'Password must be at least 8 characters' });
      if (await this.prisma.user.findUnique({ where: { email } })) throw new BadRequestException({ message: 'Email is already registered' });
      if (await this.prisma.user.findUnique({ where: { phone } })) throw new BadRequestException({ message: 'Phone number is already in use' });
      const hashedPassword = await bcrypt.hash(password, 10);
      const membership = await this.prisma.membership.findFirst({ where: { min_spending: 0, is_active: true } });
      const user = await this.prisma.user.create({
        data: { name, email, phone, password: hashedPassword, role: 'customer', membership_id: membership?.id ?? null },
      });
      return { message: 'Registration successful', id: user.id, email: user.email };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error during registration:', error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async login(body: { identifier?: string; password?: string }) {
    try {
      const { identifier, password } = body;
      if (!identifier || !password) throw new BadRequestException({ message: 'Please enter email/phone and password' });
      const user = await this.prisma.user.findFirst({
        where: { OR: [{ email: identifier }, { phone: identifier }] },
        include: { membership: true },
      });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new UnauthorizedException({ message: 'Incorrect account or password' });
      }
      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '15m' },
      );
      const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '7d' });
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
      await this.prisma.user.update({ where: { id: user.id }, data: { refresh_token: hashedRefreshToken } });
      return {
        message: 'Login successful',
        user: {
          id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role,
          total_spent: user.total_spent,
          tier_name: user.membership?.is_active ? user.membership.name : 'Normal',
          discount_percent: user.membership?.is_active ? user.membership.discount_percent : 0,
        },
        token,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) throw error;
      console.error('Error during login:', error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async updateProfile(userId: number | undefined, body: { phone?: string }, userPayload?: Record<string, unknown>) {
    try {
      if (!userId) throw new UnauthorizedException({ message: 'Unauthorized' });
      const phone = body.phone;
      if (!phone) throw new BadRequestException({ message: 'Please enter phone number' });
      const existingPhone = await this.prisma.user.findUnique({ where: { phone } });
      if (existingPhone && existingPhone.id !== userId) throw new BadRequestException({ message: 'Phone number is already in use' });
      await this.prisma.user.update({ where: { id: userId }, data: { phone } });
      return { message: 'Profile updated successfully!', user: { ...userPayload, phone } };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) throw error;
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error when updating profile' });
    }
  }

  async getMe(userId?: number) {
    try {
      if (!userId) throw new UnauthorizedException({ message: 'Unauthorized' });
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, name: true, email: true, phone: true, role: true, total_spent: true, membership_id: true,
          membership: { select: { name: true, discount_percent: true, is_active: true } },
        },
      });
      if (!user) throw new NotFoundException({ message: 'User not found' });
      return {
        ...user,
        tier_name: user.membership?.is_active ? user.membership.name : 'Normal',
        discount_percent: user.membership?.is_active ? user.membership.discount_percent : 0,
        membership: undefined,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) throw error;
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async logout(userId?: number) {
    try {
      if (userId) await this.prisma.user.update({ where: { id: userId }, data: { refresh_token: null } });
      return { message: 'Logged out successfully' };
    } catch (error) {
      console.error('Error during logout:', error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async refreshToken(body: { refreshToken?: string }) {
    try {
      const token = body.refreshToken;
      if (!token) throw new UnauthorizedException({ message: 'Refresh token is required' });
      let decoded: { id: number };
      try {
        decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as { id: number };
      } catch {
        throw new ForbiddenException({ message: 'Invalid or expired refresh token' });
      }
      const user = await this.prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user || !user.refresh_token) throw new ForbiddenException({ message: 'Refresh token not found' });
      if (!(await bcrypt.compare(token, user.refresh_token))) throw new ForbiddenException({ message: 'Refresh token mismatch' });
      const newAccessToken = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '15m' });
      const newRefreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '7d' });
      const hashed = await bcrypt.hash(newRefreshToken, 10);
      await this.prisma.user.update({ where: { id: user.id }, data: { refresh_token: hashed } });
      return { token: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) throw error;
      console.error('Error during token refresh:', error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async changePassword(userId: number | undefined, body: { currentPassword?: string; newPassword?: string }) {
    try {
      if (!userId) throw new UnauthorizedException({ message: 'Unauthorized' });
      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword) throw new BadRequestException({ message: 'Please provide current and new password' });
      if (typeof newPassword !== 'string' || newPassword.length < 8) throw new BadRequestException({ message: 'New password must be at least 8 characters' });
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException({ message: 'User not found' });
      if (!(await bcrypt.compare(currentPassword, user.password))) throw new BadRequestException({ message: 'Current password is incorrect' });
      const hashed = await bcrypt.hash(newPassword, 10);
      await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
      return { message: 'Password changed successfully' };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }
}
