import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getErrorMessage } from '../../utils/errorMessage';
import type { MembershipPayload } from './admin-catalog.types';

@Injectable()
export class AdminMembershipService {
  constructor(private readonly prisma: PrismaService) {}

  // B-10: validate membership fields before persisting
  private validateMembership(payload: MembershipPayload) {
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    if (!name) throw new BadRequestException({ message: 'Membership name is required' });
    const minSpending = Number(payload.min_spending);
    if (!Number.isFinite(minSpending) || minSpending < 0) {
      throw new BadRequestException({ message: 'min_spending must be a non-negative number' });
    }
    const discountPercent = Number(payload.discount_percent);
    if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      throw new BadRequestException({ message: 'discount_percent must be between 0 and 100' });
    }
  }

  async getMemberships() {
    try {
      return await this.prisma.membership.findMany({
        where: { is_active: true },
        orderBy: { min_spending: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching memberships:', error);
      throw new InternalServerErrorException({ message: 'Error fetching membership tiers' });
    }
  }

  async createMembership(payload: MembershipPayload) {
    try {
      this.validateMembership(payload);
      await this.prisma.membership.create({
        data: {
          name: payload.name as string,
          min_spending: payload.min_spending as string | number,
          discount_percent: payload.discount_percent as string | number,
        },
      });
      return { message: 'New membership tier added successfully' };
    } catch (error) {
      console.error('Error adding membership:', error);
      throw new InternalServerErrorException({ message: getErrorMessage(error) });
    }
  }

  async updateMembership(id: string, payload: MembershipPayload) {
    try {
      this.validateMembership(payload);
      await this.prisma.membership.update({
        where: { id: Number(id) },
        data: {
          name: payload.name,
          min_spending: payload.min_spending,
          discount_percent: payload.discount_percent,
        },
      });
      return { message: 'Membership tier updated successfully' };
    } catch (error) {
      console.error('Error updating membership:', error);
      throw new InternalServerErrorException({ message: getErrorMessage(error) });
    }
  }

  async deleteMembership(id: string) {
    try {
      await this.prisma.membership.update({
        where: { id: Number(id) },
        data: { is_active: false },
      });
      return { message: 'Membership tier deleted successfully' };
    } catch (error) {
      console.error('Error deleting membership:', error);
      throw new InternalServerErrorException({ message: getErrorMessage(error) });
    }
  }
}
