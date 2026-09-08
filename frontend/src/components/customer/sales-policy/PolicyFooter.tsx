import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";

export default function PolicyFooter() {
  const { t } = useLanguage();

  return (
    <div className="mt-20 text-center pb-12 space-y-3">
      <p className="text-slate-500 dark:text-slate-400 text-sm">
        {t("policy.questions", "Have questions about our policies?")}{" "}
        <a
          href="mailto:support@shopquanao.com"
          className="text-slate-900 dark:text-slate-200 font-medium hover:underline underline-offset-4 transition-colors"
        >
          {t("policy.email_us", "Email us")}
        </a>{" "}
        {t("policy.or", "or")}{" "}
        <a
          href="https://zalo.me/0123456789"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-900 dark:text-slate-200 font-medium hover:underline underline-offset-4 transition-colors"
        >
          {t("policy.chat_zalo", "chat via Zalo")}
        </a>
        .
      </p>
      <p className="text-slate-400 dark:text-slate-500 text-xs">
        {t("policy.agree_terms", "By shopping with us, you agree to our")}{" "}
        <Link
          to="/sales-policy"
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 underline underline-offset-4 transition-colors"
        >
          {t("policy.header_title", "Sales Policy")}
        </Link>
        {" "}{t("policy.and", "and")}{" "}
        <a
          href="mailto:support@shopquanao.com"
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 underline underline-offset-4 transition-colors"
        >
          {t("policy.contact_support_link", "contact support")}
        </a>{" "}
        {t("policy.warranty_note", "for return & warranty requests.")}
      </p>
    </div>
  );
}

