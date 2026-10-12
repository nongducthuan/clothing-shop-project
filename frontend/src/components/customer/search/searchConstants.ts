export const PRICE_RANGES = [
  { label: "All", label_vi: "Tất cả", min: 0, max: Infinity },
  { label: "Under 100k", label_vi: "Dưới 100k", min: 0, max: 100000 },
  { label: "100k - 300k", label_vi: "100k - 300k", min: 100000, max: 300000 },
  { label: "300k - 500k", label_vi: "300k - 500k", min: 300000, max: 500000 },
  { label: "Above 500k", label_vi: "Trên 500k", min: 500000, max: Infinity },
];

export const GENDERS = [
  { id: "all", labelKey: "gender.all", label: "All" },
  { id: "male", labelKey: "gender.male", label: "Male" },
  { id: "female", labelKey: "gender.female", label: "Female" },
  { id: "unisex", labelKey: "gender.unisex", label: "Unisex" },
];
