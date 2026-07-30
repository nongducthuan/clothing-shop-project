import React from "react";

export default function PolicyFooter() {
  return (
    <div className="mt-20 text-center pb-12">
      <p className="text-slate-500 text-sm">
        Need more information? View detailed{" "}
        <a href="#" className="text-slate-900 font-medium hover:underline underline-offset-4 transition-colors">
          Return Policy
        </a>{" "}
        and{" "}
        <a href="#" className="text-slate-900 font-medium hover:underline underline-offset-4 transition-colors">
          Warranty Policy
        </a>.
      </p>
    </div>
  );
}
