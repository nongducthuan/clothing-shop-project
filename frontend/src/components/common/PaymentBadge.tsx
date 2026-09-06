import React from "react";

export function MoMoIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="22" fill="#A50064" />
      {/* Top row: m o */}
      <path d="M13 36V54H21V41.5C21 37.5 23.5 35.5 27 35.5C30.5 35.5 32.5 37.5 32.5 41.5V54H40.5V41.5C40.5 37.5 43 35.5 46.5 35.5C50 35.5 52 37.5 52 41.5V54H60V41C60 33 54.5 29.5 47 29.5C41.5 29.5 37.5 32.5 36.5 35.5C35 32.5 31.5 29.5 26.5 29.5C20.5 29.5 13 33 13 41Z" fill="white" />
      <circle cx="75" cy="42" r="12" stroke="white" strokeWidth="7" fill="none" />
      {/* Bottom row: m o */}
      <path d="M13 66V84H21V71.5C21 67.5 23.5 65.5 27 65.5C30.5 65.5 32.5 67.5 32.5 71.5V84H40.5V71.5C40.5 67.5 43 65.5 46.5 65.5C50 65.5 52 67.5 52 71.5V84H60V71C60 63 54.5 59.5 47 59.5C41.5 59.5 37.5 62.5 36.5 65.5C35 62.5 31.5 59.5 26.5 59.5C20.5 59.5 13 63 13 71Z" fill="white" />
      <circle cx="75" cy="72" r="12" stroke="white" strokeWidth="7" fill="none" />
    </svg>
  );
}

export function VnPayIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="22" fill="#005BAA" />
      <path d="M22 30L38 70H48L32 30H22Z" fill="#ED1C24" />
      <path d="M42 30L58 70H68L80 30H70L62 58L52 30H42Z" fill="white" />
    </svg>
  );
}

export function CodIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="5" width="20" height="14" rx="3" fill="#059669" />
      <circle cx="12" cy="12" r="3" fill="#ECFDF5" />
      <path d="M12 10.5V13.5M10.8 11.2H12.8M11.2 12.8H13.2" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="5" cy="8" r="1" fill="#A7F3D0" />
      <circle cx="19" cy="16" r="1" fill="#A7F3D0" />
    </svg>
  );
}

interface PaymentBadgeProps {
  method?: string;
  showText?: boolean;
  className?: string;
  badgeStyle?: boolean;
}

export function PaymentBadge({
  method,
  showText = true,
  className = "",
  badgeStyle = false,
}: PaymentBadgeProps) {
  const m = method?.toLowerCase();
  const isMomo = m === "momo";
  const isVnPay = m === "vnpay";
  const label = isVnPay ? "VNPay" : isMomo ? "MoMo" : "COD";

  const getIcon = (sizeClass: string) => {
    if (isVnPay) return <VnPayIcon className={sizeClass} />;
    if (isMomo) return <MoMoIcon className={sizeClass} />;
    return <CodIcon className={sizeClass} />;
  };

  if (badgeStyle) {
    const badgeColor = isVnPay
      ? "bg-blue-50 text-blue-700 border-blue-200/60"
      : isMomo
      ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/60"
      : "bg-emerald-50 text-emerald-700 border-emerald-200/60";

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badgeColor} ${className}`}>
        {getIcon("w-3.5 h-3.5 shrink-0")}
        {showText && <span>{label}</span>}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium ${className}`}>
      {getIcon("w-4 h-4 shrink-0")}
      {showText && <span>{label}</span>}
    </span>
  );
}

export default PaymentBadge;
