import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { BannerPayload } from './admin-catalog.types';

@Injectable()
export class AdminBannerService {
  constructor(private readonly prisma: PrismaService) {}

  async getBanners() {
    try {
      return await this.prisma.banner.findMany({ orderBy: { id: 'desc' } });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async addBanner(payload: BannerPayload) {
    try {
      const { image_url, title, title_vi, title_en, subtitle, subtitle_vi, subtitle_en } = payload;
      const baseTitle = title || title_vi || title_en;
      const banner = await this.prisma.banner.create({
        data: {
          image_url: image_url as string,
          title: baseTitle as string,
          title_vi: title_vi || baseTitle || null,
          title_en: title_en || baseTitle || null,
          subtitle: (subtitle || null) as string,
          subtitle_vi: subtitle_vi || subtitle || null,
          subtitle_en: subtitle_en || subtitle || null,
        },
      });
      return { id: banner.id, message: 'Banner added successfully' };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async editBanner(id: string, payload: BannerPayload) {
    try {
      const { image_url, title, title_vi, title_en, subtitle, subtitle_vi, subtitle_en } = payload;
      const baseTitle = title || title_vi || title_en;
      await this.prisma.banner.update({
        where: { id: Number(id) },
        data: {
          image_url,
          title: baseTitle || undefined,
          title_vi: title_vi !== undefined ? (title_vi || baseTitle || null) : undefined,
          title_en: title_en !== undefined ? (title_en || baseTitle || null) : undefined,
          subtitle: subtitle !== undefined ? (subtitle || '') : undefined,
          subtitle_vi: subtitle_vi !== undefined ? (subtitle_vi || null) : undefined,
          subtitle_en: subtitle_en !== undefined ? (subtitle_en || null) : undefined,
        },
      });
      return { message: 'Banner updated successfully' };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async removeBanner(id: string) {
    try {
      await this.prisma.banner.delete({ where: { id: Number(id) } });
      return { message: 'Banner deleted successfully' };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }
}
