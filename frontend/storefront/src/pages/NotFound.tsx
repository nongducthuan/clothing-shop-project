import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 py-24 text-center">
      <h1 className="text-8xl font-bold text-slate-300 dark:text-slate-600">404</h1>
      <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">
        Trang không tồn tại
      </h2>
      <p className="text-slate-500 dark:text-slate-400">
        Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.
      </p>
      <button
        onClick={() => navigate("/")}
        className="mt-2 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
      >
        Về trang chủ
      </button>
    </div>
  );
}
