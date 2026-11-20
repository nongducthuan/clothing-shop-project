export interface BannerPayload {
  image_url?: string;
  title?: string | null;
  title_vi?: string | null;
  title_en?: string | null;
  subtitle?: string | null;
  subtitle_vi?: string | null;
  subtitle_en?: string | null;
}

export interface ColorPayload {
  color_name?: string | null;
  color_name_vi?: string | null;
  color_name_en?: string | null;
  color_code?: string | null;
  image_url?: string | null;
}

export interface SizePayload {
  size?: string;
  stock?: number | string;
  increment?: boolean;
}

export interface CategoryPayload {
  name?: string;
  name_vi?: string | null;
  name_en?: string | null;
  gender?: string;
  image_url?: string | null;
}

export interface MembershipPayload {
  name?: string;
  min_spending?: string | number;
  discount_percent?: string | number;
}
