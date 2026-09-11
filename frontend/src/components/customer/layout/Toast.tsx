import { useEffect, useState } from "react";

export default function Toast({ message, type = "success", onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  // Fade-in effect when component mounts
  useEffect(() => {
    setIsVisible(true);

    // Auto close after 3 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);

    // Wait for close animation (300ms) before calling onClose
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  // Configure colors and icons based on toast type
  const config = {
    success: {
      icon: "fa-circle-check",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/60",
      borderColor: "border-emerald-200 dark:border-emerald-900/50",
      textColor: "text-emerald-800 dark:text-emerald-200",
      iconColor: "text-emerald-500 dark:text-emerald-400",
      title: "Success",
    },
    error: {
      icon: "fa-circle-exclamation",
      bgColor: "bg-red-50 dark:bg-red-950/60",
      borderColor: "border-red-200 dark:border-red-900/50",
      textColor: "text-red-800 dark:text-red-200",
      iconColor: "text-red-500 dark:text-red-400",
      title: "Error",
    },
    warning: {
      icon: "fa-triangle-exclamation",
      bgColor: "bg-amber-50 dark:bg-amber-950/60",
      borderColor: "border-amber-200 dark:border-amber-900/50",
      textColor: "text-amber-800 dark:text-amber-200",
      iconColor: "text-amber-500 dark:text-amber-400",
      title: "Warning",
    },
    info: {
      icon: "fa-circle-info",
      bgColor: "bg-blue-50 dark:bg-blue-950/60",
      borderColor: "border-blue-200 dark:border-blue-900/50",
      textColor: "text-blue-800 dark:text-blue-200",
      iconColor: "text-blue-500 dark:text-blue-400",
      title: "Info",
    },
  };

  // If type is invalid, fallback to success (or info)
  const style = config[type] || config.success;

  return (
    <div
      className={`fixed top-5 right-5 z-[9999] flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 transform ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"
      } ${style.bgColor} ${style.borderColor}`}
      style={{ maxWidth: "350px", minWidth: "300px" }}
    >
      {/* Icon Section */}
      <div className={`mt-0.5 text-xl ${style.iconColor}`}>
        <i className={`fa-solid ${style.icon}`}></i>
      </div>

      {/* Content Section */}
      <div className="flex-1">
        <h4 className={`font-bold text-sm ${style.textColor}`}>{style.title}</h4>
        <p className={`text-sm mt-1 text-gray-600 dark:text-slate-300`}>{message}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
      >
        <i className="fa-solid fa-xmark"></i>
      </button>

      {/* Progress Bar (Optional - countdown bar at the bottom) */}
      <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20 w-full rounded-b-lg overflow-hidden">
        <div
          className={`h-full ${style.iconColor}`}
          style={{
            width: isVisible ? "0%" : "100%",
            transition: "width 3s linear",
          }}
        />
      </div>
    </div>
  );
}
