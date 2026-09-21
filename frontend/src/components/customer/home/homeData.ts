export const IMAGE_URL = import.meta.env.VITE_IMAGE_URL;

export const COLLECTIONS = [
  {
    img: "/assets/images/banner-family.png",
    title: "Family T-Shirts",
    title_vi: "Áo Phông Gia Đình",
    desc: "Discover colorful t-shirt palettes for all ages!",
    desc_vi: "Khám phá các bảng màu áo phông rực rỡ cho mọi lứa tuổi!",
  },
  {
    img: "/assets/images/banner-vietnam.png",
    title: "Proud of Vietnam",
    title_vi: "Tự Hào Việt Nam",
    desc: "Wear the national colors – honoring the spirit with meaningful designs, spreading love to every heart.",
    desc_vi: "Khoác lên màu cờ sắc áo – tôn vinh tinh thần với thiết kế ý nghĩa, lan tỏa yêu thương.",
  },
  {
    img: "/assets/images/banner-homewear.png",
    title: "Homewear",
    title_vi: "Đồ Mặc Nhà",
    desc: "Experience comfort with delicate, soft designs – making every moment at home truly relaxing.",
    desc_vi: "Trải nghiệm sự thoải mái với thiết kế mềm mại, tinh tế – giúp mỗi khoảnh khắc tại nhà thật thư thái.",
  },
];

export const GENDER_PROMOS = [
  {
    img: "/assets/images/men-wear.png",
    title: "MEN WEAR",
    title_vi: "THỜI TRANG NAM",
    desc: "Use code HELLONEW: 50K off first order over 299k",
    desc_vi: "Nhập mã HELLONEW: Giảm 50K cho đơn đầu tiên từ 299k",
  },
  {
    img: "/assets/images/women-active.png",
    title: "WOMEN ACTIVE",
    title_vi: "THỜI TRANG NỮ",
    desc: "Use code SEAMLESS50: 50K off Seamless Collection",
    desc_vi: "Nhập mã SEAMLESS50: Giảm 50K cho BST Seamless",
  },
];

export const LOOKBOOK_IMAGES = [
  "/assets/images/lookbook1.png",
  "/assets/images/lookbook2.png",
  "/assets/images/lookbook3.png",
];

import { Gift, Truck, RotateCcw } from "lucide-react";

export const POLICIES = [
  { icon: Gift, title: "Discounts", titleKey: "home.discounts", desc: "10% off for new customers", descKey: "home.discounts_desc", color: "text-amber-500 bg-amber-50" },
  { icon: Truck, title: "Free Shipping", titleKey: "home.free_shipping", desc: "Free shipping on orders over 500k", descKey: "home.free_shipping_desc", color: "text-indigo-600 bg-indigo-50" },
  { icon: RotateCcw, title: "Returns", titleKey: "home.returns", desc: "Free returns within 7 days", descKey: "home.returns_desc", color: "text-emerald-600 bg-emerald-50" },
];
