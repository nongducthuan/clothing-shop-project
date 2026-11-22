import { Suspense } from "react";
import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "Thông tin cá nhân | Shop",
};

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4"></div>
        </div>
      }
    >
      <ProfileClient />
    </Suspense>
  );
}
