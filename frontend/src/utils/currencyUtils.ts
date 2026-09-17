/**
 * Formats a given amount into a localized currency string.
 * @param amount The numeric amount to format.
 * @param language The target language ('vi' or 'en'). Defaults to 'vi'.
 * @returns The formatted currency string.
 */
export const formatCurrency = (amount: number | string | null | undefined, language: string = 'vi'): string => {
  const validAmount = Number(amount) || 0;
  if (language === 'en') {
    return 'VND ' + new Intl.NumberFormat('en-US').format(validAmount);
  }
  
  return new Intl.NumberFormat('vi-VN').format(validAmount) + ' ₫';
};

/**
 * Đơn giá thực tế khách phải trả cho 1 đơn vị sản phẩm trong đơn hàng.
 * Ưu tiên `payable_amount` (đã trừ Voucher/Membership được phân bổ pro-rata) do Backend trả về,
 * fallback về `price` đối với các đơn hàng cũ chưa có trường payable_amount.
 */
export const getItemUnitPayableAmount = (item: {
  price?: number | string | null;
  quantity?: number | string | null;
  payable_amount?: number | string | null;
} | null | undefined): number => {
  if (!item) return 0;
  const quantity = Number(item.quantity) || 1;
  if (item.payable_amount !== undefined && item.payable_amount !== null && item.payable_amount !== '') {
    return (Number(item.payable_amount) || 0) / quantity;
  }
  return Number(item.price) || 0;
};

