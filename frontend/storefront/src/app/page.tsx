export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
      <div className="max-w-xl mx-auto space-y-4">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400">
          Next.js 16 App Router
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          LOOM Storefront
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
          Khung ứng dụng Next.js 16 đã được khởi tạo thành công với App Router, đầy đủ Providers, Navbar, Footer và Realtime Notification.
        </p>
      </div>
    </div>
  );
}
