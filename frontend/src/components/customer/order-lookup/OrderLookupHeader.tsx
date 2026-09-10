import React from "react";

export default function OrderLookupHeader({ step, email }) {
  const stepConfig = {
    1: { icon: "fa-envelope", title: "Tra cứu đơn hàng", sub: "Nhập email đã dùng để mua hàng" },
    2: { icon: "fa-lock", title: "Xác minh OTP", sub: "Vui lòng kiểm tra hộp thư của bạn" },
    3: { icon: "fa-box-open", title: "Danh sách đơn hàng", sub: `Kết quả cho: ${email}` },
    4: { icon: "fa-rotate-left", title: "Yêu cầu đổi trả", sub: "Vui lòng cung cấp thông tin đổi trả" },
  };

  const currentStep = stepConfig[step];

  return (
    <div className="bg-violet-600 p-4 sm:p-6 text-center text-white">
      <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mb-2 sm:mb-3">
        <i className={`fa-solid ${currentStep.icon} text-xl sm:text-2xl`}></i>
      </div>
      <h2 className="text-xl sm:text-2xl font-bold leading-tight">{currentStep.title}</h2>
      <p className="text-violet-100 text-xs sm:text-sm mt-1 truncate px-2">{currentStep.sub}</p>
    </div>
  );
}
