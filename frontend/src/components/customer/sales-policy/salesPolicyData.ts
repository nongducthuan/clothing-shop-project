import { Truck, RotateCcw, ShieldCheck } from "lucide-react";

export const POLICIES = [
  {
    icon: Truck,
    styleClass: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    title: "Fast Delivery",
    titleKey: "policy.fast_delivery_title",
    desc: "Free for orders over 300k. Inner city delivery in 2h.",
    descKey: "policy.fast_delivery_desc",
  },
  {
    icon: RotateCcw,
    styleClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    title: "Easy Returns",
    titleKey: "policy.easy_returns_title",
    desc: "7-day free return if unsatisfied or manufacturer defect.",
    descKey: "policy.easy_returns_desc",
  },
  {
    icon: ShieldCheck,
    styleClass: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
    title: "Secure Payment",
    titleKey: "policy.secure_payment_title",
    desc: "Supports multiple methods: MoMo, VNPay, secure COD.",
    descKey: "policy.secure_payment_desc",
  },
];

export const DISCOUNT_CODE = "HELLONEW";

export const NEW_CUSTOMER_BENEFITS = [
  { en: "Get 10% off your first order with code HELLONEW", vi: "Giảm 10% đơn hàng đầu tiên với mã HELLONEW" },
  { en: "Free nationwide shipping for orders over 500k", vi: "Miễn phí vận chuyển toàn quốc cho đơn hàng từ 500k" },
  { en: "Free returns within 30 days (unused, tags intact)", vi: "Miễn phí đổi trả trong 30 ngày (chưa qua sử dụng, nguyên tem)" },
  { en: "Complimentary gift-wrapping on first purchase", vi: "Miễn phí gói quà tặng cho đơn hàng đầu tiên" },
  { en: "Priority live chat support for new members", vi: "Ưu tiên hỗ trợ tư vấn trực tuyến cho thành viên mới" },
];

export const VIP_BENEFITS = [
  { en: "Spend 5 million VND total to reach Bronze tier", vi: "Tích lũy 5 triệu VNĐ để đạt hạng Đồng (Bronze)" },
  { en: "Earn loyalty points: every 10k spent = 1 point", vi: "Tích điểm thành viên: 10k chi tiêu = 1 điểm" },
  { en: "Up to 20% membership discount based on your tier", vi: "Chiết khấu thành viên lên đến 20% tùy theo hạng" },
  { en: "Exclusive Birthday gifts sent to your address", vi: "Quà tặng sinh nhật đặc biệt gửi tận nơi" },
  { en: "Priority access to Sales events 24h early", vi: "Quyền truy cập sớm các sự kiện Sale trước 24h" },
  { en: "Dedicated VIP customer support hotline", vi: "Hotline hỗ trợ riêng dành cho khách hàng VIP" },
];

