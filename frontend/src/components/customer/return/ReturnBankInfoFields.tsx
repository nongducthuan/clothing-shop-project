import { useLanguage } from "../../../context/LanguageContext";

export interface BankFieldValues {
  bankName: string;
  bankNumber: string;
  accountHolder: string;
}

interface Props {
  values: BankFieldValues;
  onChange: (field: keyof BankFieldValues, value: string) => void;
  variant?: "compact" | "card";
  required?: boolean;
}

export default function ReturnBankInfoFields({ values, onChange, variant = "compact", required = true }: Props) {
  const { t } = useLanguage();
  const inputCls = variant === "card"
    ? "w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-3 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400"
    : "w-full p-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500";

  const fields = (
    <>
      <input type="text" placeholder={t("lookup.bank_name", "Tên ngân hàng")} required={required} className={inputCls} value={values.bankName} onChange={(e) => onChange("bankName", e.target.value)} />
      <input type="text" placeholder={t("lookup.bank_acc", "Số tài khoản")} required={required} className={inputCls} value={values.bankNumber} onChange={(e) => onChange("bankNumber", e.target.value)} />
      <input type="text" placeholder={t("lookup.bank_owner", "Tên chủ tài khoản")} required={required} className={`${inputCls} ${variant === "compact" ? "col-span-1 sm:col-span-2" : ""}`} value={values.accountHolder} onChange={(e) => onChange("accountHolder", e.target.value)} />
    </>
  );

  if (variant === "card") {
    return (
      <div className="p-5 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">{t("lookup.refund_info", "Thông tin tài khoản hoàn tiền")}</label>
        <div className="space-y-3">{fields}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="col-span-1 sm:col-span-2">
        <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase">{t("lookup.refund_info", "Thông tin tài khoản hoàn tiền")}</label>
      </div>
      {fields}
    </div>
  );
}
