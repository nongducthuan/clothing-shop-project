import type { useNavigate } from "react-router-dom";

export type CategoryItem = { id: number; gender: string; name?: string; name_vi?: string; name_en?: string; image_url?: string; preview_image?: string; [key: string]: unknown };
export const GENDERS = ["male", "female", "unisex"] as const;
export type Gender = (typeof GENDERS)[number];

export type NavigateFn = ReturnType<typeof useNavigate>;
