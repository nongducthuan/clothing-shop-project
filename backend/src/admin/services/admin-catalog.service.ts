import { Injectable } from '@nestjs/common';
import { AdminBannerService } from './admin-banner.service';
import { AdminCategoryService } from './admin-category.service';
import { AdminMembershipService } from './admin-membership.service';
import { AdminProductVariantService } from './admin-product-variant.service';

export type {
  BannerPayload,
  CategoryPayload,
  ColorPayload,
  MembershipPayload,
  SizePayload,
} from './admin-catalog.types';

/**
 * Compatibility facade for the admin catalog endpoints.
 * The implementation is delegated to services grouped by catalog responsibility.
 */
@Injectable()
export class AdminCatalogService {
  constructor(
    private readonly banners: AdminBannerService,
    private readonly variants: AdminProductVariantService,
    private readonly categories: AdminCategoryService,
    private readonly memberships: AdminMembershipService,
  ) {}

  getBanners() {
    return this.banners.getBanners();
  }

  addBanner(...args: Parameters<AdminBannerService['addBanner']>) {
    return this.banners.addBanner(...args);
  }

  editBanner(...args: Parameters<AdminBannerService['editBanner']>) {
    return this.banners.editBanner(...args);
  }

  removeBanner(...args: Parameters<AdminBannerService['removeBanner']>) {
    return this.banners.removeBanner(...args);
  }

  addColor(...args: Parameters<AdminProductVariantService['addColor']>) {
    return this.variants.addColor(...args);
  }

  removeColor(...args: Parameters<AdminProductVariantService['removeColor']>) {
    return this.variants.removeColor(...args);
  }

  addSize(...args: Parameters<AdminProductVariantService['addSize']>) {
    return this.variants.addSize(...args);
  }

  removeSize(...args: Parameters<AdminProductVariantService['removeSize']>) {
    return this.variants.removeSize(...args);
  }

  updateSize(...args: Parameters<AdminProductVariantService['updateSize']>) {
    return this.variants.updateSize(...args);
  }

  getInventory() {
    return this.variants.getInventory();
  }

  getCategories() {
    return this.categories.getCategories();
  }

  getCategoryRecommendations(...args: Parameters<AdminCategoryService['getCategoryRecommendations']>) {
    return this.categories.getCategoryRecommendations(...args);
  }

  createCategory(...args: Parameters<AdminCategoryService['createCategory']>) {
    return this.categories.createCategory(...args);
  }

  updateCategory(...args: Parameters<AdminCategoryService['updateCategory']>) {
    return this.categories.updateCategory(...args);
  }

  deleteCategory(...args: Parameters<AdminCategoryService['deleteCategory']>) {
    return this.categories.deleteCategory(...args);
  }

  getCategoryImages(...args: Parameters<AdminCategoryService['getCategoryImages']>) {
    return this.categories.getCategoryImages(...args);
  }

  getMemberships() {
    return this.memberships.getMemberships();
  }

  createMembership(...args: Parameters<AdminMembershipService['createMembership']>) {
    return this.memberships.createMembership(...args);
  }

  updateMembership(...args: Parameters<AdminMembershipService['updateMembership']>) {
    return this.memberships.updateMembership(...args);
  }

  deleteMembership(...args: Parameters<AdminMembershipService['deleteMembership']>) {
    return this.memberships.deleteMembership(...args);
  }
}
